// Unit tests for the party storage keys (./partyKeys.ts). Storage is a flat
// key→JSON map, so these strings are the only addressing there is: a change
// here silently orphans every record already written under the old shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { backupKey, invitationPointerKey, partyKey } from "./partyKeys";
import { userIdKey, userKey } from "./userKeys";

test("partyKey namespaces the party id under parties/", () => {
  assert.equal(partyKey("abc-123"), "parties/abc-123");
});

test("backupKey addresses the party's backup next to, not at, its record", () => {
  assert.equal(backupKey("abc-123"), "parties/abc-123.backup");
  // The two are separate versioned keys so their compare-and-swaps never
  // interfere: an upload does not race a block, and vice versa.
  assert.notEqual(backupKey("abc-123"), partyKey("abc-123"));
});

test("invitationPointerKey namespaces the lookup hash under invitations/", () => {
  assert.equal(invitationPointerKey("deadbeef"), "invitations/deadbeef");
});

// Scope: repeated calls are all a black-box test can observe here, so
// determinism is the whole claim — the same input always addresses the same
// key, which is what stops a record from becoming unreachable after a write.
test("all key builders are deterministic for a given input", () => {
  assert.equal(partyKey("abc-123"), partyKey("abc-123"));
  assert.equal(invitationPointerKey("hash"), invitationPointerKey("hash"));
  assert.equal(backupKey("abc-123"), backupKey("abc-123"));
});

test("distinct ids and hashes never collide within a namespace", () => {
  assert.notEqual(partyKey("abc"), partyKey("abd"));
  assert.notEqual(invitationPointerKey("aa"), invitationPointerKey("ab"));
  assert.notEqual(backupKey("abc"), backupKey("abd"));
});

test("no key collides with another namespace's keys", () => {
  // The prefixes are what keep four independent record families apart in one
  // flat map. Sharing an identifier across two of them must still address two
  // different records.
  const shared = "same-identifier";
  const keys = [
    partyKey(shared),
    backupKey(shared),
    invitationPointerKey(shared),
    userIdKey(shared),
    userKey(shared),
  ];

  assert.equal(new Set(keys).size, keys.length);
});
