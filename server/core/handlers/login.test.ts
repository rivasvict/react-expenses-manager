// Unit tests for the login handler (./login.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLoginHandler } from "./login";
import { createSignupHandler } from "./signup";
import { createIssueSession } from "./session";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { AppResponse, Handler, SessionBody } from "../handlers.types";

const TOKEN_SECRET = "test-secret";

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

// Registers jane through the real signup handler so the stored scrypt record
// is the one login will actually verify against.
const withRegisteredUser = async (): Promise<{
  login: Handler;
  storage: StorageAdapter;
}> => {
  const storage = createMemoryStorage();
  const issueSession = createIssueSession({
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });
  const signup = createSignupHandler({ storage, issueSession, now: Date.now });
  await signup({ method: "POST", path: "/api/auth/signup", body: jane });

  return { login: createLoginHandler({ storage, issueSession }), storage };
};

const post = (login: Handler, body: unknown): Promise<AppResponse> =>
  login({ method: "POST", path: "/api/auth/login", body });

test("correct credentials return 200 with a session", async () => {
  const { login } = await withRegisteredUser();

  const response = await post(login, {
    email: jane.email,
    password: jane.password,
  });

  assert.equal(response.status, HTTP_STATUS.OK);
  const body = response.body as SessionBody;
  assert.ok(body.token);
  assert.equal(body.user.email, jane.email);
});

test("login matches the account case-insensitively", async () => {
  const { login } = await withRegisteredUser();

  const response = await post(login, {
    email: "JANE@Example.com",
    password: jane.password,
  });

  assert.equal(response.status, HTTP_STATUS.OK);
});

test("a wrong password and an unknown email are indistinguishable (AC-1.5)", async () => {
  const { login } = await withRegisteredUser();

  const wrongPassword = await post(login, {
    email: jane.email,
    password: "wrong-password",
  });
  const unknownEmail = await post(login, {
    email: "nobody@example.com",
    password: "whatever",
  });

  // Same status and byte-identical body: the response must not disclose
  // whether the account exists.
  assert.equal(wrongPassword.status, HTTP_STATUS.UNAUTHORIZED);
  assert.equal(unknownEmail.status, HTTP_STATUS.UNAUTHORIZED);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  assert.deepEqual(wrongPassword.body, {
    error: {
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: "Email or password is incorrect.",
    },
  });
});

test("missing or blank fields fail as invalid credentials, not validation", async () => {
  const { login } = await withRegisteredUser();

  // A distinct VALIDATION_ERROR here would tell a caller which field the
  // server objected to, so login answers everything with the same 401.
  for (const body of [
    undefined,
    {},
    { email: jane.email },
    { password: jane.password },
    { email: "", password: "" },
    { email: 42, password: false },
  ]) {
    const response = await post(login, body);
    assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
    assert.deepEqual(response.body, {
      error: {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: "Email or password is incorrect.",
      },
    });
  }
});

test("login never echoes the password or the stored hash", async () => {
  const { login } = await withRegisteredUser();

  const response = await post(login, {
    email: jane.email,
    password: jane.password,
  });

  assert.ok(!JSON.stringify(response.body).includes(jane.password));
  assert.ok(!JSON.stringify(response.body).includes("scrypt"));
});

test("an unknown email still performs scrypt work before failing", async () => {
  // The timing equalizer is what stops an early return from revealing that
  // no account exists. Measuring wall-clock is inherently noisy, so this
  // asserts the weaker invariant that the unknown-email path is not
  // near-instant relative to a real verification.
  const { login } = await withRegisteredUser();

  const timeOf = async (body: unknown): Promise<number> => {
    const started = process.hrtime.bigint();
    await post(login, body);
    return Number(process.hrtime.bigint() - started) / 1e6;
  };

  const knownEmail = await timeOf({
    email: jane.email,
    password: "wrong-password",
  });
  const unknownEmail = await timeOf({
    email: "nobody@example.com",
    password: "whatever",
  });

  // Generous bound: without the dummy hash the unknown-email path returns in
  // microseconds, orders of magnitude below a single scrypt verification.
  assert.ok(
    unknownEmail > knownEmail / 10,
    `unknown-email path returned in ${unknownEmail}ms vs ${knownEmail}ms for a real verification`
  );
});
