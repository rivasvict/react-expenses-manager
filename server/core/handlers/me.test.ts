// Unit tests for the /api/me handler (./me.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeHandler } from "./me";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import {
  AppRequest,
  AppResponse,
  ErrorBody,
  Handler,
  MeBody,
  PartyRecord,
  UserRecord,
} from "../handlers.types";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { partyKey } from "./partyKeys";

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

const request: AppRequest = { method: "GET", path: "/api/me" };

// A party Jane organizes, with Tom as a blocked member — enough shape to tell
// the per-requester `youAreBlocked` projection apart from the member list.
const janesParty: PartyRecord = {
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
      id: "user-2",
      firstName: "Tom",
      lastName: "Doe",
      email: "tom@example.com",
      blocked: true,
    },
  ],
  canceled: false,
  invitations: { "lookup-hash": "encrypted-invitation-blob" },
  createdAt: 1700000000000,
};

// `authenticate` is stubbed so the branches under test are isolated from
// token concerns; storage is real (in-memory) because reading the party back
// is the behaviour being exercised.
const meWith = (
  user: UserRecord | null,
  storage: StorageAdapter = createMemoryStorage()
): Handler => createMeHandler({ storage, authenticate: async () => user });

const storageWithParty = async (
  party: PartyRecord
): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned(partyKey(party.id), party, {
    expectedVersion: null,
  });
  return storage;
};

const get = (me: Handler): Promise<AppResponse> => me(request);

test("an authenticated request with no party returns the user and null", async () => {
  const response = await get(meWith(jane));

  assert.equal(response.status, HTTP_STATUS.OK);
  const body = response.body as MeBody;
  assert.equal(body.user.email, jane.email);
  assert.equal(body.party, null);
});

test("a user in a party gets that party back", async () => {
  const member = { ...jane, partyId: janesParty.id };
  const response = await get(
    meWith(member, await storageWithParty(janesParty))
  );

  const body = response.body as MeBody;
  assert.equal(body.party?.id, janesParty.id);
  assert.equal(body.party?.name, "Jane's Party");
  assert.equal(body.party?.organizerId, jane.id);
  assert.deepEqual(
    body.party?.members.map((each) => each.id),
    [jane.id, "user-2"]
  );
});

test("youAreBlocked is answered for the requester, not the whole party", async () => {
  // Jane is unblocked in a party that does contain a blocked member, so a
  // projection that reported "someone is blocked" would read true here.
  const jansView = await get(
    meWith({ ...jane, partyId: janesParty.id }, await storageWithParty(janesParty))
  );
  assert.equal((jansView.body as MeBody).party?.youAreBlocked, false);

  const tom: UserRecord = { ...jane, id: "user-2", partyId: janesParty.id };
  const tomsView = await get(meWith(tom, await storageWithParty(janesParty)));
  assert.equal((tomsView.body as MeBody).party?.youAreBlocked, true);
});

test("the party's invitations never reach the response", async () => {
  const response = await get(
    meWith({ ...jane, partyId: janesParty.id }, await storageWithParty(janesParty))
  );

  // The stored party carries the encrypted invitation blobs; the wire shape
  // must not, or every member would receive every outstanding invitation.
  const serialized = JSON.stringify(response.body);
  assert.ok(!serialized.includes("encrypted-invitation-blob"));
  assert.ok(!serialized.includes("invitations"));
});

test("a partyId pointing at a missing record reads as no party", async () => {
  const response = await get(meWith({ ...jane, partyId: "party-gone" }));

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.equal((response.body as MeBody).party, null);
});

test("/api/me returns the public user, never the stored record", async () => {
  const response = await get(meWith(jane));
  const body = response.body as MeBody;

  assert.deepEqual(Object.keys(body.user).sort(), [
    "email",
    "firstName",
    "id",
    "lastName",
  ]);
  assert.ok(!JSON.stringify(body).includes(jane.password.hashB64));
  assert.ok(!JSON.stringify(body).includes("scrypt"));
});

test("an unauthenticated request returns 401 UNAUTHORIZED", async () => {
  const response = await get(meWith(null));

  assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    (response.body as ErrorBody).error.code,
    ERROR_CODES.UNAUTHORIZED
  );
});
