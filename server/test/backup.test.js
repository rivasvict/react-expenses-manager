// Contract tests for RFC §3.9–3.10 (backup download/upload with
// compare-and-swap) and the transport-level 1 MB limit (413).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("../core/router");
const { createMemoryStorage } = require("../core/storage");
const { createSyncHttpServer } = require("../index");

const TOKEN_SECRET = "test-secret";

const makeApp = () =>
  createApp({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
    encryptionSecret: "test-encryption-secret",
  });

const asBearer = (token) => ({ authorization: `Bearer ${token}` });

const signup = async (app, email, firstName) => {
  const result = await app.handle({
    method: "POST",
    path: "/api/auth/signup",
    body: { email, password: "pw-123456", firstName, lastName: "Doe" },
  });
  assert.equal(result.status, 201);
  return result.body;
};

const envelopeWith = (balance) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-07-12T00:00:00.000Z",
  data: { balance, buckets: {}, categories: [], fixedEntries: [] },
});

const getBackup = (app, token) =>
  app.handle({
    method: "GET",
    path: "/api/party/backup",
    headers: asBearer(token),
  });

const putBackup = (app, token, body) =>
  app.handle({
    method: "PUT",
    path: "/api/party/backup",
    headers: asBearer(token),
    body,
  });

const setupOrganizer = async (app) => {
  const jane = await signup(app, "jane@example.com", "Jane");
  const created = await app.handle({
    method: "POST",
    path: "/api/party",
    headers: asBearer(jane.token),
  });
  assert.equal(created.status, 201);
  return jane;
};

test("backup upload/download lifecycle with baseVersion CAS", async () => {
  const app = makeApp();
  const jane = await setupOrganizer(app);

  // EC-1: no backup yet.
  const empty = await getBackup(app, jane.token);
  assert.equal(empty.status, 404);
  assert.equal(empty.body.error.code, "NO_BACKUP");

  // Create-only upload (baseVersion: null).
  const first = await putBackup(app, jane.token, {
    baseVersion: null,
    envelope: envelopeWith([{ id: "e1", amount: "10" }]),
  });
  assert.equal(first.status, 200);
  assert.ok(first.body.version);

  // Download returns the envelope plus its version.
  const downloaded = await getBackup(app, jane.token);
  assert.equal(downloaded.status, 200);
  assert.equal(downloaded.body.version, first.body.version);
  assert.deepEqual(downloaded.body.envelope.data.balance, [
    { id: "e1", amount: "10" },
  ]);

  // A second create-only upload is rejected (backup already exists).
  const createAgain = await putBackup(app, jane.token, {
    baseVersion: null,
    envelope: envelopeWith([]),
  });
  assert.equal(createAgain.status, 409);
  assert.equal(createAgain.body.error.code, "VERSION_CONFLICT");

  // Upload against the current version succeeds and bumps it.
  const second = await putBackup(app, jane.token, {
    baseVersion: first.body.version,
    envelope: envelopeWith([{ id: "e2", amount: "20" }]),
  });
  assert.equal(second.status, 200);
  assert.notEqual(second.body.version, first.body.version);

  // A stale baseVersion is rejected with VERSION_CONFLICT (EC-2).
  const stale = await putBackup(app, jane.token, {
    baseVersion: first.body.version,
    envelope: envelopeWith([]),
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, "VERSION_CONFLICT");

  // The winning upload is what a fresh download sees.
  const final = await getBackup(app, jane.token);
  assert.deepEqual(final.body.envelope.data.balance, [
    { id: "e2", amount: "20" },
  ]);
});

test("backup upload validates envelope shape, app id and size", async () => {
  const app = makeApp();
  const jane = await setupOrganizer(app);

  const missing = await putBackup(app, jane.token, { baseVersion: null });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, "VALIDATION_ERROR");

  const wrongApp = await putBackup(app, jane.token, {
    baseVersion: null,
    envelope: { ...envelopeWith([]), app: "someone-elses-app" },
  });
  assert.equal(wrongApp.status, 400);

  const badBaseVersion = await putBackup(app, jane.token, {
    baseVersion: 7,
    envelope: envelopeWith([]),
  });
  assert.equal(badBaseVersion.status, 400);

  // Oversized envelope (> 1 MB serialized) → 400 VALIDATION_ERROR.
  const oversized = await putBackup(app, jane.token, {
    baseVersion: null,
    envelope: envelopeWith([
      { id: "big", description: "x".repeat(1024 * 1024) },
    ]),
  });
  assert.equal(oversized.status, 400);
  assert.equal(oversized.body.error.code, "VALIDATION_ERROR");
});

test("requests without a party are rejected with NO_PARTY", async () => {
  const app = makeApp();
  const sam = await signup(app, "sam@example.com", "Sam");
  const result = await getBackup(app, sam.token);
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "NO_PARTY");
});

test("HTTP transport rejects a >1 MB body with 413 PAYLOAD_TOO_LARGE", async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-server-413-"));
  const server = createSyncHttpServer({ storageDir: dataDir });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://localhost:${port}/api/party/backup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(1024 * 1024 + 64) }),
    });
    assert.equal(response.status, 413);
    const body = await response.json();
    assert.equal(body.error.code, "PAYLOAD_TOO_LARGE");

    // A regular-sized request on the same server still works (the
    // connection-level destroy doesn't wedge the server).
    const ok = await fetch(`http://localhost:${port}/api/me`);
    assert.equal(ok.status, 401);
  } finally {
    server.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test("malformed percent-encoding in a path param is a 404, not a 500", async () => {
  const app = makeApp();
  const jane = await setupOrganizer(app);
  const result = await app.handle({
    method: "POST",
    path: "/api/party/members/%E0%A4%A/block",
    headers: asBearer(jane.token),
    body: {},
  });
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, "NOT_FOUND");
});
