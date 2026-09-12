// Unit tests for session minting and bearer-token resolution (./session.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthenticate, createIssueSession } from "./session";
import { userIdKey, userKey } from "./userKeys";
import { createMemoryStorage, StorageAdapter } from "../storage";
import { signToken, verifyToken } from "../crypto";
import { UserRecord } from "../handlers.types";

const TOKEN_SECRET = "test-secret";

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

// Storage holding jane under both the primary key and the id pointer, the
// same pair signup writes.
const seededStorage = async (): Promise<StorageAdapter> => {
  const storage = createMemoryStorage();
  const key = userKey(jane.email);
  await storage.writeJson(key, jane);
  await storage.writeJson(userIdKey(jane.id), { userKey: key });
  return storage;
};

const authorized = (token: string) => ({
  method: "GET",
  path: "/api/me",
  headers: { authorization: `Bearer ${token}` },
});

test("issueSession mints a token carrying the user id as `sub`", () => {
  const issueSession = createIssueSession({
    tokenSecret: TOKEN_SECRET,
    now: () => 1700000000000,
  });

  const session = issueSession(jane);
  const payload = verifyToken({
    token: session.token,
    secret: TOKEN_SECRET,
    now: 1700000000000,
  });

  assert.equal(payload?.sub, jane.id);
});

test("issueSession returns the public user, not the stored record", () => {
  const issueSession = createIssueSession({
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });

  const session = issueSession(jane);
  assert.deepEqual(session.user, {
    id: jane.id,
    email: jane.email,
    firstName: "Jane",
    lastName: "Doe",
  });
  assert.ok(!JSON.stringify(session).includes(jane.password.hashB64));
});

test("authenticate resolves a valid bearer token to the stored record", async () => {
  const storage = await seededStorage();
  const authenticate = createAuthenticate({
    storage,
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });

  const token = signToken({ sub: jane.id, secret: TOKEN_SECRET });
  assert.deepEqual(await authenticate(authorized(token)), jane);
});

test("authenticate rejects a missing or malformed Authorization header", async () => {
  const storage = await seededStorage();
  const authenticate = createAuthenticate({
    storage,
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });
  const token = signToken({ sub: jane.id, secret: TOKEN_SECRET });

  assert.equal(await authenticate({ method: "GET", path: "/api/me" }), null);
  assert.equal(
    await authenticate({ method: "GET", path: "/api/me", headers: {} }),
    null
  );
  // A valid token, sent without the "Bearer " scheme prefix. An
  // Authorization header is "<scheme> <credentials>", and authenticate
  // matches /^Bearer (.+)$/, so a bare token does not parse as one.
  assert.equal(
    await authenticate({
      method: "GET",
      path: "/api/me",
      headers: { authorization: token },
    }),
    null
  );
});

test("authenticate rejects a token signed with another secret", async () => {
  const storage = await seededStorage();
  const authenticate = createAuthenticate({
    storage,
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });

  const forged = signToken({ sub: jane.id, secret: "other-secret" });
  assert.equal(await authenticate(authorized(forged)), null);
});

test("authenticate rejects an expired token", async () => {
  const storage = await seededStorage();
  const authenticate = createAuthenticate({
    storage,
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });

  const expired = signToken({
    sub: jane.id,
    secret: TOKEN_SECRET,
    now: Date.now() - 31 * 24 * 60 * 60 * 1000, // issued 31 days ago
  });
  assert.equal(await authenticate(authorized(expired)), null);
});

test("authenticate returns null when the id pointer is missing", async () => {
  // A well-signed token for a user that no longer exists must not resolve.
  // The storage is empty, so no user-ids/ pointer was ever written for this
  // `sub` — the token is genuine, the account behind it is not there.
  const authenticate = createAuthenticate({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
    now: Date.now,
  });

  const token = signToken({ sub: "nonexistent-user-id", secret: TOKEN_SECRET });
  assert.equal(await authenticate(authorized(token)), null);
});
