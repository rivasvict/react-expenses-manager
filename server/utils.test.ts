// Unit tests for the transport helpers (./utils.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { PassThrough } from "node:stream";
import { PayloadTooLargeError, readBody } from "./utils";

// readBody only ever touches the readable-stream surface of an
// IncomingMessage, so a PassThrough stands in for one and keeps these tests
// off the network.
const fakeRequest = (): http.IncomingMessage & PassThrough =>
  new PassThrough() as http.IncomingMessage & PassThrough;

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
