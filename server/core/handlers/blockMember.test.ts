// Unit tests for the block-member handler (./blockMember.ts). The organizer
// check is the security boundary here (AC-2.12, docs/multi-user-sync/PRD.md):
// remove it from the handler and "a plain member cannot block anyone" below
// is what fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createBlockMemberHandler } from "./blockMember";
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

const SAM_ID = "user-3";

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
      blocked: false,
    },
    {
      id: SAM_ID,
      firstName: "Sam",
      lastName: "Doe",
      email: "sam@example.com",
      blocked: false,
    },
  ],
  canceled: false,
  invitations: { "some-lookup-hash": "encrypted-blob" },
  createdAt: NOW,
};

const seeded = async (record: PartyRecord = party): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(record.id), record, {
    expectedVersion: null,
  });
  return storage;
};

const handlerFor = (user: UserRecord | null, storage: StorageAdapter): Handler =>
  createBlockMemberHandler({
    authenticate: async () => user,
    mutateParty: createMutateParty({ storage }),
  });

// The request as the router hands it over: the target id already captured
// from the path into params.
const blockRequest = (userId?: string): AppRequest => ({
  method: "POST",
  path: `/api/party/members/${userId}/block`,
  params: userId === undefined ? undefined : { userId },
});

const readParty = (storage: StorageAdapter) =>
  storage.readJsonVersioned<PartyRecord>(partyKey("party-1"));

const blockedIds = (record: PartyRecord) =>
  record.members.filter((member) => member.blocked).map((member) => member.id);

test("the organizer blocks a member: flagged, kept in the list, persisted", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(blockRequest(tom.id));

  assert.equal(response.status, HTTP_STATUS.OK);
  const { party: returned } = response.body as PartyBody;
  // Still three rows — blocking removes nobody (AC-2.9).
  assert.equal(returned.members.length, 3);
  assert.deepEqual(blockedIds(returned as unknown as PartyRecord), [tom.id]);
  // The organizer asked, so from their side nobody has blocked *them*.
  assert.equal(returned.youAreBlocked, false);
  assert.deepEqual(blockedIds((await readParty(storage))!.value), [tom.id]);
});

test("only the target row changes", async () => {
  const storage = await seeded();

  await handlerFor(jane, storage)(blockRequest(tom.id));

  const stored = (await readParty(storage))!.value;
  assert.deepEqual(
    stored.members.map((member) => member.id),
    [jane.id, tom.id, SAM_ID]
  );
  assert.equal(stored.name, party.name);
  assert.equal(stored.canceled, false);
  assert.deepEqual(stored.invitations, party.invitations);
});

test("a plain member cannot block anyone (403 NOT_ORGANIZER, AC-2.12)", async () => {
  const storage = await seeded();
  const before = await readParty(storage);

  const response = await handlerFor(tom, storage)(blockRequest(SAM_ID));

  assert.equal(response.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.NOT_ORGANIZER
  );
  // Refused inside the compare-and-swap, so not even a version was burnt.
  assert.deepEqual(await readParty(storage), before);
});

test("a plain member cannot block the organizer either", async () => {
  const storage = await seeded();

  const response = await handlerFor(tom, storage)(blockRequest(jane.id));

  assert.equal(response.status, HTTP_STATUS.FORBIDDEN);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.NOT_ORGANIZER
  );
  assert.deepEqual(blockedIds((await readParty(storage))!.value), []);
});

test("the organizer cannot block themself (400 VALIDATION_ERROR)", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(blockRequest(jane.id));

  assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.VALIDATION_ERROR
  );
  assert.deepEqual(blockedIds((await readParty(storage))!.value), []);
});

test("blocking a member in an already-canceled party is refused with 410", async () => {
  const storage = await seeded({ ...party, canceled: true });

  const response = await handlerFor(jane, storage)(blockRequest(tom.id));

  assert.equal(response.status, HTTP_STATUS.GONE);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.PARTY_CANCELED
  );
  assert.deepEqual(blockedIds((await readParty(storage))!.value), []);
});

test("blocking someone who is not a member is 404 NOT_FOUND", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(blockRequest("user-99"));

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NOT_FOUND);
});

test("blocking an already-blocked member is a harmless repeat", async () => {
  const storage = await seeded();
  await handlerFor(jane, storage)(blockRequest(tom.id));

  const response = await handlerFor(jane, storage)(blockRequest(tom.id));

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.deepEqual(blockedIds((await readParty(storage))!.value), [tom.id]);
});

test("a request with no member id is a validation error", async () => {
  const storage = await seeded();

  for (const request of [blockRequest(undefined), blockRequest("")]) {
    const response = await handlerFor(jane, storage)(request);
    assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
    assert.equal(
      (response.body as ErrorBody).error.code,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
});

test("a user with no party is refused with 404 NO_PARTY", async () => {
  const storage = await seeded();

  const response = await handlerFor({ ...jane, partyId: null }, storage)(
    blockRequest(tom.id)
  );

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_PARTY);
});

test("a pointer to a party that no longer exists is refused as NO_PARTY", async () => {
  const storage = createMemoryStorage();

  const response = await handlerFor(jane, storage)(blockRequest(tom.id));

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.equal((response.body as ErrorBody).error.code, ERROR_CODES.NO_PARTY);
});

test("an unauthenticated request is refused with 401", async () => {
  const storage = await seeded();

  const response = await handlerFor(null, storage)(blockRequest(tom.id));

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
  assert.deepEqual(blockedIds((await readParty(storage))!.value), []);
});

test("the returned party carries no invitations", async () => {
  const storage = await seeded();

  const response = await handlerFor(jane, storage)(blockRequest(tom.id));

  const serialized = JSON.stringify(response.body);
  assert.ok(!serialized.includes("invitations"));
  assert.ok(!serialized.includes("some-lookup-hash"));
});
