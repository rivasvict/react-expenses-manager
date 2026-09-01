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
  UserRecord,
} from "../handlers.types";

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

// The handler's only collaborator is `authenticate`, so stubbing it isolates
// the two branches under test from token and storage concerns.
const meWith = (user: UserRecord | null): Handler =>
  createMeHandler({ authenticate: async () => user });

const get = (me: Handler): Promise<AppResponse> => me(request);

test("an authenticated request returns the user and a null party", async () => {
  const response = await get(meWith(jane));

  assert.equal(response.status, HTTP_STATUS.OK);
  const body = response.body as MeBody;
  assert.equal(body.user.email, jane.email);
  // Parties land in PR 2; the contract pins null until then.
  assert.equal(body.party, null);
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
