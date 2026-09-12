// Unit tests for the method+path router (server/core/router.ts). The contract
// tests in handlers.test.ts go through the router too, but only ever on the
// happy paths; these pin the dispatch rules themselves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, matchPath, App } from "./router";
import { createMemoryStorage } from "./storage";
import {
  AppResponse,
  ErrorBody,
  InvitationBody,
  PartyBody,
  SessionBody,
} from "./handlers.types";
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

const tom = {
  email: "tom@example.com",
  password: "hunter33!",
  firstName: "Tom",
  lastName: "Doe",
};

const errorCode = (response: AppResponse): string =>
  (response.body as ErrorBody).error.code;

const errorMessage = (response: AppResponse): string =>
  (response.body as ErrorBody).error.message;

const signUp = async (app: App, who: typeof jane) => {
  const response = (await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: who,
  })) as AppResponse<SessionBody>;
  return {
    id: response.body.user.id,
    headers: { authorization: `Bearer ${response.body.token}` },
  };
};

// Jane organizes a party and Tom joins it, so every party route has a real
// organizer and a real member to be exercised with.
const setupParty = async (app: App) => {
  const organizer = await signUp(app, jane);
  await app.handle({ method: "POST", path: "/api/party", headers: organizer.headers });
  const invited = (await app.handle({
    method: "POST",
    path: "/api/party/invitations",
    headers: organizer.headers,
    body: { password: "invite-pass" },
  })) as AppResponse<InvitationBody>;
  const member = await signUp(app, tom);
  const joined = await app.handle({
    method: "POST",
    path: "/api/party/join",
    headers: member.headers,
    body: { code: invited.body.code, password: "invite-pass" },
  });
  assert.equal(joined.status, HTTP_STATUS.OK);
  return { organizer, member };
};

// --- matchPath ------------------------------------------------------------

test("matchPath: a pattern without parameters is an exact comparison", () => {
  assert.deepEqual(matchPath("/api/me", "/api/me"), {});
  assert.equal(matchPath("/api/me", "/api/me/"), null);
  assert.equal(matchPath("/api/me", "/api/ME"), null);
  assert.equal(matchPath("/api/me", "/api"), null);
  assert.equal(matchPath("/api/me", "/api/me/extra"), null);
  assert.equal(matchPath("/api/party", "/api/party/join"), null);
});

test("matchPath: a :name segment captures the segment under that name", () => {
  assert.deepEqual(
    matchPath("/api/party/members/:userId/block", "/api/party/members/abc/block"),
    { userId: "abc" }
  );
});

test("matchPath: a captured value is percent-decoded", () => {
  // The client puts ids through encodeURIComponent; the handler wants the
  // id back, not its encoding.
  assert.deepEqual(
    matchPath(
      "/api/party/members/:userId/block",
      `/api/party/members/${encodeURIComponent("user id/with:odd chars")}/block`
    ),
    { userId: "user id/with:odd chars" }
  );
});

test("matchPath: a structurally different path does not match", () => {
  const pattern = "/api/party/members/:userId/block";
  for (const path of [
    "/api/party/members/abc",
    "/api/party/members/abc/unblock",
    "/api/party/members/abc/block/extra",
    "/api/party/member/abc/block",
    "/api/party/members/abc/block/",
    "/api/party/members/a/b/block",
    "",
  ]) {
    assert.equal(matchPath(pattern, path), null, `expected no match for ${path}`);
  }
});

test("matchPath: an empty parameter segment is not a match", () => {
  // "/members//block" carries no id; matching it would send the handler an
  // empty string to look up instead of the router answering 404.
  assert.equal(
    matchPath("/api/party/members/:userId/block", "/api/party/members//block"),
    null
  );
});

test("matchPath: malformed percent-encoding is a non-match, not an exception", () => {
  // decodeURIComponent throws on this; the router must turn that into a
  // plain 404 rather than letting it surface as a 500.
  assert.equal(
    matchPath("/api/party/members/:userId/block", "/api/party/members/%E0%A4%A/block"),
    null
  );
});

// --- dispatch -------------------------------------------------------------

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

test("the three party routes are wired to their own handlers", async () => {
  const app = makeApp();
  const signup = (await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: jane,
  })) as AppResponse<SessionBody>;
  const headers = { authorization: `Bearer ${signup.body.token}` };

  // Each route is identified by the answer only its own handler gives, so a
  // path wired to the wrong handler would fail here rather than pass by
  // accidentally returning some other success.
  const created = await app.handle({
    method: "POST",
    path: "/api/party",
    headers,
  });
  assert.equal(created.status, HTTP_STATUS.CREATED);

  const invited = await app.handle({
    method: "POST",
    path: "/api/party/invitations",
    headers,
    body: { password: "invite-pass" },
  });
  assert.equal(invited.status, HTTP_STATUS.CREATED);

  // Jane already has a party, so join's own precondition is what answers.
  const joined = await app.handle({
    method: "POST",
    path: "/api/party/join",
    headers,
    body: { code: "AAAA-AAAA", password: "invite-pass" },
  });
  assert.equal(joined.status, HTTP_STATUS.CONFLICT);
  assert.equal(errorCode(joined), ERROR_CODES.ALREADY_IN_PARTY);
});

