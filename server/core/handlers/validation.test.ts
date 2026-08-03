// Unit tests for the request-field guards (./validation.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmail, isNonEmptyString } from "./validation";

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
