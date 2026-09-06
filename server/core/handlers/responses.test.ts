// Unit tests for the shared response shaping (./responses.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  error,
  invalidCredentials,
  publicParty,
  publicUser,
  unauthorized,
} from "./responses";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { PartyRecord, UserRecord } from "../handlers.types";

const storedUser: UserRecord = {
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

test("error() wraps a code and message in the error envelope", () => {
  assert.deepEqual(
    error(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, "Nope."),
    {
      status: HTTP_STATUS.BAD_REQUEST,
      body: { error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Nope." } },
    }
  );
});

test("invalidCredentials and unauthorized are distinct 401s", () => {
  assert.equal(invalidCredentials().status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(
    invalidCredentials().body.error.code,
    ERROR_CODES.INVALID_CREDENTIALS
  );

  assert.equal(unauthorized().status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(unauthorized().body.error.code, ERROR_CODES.UNAUTHORIZED);
});

test("invalidCredentials is byte-identical on every call (AC-1.5)", () => {
  // The login handler returns this for both an unknown email and a wrong
  // password; if the two calls could differ, the response itself would
  // disclose which branch was taken.
  assert.deepEqual(invalidCredentials(), invalidCredentials());
});

test("publicUser projects only the four wire fields", () => {
  // This is the whitelist that keeps the stored scrypt record out of API
  // responses (AC-1.2). Asserting the exact key set — rather than just the
  // values — is what makes widening the projection a test failure.
  assert.deepEqual(Object.keys(publicUser(storedUser)).sort(), [
    "email",
    "firstName",
    "id",
    "lastName",
  ]);
});

test("publicUser drops the password record, partyId and createdAt", () => {
  const projected = publicUser(storedUser) as Partial<UserRecord>;

  assert.equal(projected.password, undefined);
  assert.equal(projected.partyId, undefined);
  assert.equal(projected.createdAt, undefined);
  // Belt and braces: no fragment of the stored hash survives serialization.
  assert.ok(!JSON.stringify(projected).includes(storedUser.password.hashB64));
});

const storedParty: PartyRecord = {
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

test("publicParty projects only the six wire fields", () => {
  // As with publicUser, the exact key set is the assertion: this whitelist is
  // what keeps `invitations` and `createdAt` off the wire.
  assert.deepEqual(Object.keys(publicParty(storedParty, "user-1")).sort(), [
    "canceled",
    "id",
    "members",
    "name",
    "organizerId",
    "youAreBlocked",
  ]);
});

test("publicParty never leaks the party's invitations", () => {
  // The stored invitations are the encrypted blobs for every outstanding
  // invite. Shipping them to each member on every /api/me would hand all of
  // them material to attack offline.
  const serialized = JSON.stringify(publicParty(storedParty, "user-1"));

  assert.ok(!serialized.includes("encrypted-invitation-blob"));
  assert.ok(!serialized.includes("lookup-hash"));
  assert.ok(!serialized.includes("invitations"));
});

test("youAreBlocked answers for the requester, not the party", () => {
  // Jane is not blocked; Tom is. One shared party, two different answers.
  assert.equal(publicParty(storedParty, "user-1").youAreBlocked, false);
  assert.equal(publicParty(storedParty, "user-2").youAreBlocked, true);
});

test("youAreBlocked is false for someone who is not a member at all", () => {
  assert.equal(publicParty(storedParty, "stranger").youAreBlocked, false);
});

test("publicParty preserves the member list and its order", () => {
  const projected = publicParty(storedParty, "user-1");

  assert.deepEqual(projected.members, storedParty.members);
  assert.deepEqual(
    projected.members.map((member) => member.id),
    ["user-1", "user-2"]
  );
});

test("publicParty carries the party's identity and lifecycle state through", () => {
  const projected = publicParty({ ...storedParty, canceled: true }, "user-1");

  assert.equal(projected.id, "party-1");
  assert.equal(projected.name, "Jane's Party");
  assert.equal(projected.organizerId, "user-1");
  // Canceled has to survive the projection: it is what tells a client to stop
  // syncing (docs/multi-user-sync/RFC.md §3).
  assert.equal(projected.canceled, true);
});
