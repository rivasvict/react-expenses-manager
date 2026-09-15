// Unit tests for the party-creation handler (./createParty.ts). The AC tags
// named below are the acceptance criteria in docs/multi-user-sync/PRD.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCreatePartyHandler } from "./createParty";
import { createSetUserPartyId } from "./parties";
import { createHasActivePartyMembership } from "./partyAccess";
import { partyKey } from "./partyKeys";
import { userKey } from "./userKeys";
import {
  AppRequest,
  ErrorBody,
  Handler,
  PartyBody,
  PartyRecord,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { createMemoryStorage, StorageAdapter } from "../storage";

const NOW = 1700000000000;

const jane: UserRecord = {
  id: "user-1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  password: {
    algo: "scrypt",
    N: 16384,
    r: 8,
    p: 1,
    saltB64: "c2FsdA==",
    hashB64: "aGFzaA==",
  },
  partyId: null,
  createdAt: NOW,
};

const request: AppRequest = { method: "POST", path: "/api/party" };

const handlerFor = (
  user: UserRecord | null,
  storage: StorageAdapter = createMemoryStorage()
): Handler =>
  createCreatePartyHandler({
    storage,
    authenticate: async () => user,
    hasActivePartyMembership: createHasActivePartyMembership({ storage }),
    setUserPartyId: createSetUserPartyId({ storage }),
    now: () => NOW,
  });

const EXISTING_PARTY_ID = "party-existing";

// Jane as a member of somebody else's party, with the flags under test.
const existingPartyWith = (overrides: {
  canceled?: boolean;
  janeBlocked?: boolean;
}): PartyRecord => ({
  id: EXISTING_PARTY_ID,
  name: "Tom's Party",
  organizerId: "user-2",
  members: [
    {
      id: "user-2",
      firstName: "Tom",
      lastName: "Doe",
      email: "tom@example.com",
      blocked: false,
    },
    {
      id: jane.id,
      firstName: "Jane",
      lastName: "Doe",
      email: jane.email,
      blocked: overrides.janeBlocked ?? false,
    },
  ],
  canceled: overrides.canceled ?? false,
  invitations: {},
  createdAt: NOW,
});

// A storage with the existing party stored, and Jane's record pointing at it.
const storageWithExistingParty = async (
  party: PartyRecord
): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  await storage.writeJson(userKey(jane.email), {
    ...jane,
    partyId: party.id,
  });
  return storage;
};

const janeIn = (party: PartyRecord): UserRecord => ({
  ...jane,
  partyId: party.id,
});

test("the creator becomes the organizer and the only member", async () => {
  const response = await handlerFor(jane)(request);

  assert.equal(response.status, HTTP_STATUS.CREATED);
  const { party } = response.body as PartyBody;
  assert.equal(party.organizerId, jane.id);
  assert.equal(party.canceled, false);
  assert.equal(party.youAreBlocked, false);
  assert.deepEqual(party.members, [
    {
      id: jane.id,
      firstName: "Jane",
      lastName: "Doe",
      email: jane.email,
      blocked: false,
    },
  ]);
});

test("the party is auto-named after the creator's first name", async () => {
  const response = await handlerFor({ ...jane, firstName: "Tom" })(request);

  assert.equal((response.body as PartyBody).party.name, "Tom's Party");
});

test("the new party is persisted with a version, ready for later CAS writes", async () => {
  const storage = createMemoryStorage();
  const response = await handlerFor(jane, storage)(request);

  const { party } = response.body as PartyBody;
  const record = await storage.readJsonVersioned<PartyRecord>(
    partyKey(party.id)
  );
  assert.equal(record?.version, "1");
  assert.equal(record?.value.organizerId, jane.id);
  assert.deepEqual(record?.value.invitations, {});
  assert.equal(record?.value.createdAt, NOW);
});

test("the creator's user record is pointed back at the new party", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson(userKey(jane.email), jane);

  const response = await handlerFor(jane, storage)(request);

  // Without this backlink /api/me could never find the party again, so the
  // creator would land back on the "no party" screen after a reload.
  const stored = await storage.readJson<UserRecord>(userKey(jane.email));
  assert.equal(stored?.partyId, (response.body as PartyBody).party.id);
});

