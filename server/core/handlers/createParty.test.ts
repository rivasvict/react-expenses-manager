// Unit tests for the party-creation handler (./createParty.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCreatePartyHandler } from "./createParty";
import { createSetUserPartyId } from "./parties";
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
    setUserPartyId: createSetUserPartyId({ storage }),
    now: () => NOW,
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
  const response = await handlerFor({ ...jane, partyId: "party-existing" })(
    request
  );

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.ALREADY_IN_PARTY
  );
});

test("a refused creation writes no party at all", async () => {
  const storage = createMemoryStorage();
  await handlerFor({ ...jane, partyId: "party-existing" }, storage)(request);

  // A second party must not be left behind orphaned by the rejection.
  assert.equal(await storage.readJsonVersioned("parties/party-existing"), null);
});

test("an unauthenticated request is refused with 401", async () => {
  const response = await handlerFor(null)(request);

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
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
