// Contract tests for RFC §3 endpoints 1–3, run with the Node built-in test
// runner (node >= 18): npm run test:server
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../core/router");
const { createMemoryStorage } = require("../core/storage");
const { signToken } = require("../core/crypto");

const TOKEN_SECRET = "test-secret";

const makeApp = (options = {}) =>
  createApp({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
    ...options,
  });

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const signup = (app, body = jane) =>
  app.handle({ method: "POST", path: "/api/auth/signup", body });

const login = (app, body) =>
  app.handle({ method: "POST", path: "/api/auth/login", body });

const me = (app, token) =>
  app.handle({
    method: "GET",
    path: "/api/me",
    headers: { authorization: `Bearer ${token}` },
  });

test("signup → login → /api/me lifecycle", async () => {
  const app = makeApp();

  const signupResult = await signup(app);
  assert.equal(signupResult.status, 201);
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
  assert.equal(loginResult.status, 200);
  assert.equal(loginResult.body.user.id, signupResult.body.user.id);

  const meResult = await me(app, loginResult.body.token);
  assert.equal(meResult.status, 200);
  assert.equal(meResult.body.user.email, "jane@example.com");
  // PR 1: parties do not exist yet.
  assert.equal(meResult.body.party, null);
});

test("signup stores no plaintext password (scrypt record only)", async () => {
  const storage = createMemoryStorage();
  const app = makeApp({ storage });
  await signup(app);

  // The reference storage serializes values; peek through the interface by
  // re-reading the user record via a fresh signup collision below instead of
  // internals — here we assert the record shape through a login round trip
  // plus a duplicate check, and verify the stored record via readJson.
  const { sha256Hex } = require("../core/crypto");
  const stored = await storage.readJson(
    `users/${sha256Hex("jane@example.com")}`
  );
  assert.equal(stored.password.algo, "scrypt");
  assert.ok(stored.password.saltB64);
  assert.ok(stored.password.hashB64);
  assert.ok(!JSON.stringify(stored).includes(jane.password));
});

test("duplicate email (case-insensitive) is rejected with EMAIL_TAKEN", async () => {
  const app = makeApp();
  await signup(app);

  const duplicate = await signup(app, { ...jane, email: "JANE@example.com" });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "EMAIL_TAKEN");
});

test("signup validates required fields", async () => {
  const app = makeApp();
  const missingEmail = await signup(app, { ...jane, email: "not-an-email" });
  assert.equal(missingEmail.status, 400);
  assert.equal(missingEmail.body.error.code, "VALIDATION_ERROR");

  const missingPassword = await signup(app, { ...jane, password: "" });
  assert.equal(missingPassword.status, 400);
  assert.equal(missingPassword.body.error.code, "VALIDATION_ERROR");
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

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  assert.equal(wrongPassword.body.error.code, "INVALID_CREDENTIALS");
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
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, "UNAUTHORIZED");
});

test("tampered or malformed tokens are rejected", async () => {
  const app = makeApp();
  const { body } = await signup(app);

  const forged = signToken({ sub: body.user.id, secret: "other-secret" });
  assert.equal((await me(app, forged)).status, 401);
  assert.equal((await me(app, "garbage")).status, 401);
  assert.equal(
    (
      await app.handle({ method: "GET", path: "/api/me", headers: {} })
    ).status,
    401
  );
});

test("unknown routes return 404", async () => {
  const app = makeApp();
  const result = await app.handle({ method: "GET", path: "/api/nope" });
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "NOT_FOUND");
});