test("the block route captures the member id from the path and reaches its handler", async () => {
  const app = makeApp();
  const { organizer, member } = await setupParty(app);

  // The id travels encoded, as the client sends it; a match on the wrong
  // handler or a raw (undecoded) capture would not find Tom.
  const blocked = (await app.handle({
    method: "POST",
    path: `/api/party/members/${encodeURIComponent(member.id)}/block`,
    headers: organizer.headers,
    body: {},
  })) as AppResponse<PartyBody>;
  assert.equal(blocked.status, HTTP_STATUS.OK);
  assert.equal(
    blocked.body.party.members.find((row) => row.id === member.id)?.blocked,
    true
  );
});

test("the block route's own 404 is distinguishable from the router's", async () => {
  const app = makeApp();
  const { organizer } = await setupParty(app);

  // An unknown member id still matches the route: it is the handler that
  // answers NOT_FOUND, with its own message, not the router.
  const unknown = await app.handle({
    method: "POST",
    path: "/api/party/members/nobody/block",
    headers: organizer.headers,
    body: {},
  });
  assert.equal(unknown.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(errorCode(unknown), ERROR_CODES.NOT_FOUND);
  assert.equal(errorMessage(unknown), "That member isn't in your party.");
  assert.notEqual(errorMessage(unknown), "Not found.");
});

test("the cancel and backup routes are wired to their own handlers", async () => {
  const app = makeApp();
  const { organizer } = await setupParty(app);

  // Each answer below is one only its own handler gives.
  const download = await app.handle({
    method: "GET",
    path: "/api/party/backup",
    headers: organizer.headers,
  });
  assert.equal(download.status, HTTP_STATUS.NOT_FOUND);
  assert.equal(errorCode(download), ERROR_CODES.NO_BACKUP);

  const upload = await app.handle({
    method: "PUT",
    path: "/api/party/backup",
    headers: organizer.headers,
    body: { baseVersion: null, envelope: {} },
  });
  assert.equal(upload.status, HTTP_STATUS.NOT_IMPLEMENTED);
  assert.equal(errorCode(upload), ERROR_CODES.NOT_IMPLEMENTED);

  const canceled = (await app.handle({
    method: "POST",
    path: "/api/party/cancel",
    headers: organizer.headers,
    body: {},
  })) as AppResponse<PartyBody>;
  assert.equal(canceled.status, HTTP_STATUS.OK);
  assert.equal(canceled.body.party.canceled, true);
});

test("the party routes reject a wrong method rather than falling through", async () => {
  const app = makeApp();

  // /api/party/invitations sits under /api/party; neither path has a GET
  // route wired, so both fall through to the router's 404.
  for (const path of [
    "/api/party",
    "/api/party/invitations",
    "/api/party/join",
    "/api/party/cancel",
    "/api/party/members/abc/block",
  ]) {
    const response = await app.handle({ method: "GET", path });
    assert.equal(
      response.status,
      HTTP_STATUS.NOT_FOUND,
      `expected a not-found status for GET ${path}`
    );
  }
  // The backup path is wired for GET and PUT only.
  for (const method of ["POST", "DELETE", "PATCH"]) {
    const response = await app.handle({ method, path: "/api/party/backup" });
    assert.equal(
      response.status,
      HTTP_STATUS.NOT_FOUND,
      `expected a not-found status for ${method} /api/party/backup`
    );
  }
});

test("a parameterised route does not swallow its static neighbours", async () => {
  const app = makeApp();
  const { organizer } = await setupParty(app);

  // /api/party/cancel and /api/party/join have the same shape as the first
  // three segments of the block pattern; none of them may end up at the
  // block handler, and none of these near-misses may reach any handler.
  for (const path of [
    "/api/party/members/abc",
    "/api/party/members/abc/block/extra",
    "/api/party/members//block",
    "/api/party/members/%E0%A4%A/block",
  ]) {
    const response = await app.handle({
      method: "POST",
      path,
      headers: organizer.headers,
      body: {},
    });
    assert.equal(response.status, HTTP_STATUS.NOT_FOUND, `for ${path}`);
    assert.equal(errorMessage(response), "Not found.", `for ${path}`);
  }
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
