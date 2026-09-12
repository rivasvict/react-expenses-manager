// Unit tests for the party storage keys (./partyKeys.ts). Storage is a flat
// key→JSON map, so these strings are the only addressing there is: a change
// here silently orphans every record already written under the old shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { invitationPointerKey, partyKey } from "./partyKeys";
import { userIdKey, userKey } from "./userKeys";

test("partyKey namespaces the party id under parties/", () => {
  assert.equal(partyKey("abc-123"), "parties/abc-123");
});

test("invitationPointerKey namespaces the lookup hash under invitations/", () => {
  assert.equal(invitationPointerKey("deadbeef"), "invitations/deadbeef");
});

// Only determinism is claimed here, because repeated calls are all a
// black-box test can actually observe: a function could mutate shared state
// or log on the side and still return the same string twice. That the
// builders are also side-effect free is evident from ./partyKeys.ts instead —
// each is a one-line template literal over its argument, closing over nothing.
test("both key builders are deterministic for a given input", () => {
  assert.equal(partyKey("abc-123"), partyKey("abc-123"));
  assert.equal(invitationPointerKey("hash"), invitationPointerKey("hash"));
});

test("distinct ids and hashes never collide within a namespace", () => {
  assert.notEqual(partyKey("abc"), partyKey("abd"));
  assert.notEqual(invitationPointerKey("aa"), invitationPointerKey("ab"));
});

test("no key collides with another namespace's keys", () => {
  // The prefixes are what keep four independent record families apart in one
  // flat map. Sharing an identifier across two of them must still address two
  // different records.
  const shared = "same-identifier";
  const keys = [
    partyKey(shared),
    invitationPointerKey(shared),
    userIdKey(shared),
    userKey(shared),
  ];

  assert.equal(new Set(keys).size, keys.length);
});
