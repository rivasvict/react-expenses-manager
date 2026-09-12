// Unit tests for the invitation-redemption handler (./joinParty.ts). The
// edge cases here are the ones the PRD calls out by name (EC-6/7/8,
// docs/multi-user-sync/PRD.md), because each is a way an invitation could be
// wrongly consumed or wrongly honoured.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJoinPartyHandler } from "./joinParty";
import { createMutateParty, createSetUserPartyId } from "./parties";
import { createHasActivePartyMembership } from "./partyAccess";
import { invitationPointerKey, partyKey } from "./partyKeys";
import { userKey } from "./userKeys";
import {
  AppRequest,
  ErrorBody,
  Handler,
  InvitationPointer,
  InvitationRecord,
  PartyBody,
  PartyRecord,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import {
  codeLookupHash,
  decryptRecord,
  deriveEncryptionKey,
  encryptRecord,
} from "../invitations";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { hashPassword } from "../crypto";

const NOW = 1700000000000;
const encryptionKey = deriveEncryptionKey("test-encryption-secret");
const CODE = "K7X9-QP2M";
const INVITE_PASSWORD = "invite-pass";
const lookupHash = codeLookupHash(CODE, encryptionKey);

const scrypt = {
  algo: "scrypt" as const,
  N: 16384,
  r: 8,
  p: 1,
  saltB64: "c2FsdA==",
  hashB64: "aGFzaA==",
};

const jane: UserRecord = {
  id: "user-1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  password: scrypt,
  partyId: "party-1",
  createdAt: NOW,
};

const tom: UserRecord = {
  id: "user-2",
  email: "tom@example.com",
  firstName: "Tom",
  lastName: "Doe",
  password: scrypt,
  partyId: null,
  createdAt: NOW,
};

const invitation: InvitationRecord = {
  password: hashPassword(INVITE_PASSWORD),
  used: false,
  createdBy: jane.id,
  createdAt: NOW,
};

const partyWith = (
  overrides: Partial<PartyRecord> = {},
  record: InvitationRecord = invitation
): PartyRecord => ({
  id: "party-1",
  name: "Jane's Party",
  organizerId: jane.id,
  members: [
    {
      id: jane.id,
      firstName: "Jane",
      lastName: "Doe",
      email: jane.email,
      blocked: false,
    },
  ],
  canceled: false,
  invitations: { [lookupHash]: encryptRecord(record, encryptionKey) },
  createdAt: NOW,
  ...overrides,
});

// A storage holding the party, its invitation pointer, and Tom's account.
const seeded = async (party: PartyRecord): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  await storage.writeJson(invitationPointerKey(lookupHash), {
    partyId: party.id,
  } as InvitationPointer);
  await storage.writeJson(userKey(tom.email), tom);
  return storage;
};

const handlerFor = (user: UserRecord | null, storage: StorageAdapter): Handler =>
  createJoinPartyHandler({
    storage,
    authenticate: async () => user,
    hasActivePartyMembership: createHasActivePartyMembership({ storage }),
    mutateParty: createMutateParty({ storage }),
    setUserPartyId: createSetUserPartyId({ storage }),
    encryptionKey,
  });

// Tom's own, separate party — the "elsewhere" he already belongs to in the
// EC-6 cases. Stored under a different id so it never collides with the
// party holding the invitation.
const ELSEWHERE_ID = "party-elsewhere";
const elsewhereWith = (overrides: {
  canceled?: boolean;
  tomBlocked?: boolean;
}): PartyRecord => ({
  id: ELSEWHERE_ID,
  name: "Sam's Party",
  organizerId: "user-3",
  members: [
    {
      id: "user-3",
      firstName: "Sam",
      lastName: "Doe",
      email: "sam@example.com",
      blocked: false,
    },
    {
      id: tom.id,
      firstName: "Tom",
      lastName: "Doe",
      email: tom.email,
      blocked: overrides.tomBlocked ?? false,
    },
  ],
  canceled: overrides.canceled ?? false,
  invitations: {},
  createdAt: NOW,
});