test("a user who already has a party is refused (AC-2.2)", async () => {
  const existing = existingPartyWith({});
  const storage = await storageWithExistingParty(existing);

  const response = await handlerFor(janeIn(existing), storage)(request);

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.ALREADY_IN_PARTY
  );
});

test("a refused creation writes no party at all", async () => {
  const existing = existingPartyWith({});
  const inner = await storageWithExistingParty(existing);
  let partyWrites = 0;
  const storage: StorageAdapter = {
    ...inner,
    writeJsonVersioned: async (...args) => {
      partyWrites += 1;
      return inner.writeJsonVersioned(...args);
    },
  };

  await handlerFor(janeIn(existing), storage)(request);

  // A second party must not be left behind orphaned by the rejection, and
  // the user must still point at the party they actually belong to.
  assert.equal(partyWrites, 0);
  assert.equal(
    (await storage.readJson<UserRecord>(userKey(jane.email)))?.partyId,
    EXISTING_PARTY_ID
  );
});

// DESIGN §3.6 (docs/multi-user-sync/DESIGN.md): being blocked, or losing a
// canceled party, leaves the user free to start over. Their record still
// points at the old party — the member row stays behind as attribution
// history (AC-2.9) — so the gate has to read the party, not the pointer.

test("a blocked member of another party may create a new one", async () => {
  const existing = existingPartyWith({ janeBlocked: true });
  const storage = await storageWithExistingParty(existing);

  const response = await handlerFor(janeIn(existing), storage)(request);

  assert.equal(response.status, HTTP_STATUS.CREATED);
  const { party } = response.body as PartyBody;
  assert.equal(party.name, "Jane's Party");
  assert.notEqual(party.id, EXISTING_PARTY_ID);
  // The pointer has moved on to the new party...
  assert.equal(
    (await storage.readJson<UserRecord>(userKey(jane.email)))?.partyId,
    party.id
  );
  // ...while the old party still records her as a blocked member.
  const old = await storage.readJsonVersioned<PartyRecord>(
    partyKey(EXISTING_PARTY_ID)
  );
  assert.ok(
    old?.value.members.some((member) => member.id === jane.id && member.blocked)
  );
});

test("a member of a canceled party may create a new one", async () => {
  const existing = existingPartyWith({ canceled: true });
  const storage = await storageWithExistingParty(existing);

  const response = await handlerFor(janeIn(existing), storage)(request);

  assert.equal(response.status, HTTP_STATUS.CREATED);
  assert.notEqual((response.body as PartyBody).party.id, EXISTING_PARTY_ID);
});

test("a pointer to a party that no longer exists does not block creation", async () => {
  // Nothing to belong to, so nothing to be refused over — the alternative
  // would strand the user with no way to ever get a party again.
  const response = await handlerFor({ ...jane, partyId: "party-gone" })(
    request
  );

  assert.equal(response.status, HTTP_STATUS.CREATED);
});

test("an unauthenticated request is refused with 401", async () => {
  const response = await handlerFor(null)(request);

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
});

// The create-only write can only be refused if the generated id already
// exists — a randomId() collision. That is far too unlikely to provoke by
// generating ids, so the refusal is injected at the storage seam instead.
const refusingCreateOnlyWrites = (storage: StorageAdapter): StorageAdapter => ({
  ...storage,
  writeJsonVersioned: async () => null,
});

test("a party id collision is reported as a retryable conflict", async () => {
  const storage = refusingCreateOnlyWrites(createMemoryStorage());

  const response = await handlerFor(jane, storage)(request);

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.CONFLICT);
});

test("a party that was not persisted leaves the user unattached", async () => {
  const inner = createMemoryStorage();
  await inner.writeJson(userKey(jane.email), jane);

  await handlerFor(jane, refusingCreateOnlyWrites(inner))(request);

  // The backlink is written only after the party lands. Pointing the user at
  // a party that was never stored would strand them: /api/me would look up a
  // party id that resolves to nothing, with no way back to creating one.
  assert.equal(
    (await inner.readJson<UserRecord>(userKey(jane.email)))?.partyId,
    null
  );
});

test("two parties created in a row get different ids", async () => {
  const storage = createMemoryStorage();
  const first = await handlerFor(jane, storage)(request);
  const second = await handlerFor(jane, storage)(request);

  assert.notEqual(
    (first.body as PartyBody).party.id,
    (second.body as PartyBody).party.id
  );
});
