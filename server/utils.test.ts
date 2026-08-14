// Unit tests for the transport helpers (./utils.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { PassThrough } from "node:stream";
import { createJsonResponder, PayloadTooLargeError, readBody } from "./utils";

// readBody only ever touches the readable-stream surface of an
// IncomingMessage, so a PassThrough stands in for one and keeps these tests
// off the network.
const fakeRequest = (): http.IncomingMessage & PassThrough =>
  new PassThrough() as http.IncomingMessage & PassThrough;

// createJsonResponder only ever calls writeHead and end, so a pair of
// recording stubs stands in for a ServerResponse and keeps these tests off
// the network too.
interface RecordedResponse {
  response: http.ServerResponse;
  writeHead: Array<{ status: number; headers: Record<string, string> }>;
  ended: string[];
}

const fakeResponse = (): RecordedResponse => {
  const recorded: RecordedResponse = {
    response: null as unknown as http.ServerResponse,
    writeHead: [],
    ended: [],
  };
  recorded.response = {
    writeHead: (status: number, headers: Record<string, string>) => {
      recorded.writeHead.push({ status, headers });
    },
    end: (chunk: string) => {
      recorded.ended.push(chunk);
    },
  } as unknown as http.ServerResponse;
  return recorded;
};

test("readBody resolves with the whole body as utf8", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 1024);

  request.write("hello ");
  request.write("world");
  request.end();

  assert.equal(await pending, "hello world");
});

test("readBody joins chunks that split a multi-byte character", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 1024);

  // "é" is two bytes; decoding per chunk rather than after concatenation
  // would corrupt it.
  const encoded = Buffer.from("café", "utf8");
  request.write(encoded.subarray(0, 3));
  request.write(encoded.subarray(3));
  request.end();

  assert.equal(await pending, "café");
});

test("readBody resolves with an empty string for an empty body", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 1024);
  request.end();

  assert.equal(await pending, "");
});

test("readBody accepts a body exactly at the cap", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 8);

  request.end("12345678");

  assert.equal(await pending, "12345678");
});

test("readBody rejects a body one byte over the cap", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 8);

  request.end("123456789");

  // A typed error, so the adapter can answer 413 rather than lumping this in
  // with unexpected failures as a 500.
  await assert.rejects(pending, PayloadTooLargeError);
});

test("readBody leaves the stream readable after an overflow", async () => {
  // It must not destroy the request: doing so kills the socket before the
  // 413 response can be flushed, and the client sees a connection reset
  // instead of the status.
  const request = fakeRequest();
  const pending = readBody(request, 8);

  request.write("123456789");

  await assert.rejects(pending, PayloadTooLargeError);
  assert.equal(request.destroyed, false);
});

test("readBody keeps draining after an overflow without buffering", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 8);

  request.write("123456789");
  await assert.rejects(pending, PayloadTooLargeError);

  // Further writes are discarded rather than accumulated, so an oversized
  // body cannot grow the process's memory after the cap trips.
  request.write("x".repeat(10_000));
  request.end();

  await new Promise((resolve) => request.on("end", resolve));
  assert.equal(request.readableLength, 0);
});

test("readBody propagates a stream error", async () => {
  const request = fakeRequest();
  const pending = readBody(request, 1024);

  request.emit("error", new Error("connection reset"));

  await assert.rejects(pending, /connection reset/);
});

test("createJsonResponder writes the status with JSON and CORS headers", () => {
  const recorded = fakeResponse();

  createJsonResponder(recorded.response, "https://app.example.com")(201, {});

  assert.deepEqual(recorded.writeHead, [
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://app.example.com",
      },
    },
  ]);
});

test("createJsonResponder serializes the body as JSON", () => {
  const recorded = fakeResponse();
  const body = { error: { code: "NOT_FOUND", message: "No such route." } };

  createJsonResponder(recorded.response, "*")(404, body);

  assert.deepEqual(recorded.ended, [JSON.stringify(body)]);
  assert.deepEqual(JSON.parse(recorded.ended[0]), body);
});

test("createJsonResponder applies its origin to every reply it sends", () => {
  // The origin is captured once when the responder is built, so a handler
  // cannot reply with the CORS header missing or stale on a later call.
  const recorded = fakeResponse();
  const sendJson = createJsonResponder(recorded.response, "https://app.example.com");

  sendJson(200, { ok: true });
  sendJson(500, { ok: false });

  assert.deepEqual(
    recorded.writeHead.map(({ headers }) => headers["Access-Control-Allow-Origin"]),
    ["https://app.example.com", "https://app.example.com"]
  );
  assert.deepEqual(recorded.writeHead.map(({ status }) => status), [200, 500]);
});
