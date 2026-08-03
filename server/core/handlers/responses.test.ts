// Unit tests for the shared response shaping (./responses.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { error, invalidCredentials, publicUser, unauthorized } from "./responses";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { UserRecord } from "../handlers.types";

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
