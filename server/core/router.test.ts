// Unit tests for the method+path router (server/core/router.ts). The contract
// tests in handlers.test.ts go through the router too, but only ever on the
// happy paths; these pin the dispatch rules themselves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, App } from "./router";
import { createMemoryStorage } from "./storage";
import { AppResponse, ErrorBody, SessionBody } from "./handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "./httpConstants";

const TOKEN_SECRET = "test-secret";

const makeApp = (): App =>
  createApp({ storage: createMemoryStorage(), tokenSecret: TOKEN_SECRET });

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const errorCode = (response: AppResponse): string =>
  (response.body as ErrorBody).error.code;

test("routes are matched on method and path together", async () => {
  const app = makeApp();

  // Right path, wrong method → 404, not a signup.
  const getSignup = await app.handle({
    method: "GET",
    path: "/api/auth/signup",
    body: jane,
  });
  assert.equal(getSignup.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(errorCode(getSignup), ERROR_CODES.NOT_FOUND);

  // Right method, wrong path → 404.
  const postMe = await app.handle({ method: "POST", path: "/api/me" });
  assert.equal(postMe.status, HTTP_STATUS.NOT_FOUND);

  // Both right → reaches the handler.
  const signup = await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: jane,
  });
  assert.equal(signup.status, HTTP_STATUS.CREATED);
});

test("POST /api/auth/signup, POST /api/auth/login and GET /api/me are all wired", async () => {
  const app = makeApp();
  const signup = (await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: jane,
  })) as AppResponse<SessionBody>;
  assert.equal(signup.status, HTTP_STATUS.CREATED);

  const login = await app.handle({
    method: "POST",
    path: "/api/auth/login",
    body: { email: jane.email, password: jane.password },
  });
  assert.equal(login.status, HTTP_STATUS.OK);

  const me = await app.handle({
    method: "GET",
    path: "/api/me",
    headers: { authorization: `Bearer ${signup.body.token}` },
  });
  assert.equal(me.status, HTTP_STATUS.OK);
});

test("path matching is exact — no prefix or trailing-slash matches", async () => {
  const app = makeApp();

  for (const path of [
    "/api/me/",
    "/api/me/extra",
    "/API/ME",
    "/api",
    "/",
    "",
    "/api/auth/signup/x",
  ]) {
    const response = await app.handle({ method: "GET", path });
    assert.equal(
      response.status,
      HTTP_STATUS.NOT_FOUND,
      `expected a not-found status for path ${path}`
    );
  }
});

test("unknown routes return a NOT_FOUND error body", async () => {
  const app = makeApp();
  const response = await app.handle({ method: "GET", path: "/api/nope" });

  assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
  assert.deepEqual(response.body, {
    error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." },
  });
});

test("each app instance gets isolated storage", async () => {
  const first = makeApp();
  const second = makeApp();

  await first.handle({ method: "POST", path: "/api/auth/signup", body: jane });

  // The same email signs up cleanly on a second app — no shared state.
  const onSecond = await second.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: jane,
  });
  assert.equal(onSecond.status, HTTP_STATUS.CREATED);
});
