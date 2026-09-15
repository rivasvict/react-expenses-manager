// Unit tests for the party write path (./parties.ts). The compare-and-swap
// loop is what makes an invitation single-use under a race, so these pin its
// retry, its abort and its give-up behaviour directly rather than only
// through an endpoint.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMutateParty, createSetUserPartyId } from "./parties";
import { partyKey } from "./partyKeys";
import { userKey } from "./userKeys";
import { ErrorBody, PartyRecord, UserRecord } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { error } from "./responses";

const party: PartyRecord = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: "user-1",
  members: [
    {
      id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      blocked: false,
    },
  ],
  canceled: false,
  invitations: {},
  createdAt: 1700000000000,
};

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
  createdAt: 1700000000000,
};

const storageWithParty = async (): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  return storage;
};

const readParty = (storage: StorageAdapter) =>
  storage.readJsonVersioned<PartyRecord>(partyKey(party.id));

const rename = (record: PartyRecord, name: string): PartyRecord => ({
  ...record,
  name,
});

test("a committed mutation is persisted and returned", async () => {
  const storage = await storageWithParty();
  const mutateParty = createMutateParty({ storage });

  const outcome = await mutateParty(party.id, (current) => ({
    party: rename(current, "Renamed"),
  }));

  assert.equal(outcome.party?.name, "Renamed");
  assert.equal((await readParty(storage))?.value.name, "Renamed");
});

test("an aborted mutation returns its response and writes nothing", async () => {
  const storage = await storageWithParty();
  const mutateParty = createMutateParty({ storage });
  const before = await readParty(storage);

  const outcome = await mutateParty(party.id, () => ({
    response: error(
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.NOT_ORGANIZER,
      "Only the organizer can invite members."
    ),
  }));

  assert.equal(outcome.party, undefined);
  assert.equal(outcome.response?.status, HTTP_STATUS.FORBIDDEN);
  const after = await readParty(storage);
  // Not merely equal in content: the version is untouched, so no write
  // happened at all. A refused check must never burn a version.
  assert.deepEqual(after, before);
});

test("a missing party is reported as NO_PARTY without calling the mutation", async () => {
  const storage = createMemoryStorage();
  const mutateParty = createMutateParty({ storage });
  let called = false;

  const outcome = await mutateParty("party-gone", (current) => {
    called = true;
    return { party: current };
  });

  assert.equal(called, false);
  assert.equal(outcome.response?.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(
    (outcome.response?.body as ErrorBody).error.code,
    ERROR_CODES.NO_PARTY
  );
});

test("a losing compare-and-swap retries against the state that won", async () => {
  const storage = await storageWithParty();
  const mutateParty = createMutateParty({ storage });
  const seen: string[] = [];
  let interfered = false;

  const outcome = await mutateParty(party.id, (current) => {
    seen.push(current.name);
    // Simulate a concurrent writer landing between this read and our write,
    // exactly once — the first attempt must lose and run again.
    if (!interfered) {
      interfered = true;
      const record = { ...current, name: "Written by someone else" };
      void storage.writeJsonVersioned(partyKey(party.id), record, {
        expectedVersion: "1",
      });
    }
    return { party: rename(current, `${current.name} (ours)`) };
  });

  // The retry saw the interloper's state, not the stale one — which is what
  // makes a re-validated check (is this invitation still unused?) meaningful.
  assert.deepEqual(seen, ["Jane's Party", "Written by someone else"]);
  assert.equal(outcome.party?.name, "Written by someone else (ours)");
  assert.equal(
    (await readParty(storage))?.value.name,
    "Written by someone else (ours)"
  );
});

test("a mutation that keeps losing gives up with 409 CONFLICT", async () => {
  const storage = await storageWithParty();
  const mutateParty = createMutateParty({ storage });
  let attempts = 0;

  // Interfere on every attempt so the CAS can never land.
  const outcome = await mutateParty(party.id, (current) => {
    attempts += 1;
    void storage.writeJsonVersioned(
      partyKey(party.id),
      { ...current, name: `Interference ${attempts}` },
      { expectedVersion: String(attempts) }
    );
    return { party: rename(current, "ours") };
  });

  // Bounded: it answers rather than spinning forever.
  assert.equal(attempts, 2);
  assert.equal(outcome.party, undefined);
  assert.equal(outcome.response?.status, HTTP_STATUS.CONFLICT);
  assert.equal(
    (outcome.response?.body as ErrorBody).error.code,
    ERROR_CODES.CONFLICT
  );
});

test("setUserPartyId points the user record at the party", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson(userKey(jane.email), jane);

  await createSetUserPartyId({ storage })(jane, party.id);

  const stored = await storage.readJson<UserRecord>(userKey(jane.email));
  assert.equal(stored?.partyId, party.id);
  // Everything else about the account survives the backlink write.
  assert.equal(stored?.email, jane.email);
  assert.deepEqual(stored?.password, jane.password);
});

test("setUserPartyId writes under the email key, not the user id", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson(userKey(jane.email), jane);

  // Writing to the wrong key would leave login (which reads by email) seeing
  // a user who is still party-less, while /api/me saw the update.
  await createSetUserPartyId({ storage })(jane, party.id);

  assert.equal(await storage.readJson(`users/${jane.id}`), null);
  assert.ok(await storage.readJson(userKey(jane.email)));
});
