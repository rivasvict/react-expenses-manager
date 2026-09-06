// Unit tests for the invitation code and encryption primitives
// (server/core/invitations.ts). These pin the properties the at-rest
// guarantees rest on (AC-2.4/NFR-2, docs/multi-user-sync/PRD.md), so a
// change that quietly weakens one fails here rather than in review.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  codeLookupHash,
  decryptRecord,
  deriveEncryptionKey,
  encryptRecord,
  generateCode,
  normalizeCode,
} from "./invitations";

const key = deriveEncryptionKey("test-encryption-secret");
const otherKey = deriveEncryptionKey("a-different-secret");

interface Record {
  password: string;
  used: boolean;
  createdBy: string;
  nested: { deep: string[] };
}

const record: Record = {
  password: "scrypt-record-stand-in",
  used: false,
  createdBy: "user-1",
  nested: { deep: ["a", "b"] },
};

// --- Codes ----------------------------------------------------------------

test("generateCode produces a dashed 8-char base32 code", () => {
  for (let i = 0; i < 50; i += 1) {
    // The shape is what the organizer reads out and the invitee types back,
    // so it is part of the contract, not an implementation detail.
    assert.match(generateCode(), /^[A-Z2-7]{4}-[A-Z2-7]{4}$/);
  }
});

test("generateCode does not repeat itself", () => {
  const codes = new Set(Array.from({ length: 500 }, generateCode));

  // Not a randomness proof — just enough to catch a generator that has
  // collapsed to a constant or a tiny cycle.
  assert.equal(codes.size, 500);
});

test("normalizeCode makes hand-typed variants of one code equal", () => {
  const variants = ["K7X9-QP2M", "k7x9qp2m", " K7X9QP2M ", "k7x9-QP2M"];

  for (const variant of variants) assert.equal(normalizeCode(variant), "K7X9QP2M");
});

test("normalizeCode keeps genuinely different codes different", () => {
  assert.notEqual(normalizeCode("K7X9-QP2M"), normalizeCode("K7X9-QP2N"));
});

// --- Lookup hash ----------------------------------------------------------

test("codeLookupHash is stable across the forms a user might type", () => {
  const expected = codeLookupHash("K7X9-QP2M", key);

  assert.equal(codeLookupHash("k7x9qp2m", key), expected);
  assert.equal(codeLookupHash(" K7X9QP2M ", key), expected);
});

test("codeLookupHash is keyed, not a bare digest of the code", () => {
  // This is the property that makes a leaked record useless on its own. The
  // code is only ~40 bits, so an unkeyed hash could be brute-forced offline;
  // with the key mixed in, the same code hashes differently per server and
  // the search needs the key too.
  assert.notEqual(codeLookupHash("K7X9-QP2M", key), codeLookupHash("K7X9-QP2M", otherKey));
});

test("codeLookupHash separates different codes under one key", () => {
  assert.notEqual(codeLookupHash("K7X9-QP2M", key), codeLookupHash("K7X9-QP2N", key));
});

test("codeLookupHash reveals no part of the code", () => {
  const code = "K7X9-QP2M";
  const hash = codeLookupHash(code, key);

  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.ok(!hash.includes(normalizeCode(code).toLowerCase()));
});

// --- Key derivation -------------------------------------------------------

test("deriveEncryptionKey stretches any secret to 32 bytes for AES-256", () => {
  for (const secret of ["x", "dev-encryption-key", "a".repeat(500)])
    assert.equal(deriveEncryptionKey(secret).length, 32);
});

test("deriveEncryptionKey is deterministic per secret", () => {
  assert.deepEqual(
    deriveEncryptionKey("same-secret"),
    deriveEncryptionKey("same-secret")
  );
  assert.notDeepEqual(deriveEncryptionKey("a"), deriveEncryptionKey("b"));
});

// --- Record encryption ----------------------------------------------------

test("encryptRecord → decryptRecord round-trips the whole record", () => {
  const decrypted = decryptRecord<Record>(encryptRecord(record, key), key);

  assert.deepEqual(decrypted, record);
});

test("the ciphertext exposes nothing from the record", () => {
  const encrypted = encryptRecord(record, key);

  assert.ok(!encrypted.includes(record.password));
  assert.ok(!encrypted.includes(record.createdBy));
  // The base64 of the plaintext must not be sitting in there either — that
  // would mean the value was encoded rather than encrypted.
  assert.ok(!encrypted.includes(Buffer.from(record.password).toString("base64")));
});

test("each encryption of the same record differs (fresh IV per record)", () => {
  const first = encryptRecord(record, key);
  const second = encryptRecord(record, key);

  // A reused IV under GCM is catastrophic — two records under one nonce leak
  // their XOR. Identical input producing identical output is the symptom.
  assert.notEqual(first, second);
  assert.deepEqual(decryptRecord<Record>(first, key), record);
  assert.deepEqual(decryptRecord<Record>(second, key), record);
});

test("decryptRecord returns null under the wrong key", () => {
  assert.equal(decryptRecord(encryptRecord(record, key), otherKey), null);
});

test("decryptRecord returns null for a tampered ciphertext", () => {
  const encrypted = encryptRecord(record, key);
  const bytes = Buffer.from(encrypted, "base64");
  // Flip a bit in the ciphertext body, past the 12-byte IV and 16-byte tag.
  bytes[bytes.length - 1] ^= 0xff;

  // GCM authenticates as well as encrypts: a modified record must not decode
  // to *something*, it must be refused.
  assert.equal(decryptRecord(bytes.toString("base64"), key), null);
});

test("decryptRecord returns null for a tampered auth tag", () => {
  const bytes = Buffer.from(encryptRecord(record, key), "base64");
  bytes[12] ^= 0xff;

  assert.equal(decryptRecord(bytes.toString("base64"), key), null);
});

test("decryptRecord returns null for missing or malformed input", () => {
  // join looks up `party.invitations[hash]`, which is `undefined` when the
  // code belongs to no invitation on that party — that path must return null
  // rather than throw, or an unknown code would surface as a 500.
  for (const bad of [undefined, "", "not-base64-at-all!!", "AAAA"])
    assert.equal(decryptRecord(bad, key), null);
});
