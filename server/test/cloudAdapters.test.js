// Unit tests for the cloud adapters (RFC §7): the Lambda Function URL
// event mapping (against the real core with in-memory storage) and the
// S3 storage adapter's request building/CAS mapping (with an injected
// fetch — CI never talks to AWS, by design).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../core/router");
const { createMemoryStorage } = require("../core/storage");
const { createLambdaHandler } = require("../lambda");
const { createS3Storage } = require("../storage-s3");

// ---------------------------------------------------------------------------
// lambda.js
// ---------------------------------------------------------------------------

const makeHandler = () =>
  createLambdaHandler({
    app: createApp({
      storage: createMemoryStorage(),
      tokenSecret: "test-secret",
      encryptionSecret: "test-encryption-secret",
    }),
    corsOrigin: "https://app.example.com",
  });

const functionUrlEvent = ({ method, path, body, headers = {} }) => ({
  rawPath: path,
  headers,
  requestContext: { http: { method } },
  ...(body === undefined
    ? {}
    : { body: JSON.stringify(body), isBase64Encoded: false }),
});

test("lambda: maps a Function URL signup event onto the core", async () => {
  const handler = makeHandler();
  const response = await handler(
    functionUrlEvent({
      method: "POST",
      path: "/api/auth/signup",
      body: {
        email: "jane@example.com",
        password: "pw-123456",
        firstName: "Jane",
        lastName: "Doe",
      },
    })
  );
  assert.equal(response.statusCode, 201);
  assert.equal(
    response.headers["access-control-allow-origin"],
    "https://app.example.com"
  );
  const body = JSON.parse(response.body);
  assert.ok(body.token);
  assert.equal(body.user.email, "jane@example.com");
});

