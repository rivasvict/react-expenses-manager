// Unit tests for the cancel-party handler (./cancelParty.ts). As with
// blocking, the organizer check is the security boundary (AC-2.12,
// docs/multi-user-sync/PRD.md): remove it and "a plain member cannot cancel
// the party" below is what fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCancelPartyHandler } from "./cancelParty";
import { createMutateParty } from "./parties";
import { partyKey } from "./partyKeys";
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

const party: PartyRecord = {
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
      // Already blocked: cancelling must not disturb existing flags.
      blocked: true,
    },
  ],
  canceled: false,
  invitations: { "some-lookup-hash": "encrypted-blob" },
  createdAt: NOW,
};

const seeded = async (): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  return storage;
};

const handlerFor = (user: UserRecord | null, storage: StorageAdapter): Handler =>
  createCancelPartyHandler({
    authenticate: async () => user,
    mutateParty: createMutateParty({ storage }),
  });

const request: AppRequest = { method: "POST", path: "/api/party/cancel" };

const readParty = (storage: StorageAdapter) =>
  storage.readJsonVersioned<PartyRecord>(partyKey("party-1"));

test("the organizer cancels the party: flagged and persisted", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(request);

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.equal((response.body as PartyBody).party.canceled, true);
  assert.equal((await readParty(storage))?.value.canceled, true);
});

test("cancelling touches nothing but the flag", async () => {
  const storage = await seeded();

  await handlerFor(jane, storage)(request);

  const stored = (await readParty(storage))!.value;
  // Every member keeps their row and their standing (AC-2.10): the list is
  // the party's history, and the blocked flag still says who was removed.
  assert.deepEqual(stored.members, party.members);
  assert.equal(stored.name, party.name);
  assert.equal(stored.organizerId, party.organizerId);
  assert.deepEqual(stored.invitations, party.invitations);
});

test("a plain member cannot cancel the party (403 NOT_ORGANIZER, AC-2.12)", async () => {
  const storage = await seeded();
  const before = await readParty(storage);

  const response = await handlerFor({ ...tom, partyId: "party-1" }, storage)(
    request
  );

  assert.equal(response.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.NOT_ORGANIZER
  );
  // Refused inside the compare-and-swap, so not even a version was burnt.
  assert.deepEqual(await readParty(storage), before);
});

test("cancelling an already-canceled party is refused with 410", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(
    partyKey(party.id),
    { ...party, canceled: true },
    { expectedVersion: null }
  );

  const response = await handlerFor(jane, storage)(request);

  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.PARTY_CANCELED
  );
});

test("a user with no party is refused with 404 NO_PARTY", async () => {
  const storage = await seeded();

  const response = await handlerFor({ ...jane, partyId: null }, storage)(
    request
  );

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_PARTY);
});

test("a pointer to a party that no longer exists is refused as NO_PARTY", async () => {
  const storage = createMemoryStorage();

  const response = await handlerFor(jane, storage)(request);

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_PARTY);
});

test("an unauthenticated request is refused with 401", async () => {
  const storage = await seeded();

  const response = await handlerFor(null, storage)(request);

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
  assert.equal((await readParty(storage))?.value.canceled, false);
});

test("the returned party carries no invitations", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(request);

  const serialized = JSON.stringify(response.body);
  assert.ok(!serialized.includes("invitations"));
  assert.ok(!serialized.includes("some-lookup-hash"));
});
