// Unit tests for the node:http transport adapter (server/index.ts). The core
// contract tests bypass HTTP entirely, so everything here — body reading, JSON
// parsing, CORS, the size cap, status/header wiring — is otherwise untested.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { AddressInfo } from "node:net";
import { createRequestListener } from "./index";
import { createApp } from "./core/router";
import { createMemoryStorage } from "./core/storage";
import { ERROR_CODES, HTTP_STATUS } from "./core/httpConstants";

const TOKEN_SECRET = "test-secret";

interface Reply {
  status: number;
  headers: http.IncomingHttpHeaders;
  raw: string;
  json: () => unknown;
}

interface RequestOptions {
  method?: string;
  path?: string;
  body?: string;
  headers?: Record<string, string>;
}

// Boots a listener on an ephemeral port, runs `check`, then always closes it.
const withServer = async (
  run: (request: (options: RequestOptions) => Promise<Reply>) => Promise<void>,
  listenerOptions: { maxBodyBytes?: number; corsOrigin?: string } = {}
): Promise<void> => {
  const app = createApp({
    storage: createMemoryStorage(),
    tokenSecret: TOKEN_SECRET,
  });
  const server = http.createServer(
    createRequestListener({ app, ...listenerOptions })
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  const request = ({
    method = "GET",
    path = "/",
    body,
    headers = {},
  }: RequestOptions): Promise<Reply> =>
    new Promise((resolve, reject) => {
      const req = http.request(
        { host: "127.0.0.1", port, method, path, headers },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              raw,
              json: () => JSON.parse(raw),
            });
          });
        }
      );
      req.on("error", reject);
      if (body !== undefined) req.write(body);
      req.end();
    });

  try {
    await run(request);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const postJson = (
  request: (options: RequestOptions) => Promise<Reply>,
  path: string,
  payload: unknown
): Promise<Reply> =>
  request({
    method: "POST",
    path,
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

test("a JSON POST body reaches the handler and the reply is JSON", () =>
  withServer(async (request) => {
    const response = await postJson(request, "/api/auth/signup", jane);

    assert.equal(response.status, HTTP_STATUS.CREATED);
    assert.equal(response.headers["content-type"], "application/json");
    const body = response.json() as { token: string; user: { email: string } };
    assert.ok(body.token);
    assert.equal(body.user.email, "jane@example.com");
  }));

test("a malformed JSON body returns 400 VALIDATION_ERROR", () =>
  withServer(async (request) => {
    const response = await request({
      method: "POST",
      path: "/api/auth/signup",
      body: "{not json",
      headers: { "Content-Type": "application/json" },
    });

    assert.equal(response.status, HTTP_STATUS.BAD_REQUEST);
    assert.deepEqual(response.json(), {
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Invalid JSON body." },
    });
  }));

test("an empty body is passed through as null, not a parse error", () =>
  withServer(async (request) => {
    // No body at all: the handler runs and rejects it on validation, which
    // proves the transport did not short-circuit with "Invalid JSON body".
    const response = await request({ method: "POST", path: "/api/auth/login" });

    assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
    const body = response.json() as { error: { code: string } };
    assert.equal(body.error.code, ERROR_CODES.INVALID_CREDENTIALS);
  }));

test("the query string is stripped before routing", () =>
  withServer(async (request) => {
    const response = await request({ method: "GET", path: "/api/me?foo=bar" });

    // Routed to /api/me (401 for the missing token), not 404.
    assert.equal(response.status, HTTP_STATUS.UNAUTHORIZED);
  }));

test("unknown paths return the core's 404", () =>
  withServer(async (request) => {
    const response = await request({ method: "GET", path: "/api/nope" });

    assert.equal(response.status, HTTP_STATUS.NOT_FOUND);
    const body = response.json() as { error: { code: string } };
    assert.equal(body.error.code, ERROR_CODES.NOT_FOUND);
  }));

test("an Authorization header is forwarded to the handler", () =>
  withServer(async (request) => {
    const signup = await postJson(request, "/api/auth/signup", jane);
    const { token } = signup.json() as { token: string };

    const me = await request({
      method: "GET",
      path: "/api/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(me.status, HTTP_STATUS.OK);
    const body = me.json() as { user: { email: string } };
    assert.equal(body.user.email, "jane@example.com");
  }));

test("OPTIONS preflight returns 204 with CORS headers and no body", () =>
  withServer(async (request) => {
    const response = await request({ method: "OPTIONS", path: "/api/me" });

    assert.equal(response.status, HTTP_STATUS.NO_CONTENT);
    assert.equal(response.raw, "");
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:3000"
    );
    assert.match(
      String(response.headers["access-control-allow-headers"]),
      /Authorization/
    );
  }));

test("the CORS origin is configurable and set on normal replies too", () =>
  withServer(
    async (request) => {
      const response = await request({ method: "GET", path: "/api/nope" });

      assert.equal(
        response.headers["access-control-allow-origin"],
        "https://app.example.com"
      );
    },
    { corsOrigin: "https://app.example.com" }
  ));

test("a body over the size cap is rejected rather than buffered", () =>
  withServer(
    async (request) => {
      const response = await request({
        method: "POST",
        path: "/api/auth/signup",
        body: JSON.stringify({ ...jane, padding: "x".repeat(4096) }),
        headers: { "Content-Type": "application/json" },
      }).catch((error: Error) => error);

      // The listener destroys the socket once the cap is passed, so the
      // client sees either a 500 from the error path or a transport-level
      // reset — never a successful signup.
      if (response instanceof Error) {
        assert.match(response.message, /socket hang up|ECONNRESET|aborted/);
        return;
      }
      assert.notEqual(response.status, HTTP_STATUS.CREATED);
    },
    { maxBodyBytes: 1024 }
  ));
