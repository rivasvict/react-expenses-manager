// Unit tests for the signup handler (./signup.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSignupHandler } from "./signup";
import { createIssueSession } from "./session";
import { userIdKey, userKey } from "./userKeys";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import {
  AppResponse,
  ErrorBody,
  Handler,
  SessionBody,
  UserIdPointer,
  UserRecord,
} from "../handlers.types";

const TOKEN_SECRET = "test-secret";

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const makeHandler = (
  storage: StorageAdapter = createMemoryStorage()
): { signup: Handler; storage: StorageAdapter } => ({
  signup: createSignupHandler({
    storage,
    issueSession: createIssueSession({ tokenSecret: TOKEN_SECRET, now: Date.now }),
    now: Date.now,
  }),
  storage,
});

const post = (signup: Handler, body: unknown): Promise<AppResponse> =>
  signup({ method: "POST", path: "/api/auth/signup", body });

const errorCode = (response: AppResponse): string =>
  (response.body as ErrorBody).error.code;

test("a valid signup returns 201 with a session", async () => {
  const { signup } = makeHandler();

  const response = await post(signup, jane);

  assert.equal(response.status, HTTP_STATUS.CREATED);
  const body = response.body as SessionBody;
  assert.ok(body.token);
  assert.equal(body.user.email, jane.email);
  assert.ok(body.user.id);
});

test("signup rejects a malformed email", async () => {
  const { signup } = makeHandler();

  const response = await post(signup, { ...jane, email: "not-an-email" });

  assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
});

test("signup rejects a missing password and missing names", async () => {
  const { signup } = makeHandler();

  const noPassword = await post(signup, { ...jane, password: "" });
  assert.equal(noPassword.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(noPassword), ERROR_CODES.VALIDATION_ERROR);

  const noLastName = await post(signup, { ...jane, lastName: "  " });
  assert.equal(noLastName.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(noLastName), ERROR_CODES.VALIDATION_ERROR);
});

test("signup rejects a body that is absent entirely", async () => {
  const { signup } = makeHandler();

  const response = await post(signup, undefined);

  assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
});

test("a second signup on the same email conflicts, case-insensitively", async () => {
  const { signup } = makeHandler();
  await post(signup, jane);

  const response = await post(signup, { ...jane, email: "JANE@Example.com" });

  assert.equal(response.status, HTTP_STATUS.CONFLICT);
  assert.equal(errorCode(response), ERROR_CODES.EMAIL_TAKEN);
});

test("signup stores an scrypt record, never the plaintext password", async () => {
  const { signup, storage } = makeHandler();
  await post(signup, jane);

  const stored = await storage.readJson<UserRecord>(userKey(jane.email));

  assert.equal(stored?.password.algo, "scrypt");
  // The whole serialized document must be free of the plaintext (AC-1.2) —
  // not just the password field, in case it is ever echoed elsewhere.
  assert.ok(!JSON.stringify(stored).includes(jane.password));
});

test("signup writes the id pointer alongside the user record", async () => {
  const { signup, storage } = makeHandler();
  const response = await post(signup, jane);
  const { user } = response.body as SessionBody;

  // /api/me resolves a token's `sub` through this pointer, so signup must
  // write both keys or the account is unreachable after login.
  const pointer = await storage.readJson<UserIdPointer>(userIdKey(user.id));
  assert.equal(pointer?.userKey, userKey(jane.email));
});

test("signup trims the stored name fields", async () => {
  const { signup, storage } = makeHandler();
  await post(signup, { ...jane, firstName: "  Jane  ", lastName: "  Doe  " });

  const stored = await storage.readJson<UserRecord>(userKey(jane.email));

  assert.equal(stored?.firstName, "Jane");
  assert.equal(stored?.lastName, "Doe");
});

test("signup rejects a padded email rather than trimming it", async () => {
  // isEmail tests the raw value, so surrounding whitespace fails the format
  // check outright. Pinning it because userKey() *does* trim: login would
  // resolve "  jane@example.com  " to a real account, so the asymmetry is
  // deliberate to record rather than accidental.
  const { signup } = makeHandler();

  const response = await post(signup, { ...jane, email: "  jane@example.com  " });

  assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(errorCode(response), ERROR_CODES.VALIDATION_ERROR);
});
