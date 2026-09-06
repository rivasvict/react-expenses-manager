// Unit tests for the invitation-redemption handler (./joinParty.ts). The
// edge cases here are the ones the PRD calls out by name (EC-6/7/8,
// docs/multi-user-sync/PRD.md), because each is a way an invitation could be
// wrongly consumed or wrongly honoured.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJoinPartyHandler } from "./joinParty";
import { createMutateParty, createSetUserPartyId } from "./parties";
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
    mutateParty: createMutateParty({ storage }),
    setUserPartyId: createSetUserPartyId({ storage }),
    encryptionKey,
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

test("a wrong password is refused and does NOT consume the invitation (EC-7)", async () => {
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

test("an already-used invitation is permanently rejected (AC-2.6/EC-8)", async () => {
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

test("a user already in a party is refused without consuming it (EC-6)", async () => {
  const storage = await seeded(partyWith());

  const response = await handlerFor(
    { ...tom, partyId: "party-elsewhere" },
    storage
  )(request());

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.ALREADY_IN_PARTY
  );
  assert.equal(await invitationIsUsed(storage), false);
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
