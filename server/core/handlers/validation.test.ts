// Unit tests for the request-field guards (./validation.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isEmail,
  isNonEmptyString,
  isRecord,
  requestFields,
} from "./validation";

test("isRecord accepts objects and arrays but no other JSON value", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord({ data: 1 }), true);
  assert.equal(isRecord([]), true);

  for (const value of [undefined, null, 0, 42, "text", true])
    assert.equal(isRecord(value), false, `expected false for ${JSON.stringify(value)}`);
});

test("requestFields hands back the body's own fields when it is an object", () => {
  const body = { email: "jane@example.com", password: 42 };
  assert.deepEqual(requestFields(body), body);
});

test("requestFields turns a non-object body into an empty record", () => {
  // The transport parses whatever JSON arrived, so the body may be any
  // value at all. Each of these must read as `undefined` per field rather
  // than throwing, leaving the guards above to reject it.
  for (const body of [undefined, null, 42, "a string", true])
    assert.deepEqual(
      requestFields(body),
      {},
      `expected an empty record for ${JSON.stringify(body)}`
    );
});

test("isNonEmptyString accepts only strings with non-space content", () => {
  assert.equal(isNonEmptyString("jane"), true);
  assert.equal(isNonEmptyString(" jane "), true);

  assert.equal(isNonEmptyString(""), false);
  assert.equal(isNonEmptyString("   "), false);
});

test("isNonEmptyString rejects non-string JSON values", () => {
  // Bodies are parsed from untrusted JSON, so anything can arrive here.
  for (const value of [undefined, null, 0, 42, true, {}, [], ["a"]])
    assert.equal(isNonEmptyString(value), false, `expected false for ${JSON.stringify(value)}`);
});

test("isEmail accepts an address with a user, host and dotted domain", () => {
  assert.equal(isEmail("jane@example.com"), true);
  assert.equal(isEmail("jane.doe+tag@mail.example.co.uk"), true);
});

test("isEmail rejects strings missing an @ or a dotted domain", () => {
  for (const value of [
    "not-an-email",
    "jane@example",
    "jane@",
    "@example.com",
    "jane example.com",
    "jane@exa mple.com",
    "",
  ])
    assert.equal(isEmail(value), false, `expected false for "${value}"`);
});

test("isEmail rejects non-string values", () => {
  for (const value of [undefined, null, 42, {}, []])
    assert.equal(isEmail(value), false);
});
