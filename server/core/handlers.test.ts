// Contract tests for RFC §3 endpoints 1–3, run with the Node built-in test
// runner (node >= 18): npm run test:server
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, App, CreateAppOptions } from "./router";
import { createMemoryStorage } from "./storage";
import { signToken, sha256Hex } from "./crypto";
import {
  AppRequest,
  AppResponse,
  ErrorBody,
  MeBody,
  SessionBody,
  UserRecord,
} from "./handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "./httpConstants";

// Handlers return a union of body shapes. These tests assert against
// whichever shape the endpoint under test produces, so widen once here
// instead of narrowing at every assertion.
type TestBody = SessionBody & MeBody & ErrorBody;
type TestResponse = AppResponse<TestBody>;

const TOKEN_SECRET = "test-secret";

const makeApp = (options: Partial<CreateAppOptions> = {}): App =>
  createApp({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
    ...options,
  });

const call = (app: App, request: AppRequest): Promise<TestResponse> =>
  app.handle(request) as Promise<TestResponse>;

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const signup = (app: App, body: unknown = jane): Promise<TestResponse> =>
  call(app, { method: "POST", path: "/api/auth/signup", body });

const login = (app: App, body: unknown): Promise<TestResponse> =>
  call(app, { method: "POST", path: "/api/auth/login", body });

const me = (app: App, token: string): Promise<TestResponse> =>
  call(app, {
    method: "GET",
    path: "/api/me",
    headers: { authorization: `Bearer ${token}` },
  });

test("signup → login → /api/me lifecycle", async () => {
  const app = makeApp();

  const signupResult = await signup(app);
  assert.equal(signupResult.status, HTTP_STATUS.CREATED);
  assert.ok(signupResult.body.token);
  assert.deepEqual(signupResult.body.user, {
    id: signupResult.body.user.id,
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });
  // AC-1.2: the plaintext password never appears in any response.
  assert.ok(!JSON.stringify(signupResult.body).includes(jane.password));

  const loginResult = await login(app, {
    email: "jane@example.com",
    password: jane.password,
  });
  assert.equal(loginResult.status, HTTP_STATUS.OK);
  assert.equal(loginResult.body.user.id, signupResult.body.user.id);

  const meResult = await me(app, loginResult.body.token);
  assert.equal(meResult.status, HTTP_STATUS.OK);
  assert.equal(meResult.body.user.email, "jane@example.com");
  // PR 1: parties do not exist yet.
  assert.equal(meResult.body.party, null);
});

test("signup stores no plaintext password (scrypt record only)", async () => {
  const storage = createMemoryStorage();
  const app = makeApp({ storage });
  await signup(app);

  // Read the stored user record back through the storage interface: what
  // signup persisted must be an scrypt record (algo/salt/hash) and nothing
  // else derived from the password (AC-1.2).
  const stored = (await storage.readJson<UserRecord>(
    `users/${sha256Hex("jane@example.com")}`
  )) as UserRecord;
  assert.equal(stored.password.algo, "scrypt");
  assert.ok(stored.password.saltB64);
  assert.ok(stored.password.hashB64);

  // Then: the plaintext password appears *nowhere* in the stored document.
  //
  // Checking `stored.password` alone would only prove the field we expect
  // to be hashed is hashed. Serializing the whole record and searching it
  // also catches the plaintext being copied somewhere unexpected — a stray
  // field, a debug echo, a future addition to UserRecord.
  const serialized = JSON.stringify(stored);
  assert.equal(
    serialized.includes(jane.password),
    false,
    "the plaintext password must not appear anywhere in the stored user record"
  );
});

test("duplicate email (case-insensitive) is rejected with EMAIL_TAKEN", async () => {
  const app = makeApp();
  await signup(app);

  const duplicate = await signup(app, { ...jane, email: "JANE@example.com" });
  assert.equal(duplicate.status, HTTP_STATUS.CONFLICT);
  assert.equal(duplicate.body.error.code, ERROR_CODES.EMAIL_TAKEN);
});

test("signup validates required fields", async () => {
  const app = makeApp();
  const missingEmail = await signup(app, { ...jane, email: "not-an-email" });
  assert.equal(missingEmail.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(missingEmail.body.error.code, ERROR_CODES.VALIDATION_ERROR);

  const missingPassword = await signup(app, { ...jane, password: "" });
  assert.equal(missingPassword.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(missingPassword.body.error.code, ERROR_CODES.VALIDATION_ERROR);
});

test("wrong password and unknown email return the identical generic 401 body (AC-1.5)", async () => {
  const app = makeApp();
  await signup(app);

  const wrongPassword = await login(app, {
    email: "jane@example.com",
    password: "wrong-password",
  });
  const unknownEmail = await login(app, {
    email: "nobody@example.com",
    password: "whatever",
  });

  assert.equal(wrongPassword.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(unknownEmail.status, HTTP_STATUS.UNAUTHORIZED);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  // Both branches must report INVALID_CREDENTIALS. Asserting each one
  // explicitly (rather than only the wrong-password branch) means the pair
  // cannot drift together into some other shared code and still pass.
  assert.equal(wrongPassword.body.error.code, ERROR_CODES.INVALID_CREDENTIALS);
  assert.equal(unknownEmail.body.error.code, ERROR_CODES.INVALID_CREDENTIALS);
});

test("expired token is rejected with 401 UNAUTHORIZED", async () => {
  const app = makeApp();
  const { body } = await signup(app);

  const expiredToken = signToken({
    sub: body.user.id,
    secret: TOKEN_SECRET,
    now: Date.now() - 31 * 24 * 60 * 60 * 1000, // issued 31 days ago
  });
  const result = await me(app, expiredToken);
  assert.equal(result.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(result.body.error.code, ERROR_CODES.UNAUTHORIZED);
});

test("tampered or malformed tokens are rejected", async () => {
  const app = makeApp();
  const { body } = await signup(app);

  // Three different ways of not presenting a valid token. All three must
  // reach the same 401, because /api/me may only ever answer to a token this
  // server signed and has not expired.

  // 1. Correctly formed and structurally valid — right user id, right
  //    payload shape, unexpired — but signed with a different secret. This
  //    is the one that matters: it fails only because the HMAC does not
  //    verify, which is what proves the signature is actually being checked
  //    rather than the payload merely being decoded and trusted.
  const forged = signToken({ sub: body.user.id, secret: "other-secret" });
  assert.equal((await me(app, forged)).status, HTTP_STATUS.UNAUTHORIZED);

  // 2. Not a token at all. verifyToken must reject junk by returning null
  //    rather than throwing on the split/base64/JSON.parse it performs — an
  //    exception here would surface as a 500 and hand an unauthenticated
  //    caller a way to trip the error path.
  assert.equal((await me(app, "garbage")).status, HTTP_STATUS.UNAUTHORIZED);

  // 3. No Authorization header at all — the unauthenticated default. Pinned
  //    alongside the others so "missing" can never be treated more leniently
  //    than "invalid".
  assert.equal(
    (await call(app, { method: "GET", path: "/api/me", headers: {} })).status,
    HTTP_STATUS.UNAUTHORIZED
  );
});

test("unknown routes return 404", async () => {
  const app = makeApp();
  const result = await call(app, { method: "GET", path: "/api/nope" });
  assert.equal(result.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(result.body.error.code, ERROR_CODES.NOT_FOUND);
});
