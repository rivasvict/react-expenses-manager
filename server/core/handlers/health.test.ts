// Unit tests for the /api/health handler (./health.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHealthHandler } from "./health";
import { HTTP_STATUS } from "../httpConstants";
import { HealthBody } from "../handlers.types";

const request = { method: "GET", path: "/api/health" };

test("answers 200 with a plain ok body", async () => {
  const response = await createHealthHandler()(request);

  assert.equal(response.status, HTTP_STATUS.OK);
  assert.deepEqual(response.body as HealthBody, { status: "ok" });
});

test("answers without a token, so an unreachable server is the only failure", async () => {
  // The probe is what tells a client the server is up; requiring a session
  // would make "logged out" and "server down" the same answer.
  const response = await createHealthHandler()({
    ...request,
    headers: {},
  });

  assert.equal(response.status, HTTP_STATUS.OK);
});