const seededWithElsewhere = async (
  elsewhere: PartyRecord
): Promise<StorageAdapter> => {
  const storage = await seeded(partyWith());
  await storage.writeJsonVersioned(partyKey(elsewhere.id), elsewhere, {
    expectedVersion: null,
  });
  return storage;
};

const tomIn = (party: PartyRecord): UserRecord => ({
  ...tom,
  partyId: party.id,
});

const request = (
  body: unknown = { code: CODE, password: INVITE_PASSWORD }
): AppRequest => ({ method: "POST", path: "/api/party/join", body });

const readParty = (storage: StorageAdapter, id = "party-1") =>
  storage.readJsonVersioned<PartyRecord>(partyKey(id));

const invitationIsUsed = async (storage: StorageAdapter): Promise<boolean> => {
  const stored = (await readParty(storage))?.value;
  return (
    decryptRecord<InvitationRecord>(
      stored?.invitations[lookupHash],
      encryptionKey
    )?.used === true
  );
};

test("a valid code and password join the party", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(tom, storage)(request());

  assert.equal(response.status, HTTP_STATUS.OK);
  const { party } = response.body as PartyBody;
  assert.equal(party.id, "party-1");
  assert.deepEqual(
    party.members.map((member) => member.id),
    [jane.id, tom.id]
  );
  assert.equal(party.youAreBlocked, false);
});

test("joining marks the invitation used and points the user at the party", async () => {
  const storage = await seeded(partyWith());
  await handlerFor(tom, storage)(request());

  assert.equal(await invitationIsUsed(storage), true);
  assert.equal(
    (await storage.readJson<UserRecord>(userKey(tom.email)))?.partyId,
    "party-1"
  );
});

test("hand-typed variants of the code resolve to the same invitation", async () => {
  for (const typed of ["k7x9qp2m", " K7X9QP2M ", "k7x9-QP2M"]) {
    const storage = await seeded(partyWith());
    const response = await handlerFor(tom, storage)(
      request({ code: typed, password: INVITE_PASSWORD })
    );

    assert.equal(response.status, HTTP_STATUS.OK, `code ${typed} should join`);
  }
});

test("a wrong password is refused and does NOT consume the invitation", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(tom, storage)(
    request({ code: CODE, password: "not-it" })
  );

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_WRONG_PASSWORD
  );
  // The invitation survives, and no one was added on the way out.
  assert.equal(await invitationIsUsed(storage), false);
  assert.equal((await readParty(storage))?.value.members.length, 1);
});

test("an already-used invitation is permanently rejected", async () => {
  const storage = await seeded(partyWith({}, { ...invitation, used: true }));

  const response = await handlerFor(tom, storage)(request());

  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_USED
  );
});

test("a used invitation reports the same way for a wrong password", async () => {
  const storage = await seeded(partyWith({}, { ...invitation, used: true }));

  const response = await handlerFor(tom, storage)(
    request({ code: CODE, password: "not-it" })
  );

  // Checking `used` before the password means a spent invitation cannot be
  // used as an oracle to test password guesses against.
  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_USED
  );
});

test("a user already in a party is refused without consuming it", async () => {
  const elsewhere = elsewhereWith({});
  const storage = await seededWithElsewhere(elsewhere);

  const response = await handlerFor(tomIn(elsewhere), storage)(request());

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.ALREADY_IN_PARTY
  );
  assert.equal(await invitationIsUsed(storage), false);
});

// DESIGN §3.6 (docs/multi-user-sync/DESIGN.md): a membership that is no
// longer active — blocked, or in a canceled party — does not stand in the
// way of joining somewhere else, even though the user's record still points
// at the old party.

