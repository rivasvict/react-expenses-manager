// Unit tests for the user storage keys (./userKeys.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { userIdKey, userKey } from "./userKeys";
import { sha256Hex } from "../crypto";

test("userKey hashes the normalized email under the users/ prefix", () => {
  assert.equal(
    userKey("jane@example.com"),
    `users/${sha256Hex("jane@example.com")}`
  );
});

test("userKey normalizes case and surrounding whitespace", () => {
  // Signup's duplicate check and login's lookup both go through this, so
  // these four spellings must land on one record.
  const expected = userKey("jane@example.com");

  assert.equal(userKey("JANE@example.com"), expected);
  assert.equal(userKey("Jane@Example.COM"), expected);
  assert.equal(userKey("  jane@example.com  "), expected);
});

test("userKey never embeds the address in plaintext", () => {
  assert.ok(!userKey("jane@example.com").includes("jane@example.com"));
  assert.ok(!userKey("jane@example.com").includes("jane"));
});

test("different emails get different keys", () => {
  assert.notEqual(userKey("jane@example.com"), userKey("john@example.com"));
});

test("userIdKey namespaces the pointer away from the primary record", () => {
  assert.equal(userIdKey("abc-123"), "user-ids/abc-123");
});

test("userKey and userIdKey never derive the same key from one value", () => {
  // The two key spaces must not collide: a user id can never be read back as
  // a user record, or vice versa. Feeding the same value to both is the
  // check that actually exercises that — asserting the "user-ids/" literal
  // does not start with "users/" only restates the two prefix constants.
  for (const value of ["abc-123", "jane@example.com", "users", ""])
    assert.notEqual(
      userIdKey(value),
      userKey(value),
      `both key functions collided on "${value}"`
    );
});
