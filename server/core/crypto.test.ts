// Unit tests for the crypto primitives (server/core/crypto.ts), exercised
// directly rather than through the HTTP layer: npm run test:server
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  TOKEN_TTL_MS,
  hashPassword,
  randomId,
  sha256Hex,
  signToken,
  verifyPassword,
  verifyToken,
} from "./crypto";

const SECRET = "unit-test-secret";
// A round number of milliseconds so `exp * 1000` lands exactly on `now` in the
// expiry-boundary test below.
const NOW = 1_700_000_000_000;

// Mirrors the module's private signing step so tests can mint tokens carrying
// arbitrary (even non-JSON) payloads with a genuinely valid signature.
const signRawPayload = (payload: string, secret = SECRET): string => {
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
};

test("signToken → verifyToken round-trips the claims", () => {
  const token = signToken({ sub: "user-1", secret: SECRET, now: NOW });
  const payload = verifyToken({ token, secret: SECRET, now: NOW });

  assert.deepEqual(payload, {
    sub: "user-1",
    iat: NOW / 1000,
    exp: (NOW + TOKEN_TTL_MS) / 1000,
  });
});

test("verifyToken rejects a token signed with a different secret", () => {
  const token = signToken({ sub: "user-1", secret: "other-secret", now: NOW });
  assert.equal(verifyToken({ token, secret: SECRET, now: NOW }), null);
});

test("verifyToken rejects tokens without exactly two dot-delimited parts", () => {
  const valid = signToken({ sub: "user-1", secret: SECRET, now: NOW });
  const [encoded, signature] = valid.split(".");

  for (const token of [
    "",
    "garbage",
    encoded,
    `${encoded}.${signature}.extra`,
    `.${encoded}.${signature}`,
  ])
    assert.equal(
      verifyToken({ token, secret: SECRET, now: NOW }),
      null,
      `expected rejection of ${JSON.stringify(token)}`
    );
});

test("verifyToken rejects a signature of the wrong byte length", () => {
  const [encoded, signature] = signToken({
    sub: "user-1",
    secret: SECRET,
    now: NOW,
  }).split(".");

  // Shorter and longer than expected: both must fail the length check before
  // timingSafeEqual (which throws on mismatched lengths) is ever reached.
  assert.equal(
    verifyToken({ token: `${encoded}.${signature.slice(0, 8)}`, secret: SECRET, now: NOW }),
    null
  );
  assert.equal(
    verifyToken({ token: `${encoded}.${signature}AA`, secret: SECRET, now: NOW }),
    null
  );
  assert.equal(verifyToken({ token: `${encoded}.`, secret: SECRET, now: NOW }), null);
});

test("verifyToken rejects a validly signed but unparseable payload", () => {
  const token = signRawPayload("{not-json");
  assert.equal(verifyToken({ token, secret: SECRET, now: NOW }), null);
});

test("verifyToken rejects a payload whose exp is missing or not a number", () => {
  const missingExp = signRawPayload(JSON.stringify({ sub: "u", iat: 1 }));
  const stringExp = signRawPayload(
    JSON.stringify({ sub: "u", iat: 1, exp: "9999999999" })
  );
  // JSON that parses to a non-object: property access throws, caught as invalid.
  const nullPayload = signRawPayload("null");

  assert.equal(verifyToken({ token: missingExp, secret: SECRET, now: NOW }), null);
  assert.equal(verifyToken({ token: stringExp, secret: SECRET, now: NOW }), null);
  assert.equal(verifyToken({ token: nullPayload, secret: SECRET, now: NOW }), null);
});

test("verifyToken treats the expiry instant itself as expired", () => {
  const token = signToken({ sub: "user-1", secret: SECRET, now: NOW, ttlMs: 0 });
  const expiresAt = NOW; // ttlMs 0 → exp = NOW / 1000, so exp * 1000 === NOW

  // One millisecond before expiry the token is still good...
  assert.equal(
    verifyToken({ token, secret: SECRET, now: expiresAt - 1 })?.sub,
    "user-1"
  );
  // ...and at exactly `exp * 1000` it is rejected (the check is `<=`).
  assert.equal(verifyToken({ token, secret: SECRET, now: expiresAt }), null);
  assert.equal(verifyToken({ token, secret: SECRET, now: expiresAt + 1 }), null);
});

test("hashPassword → verifyPassword round-trips and rejects a wrong password", () => {
  const record = hashPassword("hunter22!");

  assert.equal(record.algo, "scrypt");
  assert.ok(record.saltB64);
  assert.ok(record.hashB64);
  assert.ok(!JSON.stringify(record).includes("hunter22!"));

  assert.equal(verifyPassword("hunter22!", record), true);
  assert.equal(verifyPassword("hunter22", record), false);
  assert.equal(verifyPassword("", record), false);
});

test("hashPassword salts every record, so equal passwords hash differently", () => {
  const first = hashPassword("same-password");
  const second = hashPassword("same-password");

  assert.notEqual(first.saltB64, second.saltB64);
  assert.notEqual(first.hashB64, second.hashB64);
  // Both still verify: the salt travels with the record.
  assert.equal(verifyPassword("same-password", first), true);
  assert.equal(verifyPassword("same-password", second), true);
});

test("sha256Hex is a stable, case-sensitive hex digest", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  assert.equal(sha256Hex("jane@example.com"), sha256Hex("jane@example.com"));
  assert.notEqual(sha256Hex("jane@example.com"), sha256Hex("JANE@example.com"));
});

test("randomId returns distinct UUIDs", () => {
  const ids = new Set(Array.from({ length: 100 }, randomId));
  assert.equal(ids.size, 100);
  for (const id of ids)
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
});