test("lambda: normalizes mixed-case headers so Bearer auth works", async () => {
  const handler = makeHandler();
  const signup = await handler(
    functionUrlEvent({
      method: "POST",
      path: "/api/auth/signup",
      body: {
        email: "jane@example.com",
        password: "pw-123456",
        firstName: "Jane",
        lastName: "Doe",
      },
    })
  );
  const { token } = JSON.parse(signup.body);

  const me = await handler(
    functionUrlEvent({
      method: "GET",
      path: "/api/me",
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  assert.equal(me.statusCode, 200);
  assert.equal(JSON.parse(me.body).user.firstName, "Jane");
});

test("lambda: base64 bodies, bad JSON and oversized payloads", async () => {
  const handler = makeHandler();

  const base64Event = {
    rawPath: "/api/auth/login",
    headers: {},
    requestContext: { http: { method: "POST" } },
    body: Buffer.from(
      JSON.stringify({ email: "x@y.z", password: "nope" })
    ).toString("base64"),
    isBase64Encoded: true,
  };
  assert.equal((await handler(base64Event)).statusCode, 401); // decoded fine

  const badJson = await handler({
    rawPath: "/api/auth/login",
    headers: {},
    requestContext: { http: { method: "POST" } },
    body: "{not json",
    isBase64Encoded: false,
  });
  assert.equal(badJson.statusCode, 400);

  const oversized = await handler({
    rawPath: "/api/party/backup",
    headers: {},
    requestContext: { http: { method: "PUT" } },
    body: `{"padding":"${"x".repeat(1024 * 1024 + 64)}"}`,
    isBase64Encoded: false,
  });
  assert.equal(oversized.statusCode, 413);
  assert.equal(JSON.parse(oversized.body).error.code, "PAYLOAD_TOO_LARGE");
});

test("lambda: OPTIONS preflight answers CORS", async () => {
  const handler = makeHandler();
  const response = await handler(
    functionUrlEvent({ method: "OPTIONS", path: "/api/me" })
  );
  assert.equal(response.statusCode, 204);
  assert.equal(
    response.headers["access-control-allow-origin"],
    "https://app.example.com"
  );
});

// ---------------------------------------------------------------------------
// storage-s3.js
// ---------------------------------------------------------------------------

const makeS3 = (respond) => {
  const requests = [];
  const storage = createS3Storage({
    bucket: "my-sync-bucket",
    region: "eu-west-1",
    credentials: {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "secret-key-example",
      sessionToken: "session-token-example",
    },
    now: () => new Date("2026-07-13T10:00:00Z"),
    fetchImpl: async (url, options) => {
      requests.push({ url, ...options });
      return respond(url, options);
    },
  });
  return { storage, requests };
};

const okResponse = (bodyText, etag) => ({
  ok: true,
  status: 200,
  headers: { get: (name) => (name === "etag" ? etag : null) },
  text: async () => bodyText,
});

const statusResponse = (status) => ({
  ok: false,
  status,
  headers: { get: () => null },
  text: async () => "<Error/>",
});

test("s3: reads map 404 to null and 200 to parsed JSON + ETag version", async () => {
  const { storage, requests } = makeS3((url) =>
    url.includes("missing")
      ? statusResponse(404)
      : okResponse('{"id":"u1"}', '"etag-1"')
  );

  assert.equal(await storage.readJson("users/missing"), null);
  assert.deepEqual(await storage.readJson("users/u1"), { id: "u1" });
  assert.deepEqual(await storage.readJsonVersioned("parties/p1"), {
    value: { id: "u1" },
    version: '"etag-1"',
  });
  assert.equal(
    requests[1].url,
    "https://my-sync-bucket.s3.eu-west-1.amazonaws.com/users/u1.json"
  );
});

test("s3: CAS writes send the right conditional headers and map 412/409 to null", async () => {
  let nextStatus = 200;
  const { storage, requests } = makeS3(() =>
    nextStatus === 200
      ? okResponse("", '"etag-2"')
      : statusResponse(nextStatus)
  );

  // Create-only (EC-1) → If-None-Match: *.
  const created = await storage.writeJsonVersioned(
    "parties/p1.backup",
    { a: 1 },
    { expectedVersion: null }
  );
  assert.equal(created, '"etag-2"');
  assert.equal(requests[0].headers["if-none-match"], "*");
  assert.equal(requests[0].method, "PUT");

  // Swap → If-Match: <version>.
  await storage.writeJsonVersioned(
    "parties/p1.backup",
    { a: 2 },
    { expectedVersion: '"etag-2"' }
  );
  assert.equal(requests[1].headers["if-match"], '"etag-2"');

  // Precondition failures are CAS misses, not errors (EC-2).
  nextStatus = 412;
  assert.equal(
    await storage.writeJsonVersioned("k", {}, { expectedVersion: '"x"' }),
    null
  );
  nextStatus = 409;
  assert.equal(
    await storage.writeJsonVersioned("k", {}, { expectedVersion: null }),
    null
  );
});

test("s3: requests carry a complete SigV4 signature over the conditional headers", async () => {
  const { storage, requests } = makeS3(() => okResponse("", '"e"'));
  await storage.writeJsonVersioned("parties/p1", { a: 1 }, { expectedVersion: null });

  const headers = requests[0].headers;
  assert.equal(headers.host, "my-sync-bucket.s3.eu-west-1.amazonaws.com");
  assert.equal(headers["x-amz-date"], "20260713T100000Z");
  assert.match(headers["x-amz-content-sha256"], /^[0-9a-f]{64}$/);
  assert.equal(headers["x-amz-security-token"], "session-token-example");
  assert.match(
    headers.authorization,
    /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260713\/eu-west-1\/s3\/aws4_request, SignedHeaders=.*, Signature=[0-9a-f]{64}$/
  );
  // The conditional header participates in the signature.
  assert.ok(headers.authorization.includes("if-none-match"));

  // The signature is credential-dependent (not a constant).
  const other = createS3Storage({
    bucket: "my-sync-bucket",
    region: "eu-west-1",
    credentials: { accessKeyId: "AKIDEXAMPLE", secretAccessKey: "different" },
    now: () => new Date("2026-07-13T10:00:00Z"),
    fetchImpl: async (url, options) => {
      assert.notEqual(options.headers.authorization, headers.authorization);
      return okResponse("", '"e"');
    },
  });
  await other.writeJsonVersioned("parties/p1", { a: 1 }, { expectedVersion: null });
});