test("a member blocked elsewhere may join", async () => {
  const elsewhere = elsewhereWith({ tomBlocked: true });
  const storage = await seededWithElsewhere(elsewhere);

  const response = await handlerFor(tomIn(elsewhere), storage)(request());

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.equal((response.body as PartyBody).party.id, "party-1");
  assert.equal(
    (await storage.readJson<UserRecord>(userKey(tom.email)))?.partyId,
    "party-1"
  );
  // The old party keeps its (blocked) row for him — nothing is rewritten
  // there on the way out.
  const old = await storage.readJsonVersioned<PartyRecord>(
    partyKey(ELSEWHERE_ID)
  );
  assert.ok(
    old?.value.members.some((member) => member.id === tom.id && member.blocked)
  );
});

test("a member of a canceled party may join elsewhere", async () => {
  const elsewhere = elsewhereWith({ canceled: true });
  const storage = await seededWithElsewhere(elsewhere);

  const response = await handlerFor(tomIn(elsewhere), storage)(request());

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.equal((response.body as PartyBody).party.id, "party-1");
});

test("a member blocked in this party cannot restore access by redeeming an old code", async () => {
  // Tom was in Jane's party before and was blocked there; he still holds a
  // valid, unused invitation code for that same party.
  const storage = await seeded(
    partyWith({
      members: [
        {
          id: jane.id,
          firstName: "Jane",
          lastName: "Doe",
          email: jane.email,
          blocked: false,
        },
        {
          id: tom.id,
          firstName: "Tom",
          lastName: "Doe",
          email: tom.email,
          blocked: true,
        },
      ],
    })
  );

  const response = await handlerFor({ ...tom, partyId: "party-1" }, storage)(
    request()
  );

  assert.equal(response.status, HTTP_STATUS.FORBIDDEN);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.BLOCKED);
  // Redeeming is refused, so the invitation stays usable and Tom's row is
  // untouched — re-admitting him is a deliberate organizer action, not a
  // side effect of an old code.
  assert.equal(await invitationIsUsed(storage), false);
  const stored = (await readParty(storage))?.value;
  assert.equal(
    stored?.members.filter((member) => member.id === tom.id).length,
    1
  );
  assert.equal(
    stored?.members.find((member) => member.id === tom.id)?.blocked,
    true
  );
});

test("an unknown code is not found", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(tom, storage)(
    request({ code: "AAAA-AAAA", password: INVITE_PASSWORD })
  );

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_NOT_FOUND
  );
});

test("a pointer to a party that no longer exists reads as not found", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson(invitationPointerKey(lookupHash), {
    partyId: "party-gone",
  } as InvitationPointer);

  const response = await handlerFor(tom, storage)(request());

  // Not NO_PARTY: to the invitee there is simply nothing to redeem, and the
  // generic answer avoids confirming to a stranger that the code was real.
  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_NOT_FOUND
  );
});

test("a code pointing at a party that does not hold it is not found", async () => {
  // The pointer resolves, but the party carries no invitation under that
  // hash — the decrypt returns null and must not be mistaken for a match.
  const storage = await seeded(partyWith({ invitations: {} }));

  const response = await handlerFor(tom, storage)(request());

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.INVITATION_NOT_FOUND
  );
});

test("a canceled party cannot be joined", async () => {
  const storage = await seeded(partyWith({ canceled: true }));

  const response = await handlerFor(tom, storage)(request());

  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.PARTY_CANCELED
  );
  assert.equal(await invitationIsUsed(storage), false);
});

test("a missing code or password is a validation error", async () => {
  const storage = await seeded(partyWith());
  const handler = handlerFor(tom, storage);

  for (const body of [{}, { code: CODE }, { password: INVITE_PASSWORD }, null]) {
    const response = await handler(request(body));
    assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(
      (response.body as ErrorBody).error.code,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  assert.equal(await invitationIsUsed(storage), false);
});

test("an unauthenticated request is refused with 401", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(null, storage)(request());

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
  assert.equal(await invitationIsUsed(storage), false);
});

test("the joined party's invitations never reach the response", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(tom, storage)(request());

  const serialized = JSON.stringify(response.body);
  assert.ok(!serialized.includes("invitations"));
  assert.ok(!serialized.includes(lookupHash));
});
