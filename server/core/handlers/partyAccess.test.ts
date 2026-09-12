// Unit tests for the party-standing helpers (./partyAccess.ts). Both read the
// party record rather than the user's pointer, and these pin the cases where
// the two disagree — that disagreement is the whole reason they exist
// (docs/multi-user-sync/DESIGN.md §3.6).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHasActivePartyMembership,
  createRequirePartyAccess,
} from "./partyAccess";
import { partyKey } from "./partyKeys";
import { AppRequest, ErrorBody, PartyRecord, UserRecord } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { createMemoryStorage, StorageAdapter } from "../storage";

const NOW = 1700000000000;

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
  partyId: "party-1",
  createdAt: NOW,
};

const partyWith = (overrides: {
  canceled?: boolean;
  tomBlocked?: boolean;
}): PartyRecord => ({
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

const storageWith = async (party: PartyRecord): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  return storage;
};

const request: AppRequest = { method: "GET", path: "/api/party/backup" };

const accessFor = (user: UserRecord | null, storage: StorageAdapter) =>
  createRequirePartyAccess({ storage, authenticate: async () => user });

const errorCode = (body: unknown) => (body as ErrorBody).error.code;

// --- hasActivePartyMembership ---------------------------------------------

test("an active member of an active party has an active membership", async () => {
  const storage = await storageWith(partyWith({}));

  assert.equal(await createHasActivePartyMembership({ storage })(tom), true);
});

test("a user with no party has no active membership", async () => {
  const storage = await storageWith(partyWith({}));

  assert.equal(
    await createHasActivePartyMembership({ storage })({ ...tom, partyId: null }),
    false
  );
});

test("a pointer to a party that no longer exists is no membership", async () => {
  const storage = createMemoryStorage();

  assert.equal(await createHasActivePartyMembership({ storage })(tom), false);
});

test("a blocked member has no active membership", async () => {
  // The user record still says party-1; only the party knows he is blocked.
  const storage = await storageWith(partyWith({ tomBlocked: true }));

  assert.equal(await createHasActivePartyMembership({ storage })(tom), false);
});

test("a member of a canceled party has no active membership", async () => {
  const storage = await storageWith(partyWith({ canceled: true }));

  assert.equal(await createHasActivePartyMembership({ storage })(tom), false);
  // Including the organizer: canceling frees everyone.
  assert.equal(await createHasActivePartyMembership({ storage })(jane), false);
});

// --- requirePartyAccess ---------------------------------------------------

test("an admitted member gets their user, the party and its version", async () => {
  const storage = await storageWith(partyWith({}));

  const result = await accessFor(tom, storage)(request);

  assert.equal(result.response, undefined);
  assert.equal(result.access?.user.id, tom.id);
  assert.equal(result.access?.party.id, "party-1");
  // The version is what a later compare-and-swap write on the party needs,
  // so it must be the one the record was read under.
  assert.equal(result.access?.version, "1");
});

test("an unauthenticated request is refused with 401 UNAUTHORIZED", async () => {
  const storage = await storageWith(partyWith({}));

  const result = await accessFor(null, storage)(request);

  assert.equal(result.access, undefined);
  assert.equal(result.response?.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(errorCode(result.response?.body), ERROR_CODES.UNAUTHORIZED);
});

test("a user with no party is refused with 404 NO_PARTY", async () => {
  const storage = await storageWith(partyWith({}));

  const result = await accessFor({ ...tom, partyId: null }, storage)(request);

  assert.equal(result.response?.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(errorCode(result.response?.body), ERROR_CODES.NO_PARTY);
});

test("a pointer to a party that no longer exists is refused as NO_PARTY", async () => {
  const storage = createMemoryStorage();

  const result = await accessFor(tom, storage)(request);

  assert.equal(result.response?.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(errorCode(result.response?.body), ERROR_CODES.NO_PARTY);
});

test("a blocked member is refused with 403 BLOCKED (EC-9)", async () => {
  const storage = await storageWith(partyWith({ tomBlocked: true }));

  const result = await accessFor(tom, storage)(request);

  assert.equal(result.response?.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(errorCode(result.response?.body), ERROR_CODES.BLOCKED);
});

test("blocking one member does not refuse the others", async () => {
  const storage = await storageWith(partyWith({ tomBlocked: true }));

  const result = await accessFor(jane, storage)(request);

  assert.equal(result.response, undefined);
  assert.equal(result.access?.user.id, jane.id);
});

test("a member of a canceled party is refused with 410 PARTY_CANCELED", async () => {
  const storage = await storageWith(partyWith({ canceled: true }));

  for (const user of [jane, tom]) {
    const result = await accessFor(user, storage)(request);
    assert.equal(result.response?.status, HTTP_STATUS.GONE);
    assert.equal(errorCode(result.response?.body), ERROR_CODES.PARTY_CANCELED);
  }
});

test("blocked wins over canceled for a member who is both", async () => {
  // The refusal a person hears should be the one that applies to them
  // personally: they were removed, whatever later happened to the party.
  const storage = await storageWith(partyWith({ canceled: true, tomBlocked: true }));

  const result = await accessFor(tom, storage)(request);

  assert.equal(result.response?.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(errorCode(result.response?.body), ERROR_CODES.BLOCKED);
});

test("the gate only reads — a refused or admitted call writes nothing", async () => {
  const storage = await storageWith(partyWith({ tomBlocked: true }));
  const before = await storage.readJsonVersioned(partyKey("party-1"));

  await accessFor(tom, storage)(request);
  await accessFor(jane, storage)(request);

  assert.deepEqual(await storage.readJsonVersioned(partyKey("party-1")), before);
});
