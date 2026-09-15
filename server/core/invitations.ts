// Invitation codes and the encryption that keeps invitation records safe at
// rest (docs/multi-user-sync/RFC.md §5, AC-2.4/NFR-2 in
// docs/multi-user-sync/PRD.md). Plain Node, no dependencies.
//
// The code is 8 random base32 chars, shown to the organizer once as
// XXXX-XXXX. It is stored only as a *keyed* lookup hash (HMAC-SHA256 under
// the server encryption key). A bare sha256 would not do: the code is only
// ~40 bits of entropy, so an attacker holding a leaked record could enumerate
// the whole space offline in seconds. Keying the hash means that attack needs
// the server key as well, which a leaked record does not carry.
//
// The record behind that hash ({ password: scrypt fields, used, createdBy,
// createdAt }) is AES-256-GCM-encrypted under the same key, so neither the
// code nor the invitation password ever exists in plaintext at rest.
import crypto from "node:crypto";

// RFC 4648 base32 alphabet — uppercase letters and digits only, so a code
// read aloud or typed by hand has no case or 0/O-style ambiguity.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CODE_LENGTH = 8;
// GCM's standard nonce size; a fresh one is generated per record.
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// "K7X9-QP2M" and "k7x9qp2m" are the same code: normalize before hashing so
// hand-typed input matches the generated form.
export const normalizeCode = (code: string): string =>
  String(code || "")
    .replace(/-/g, "")
    .trim()
    .toUpperCase();

// The storage lookup key for a code. Keyed, not a bare digest — see the note
// at the top of this file.
export const codeLookupHash = (code: string, key: Buffer): string =>
  crypto.createHmac("sha256", key).update(normalizeCode(code)).digest("hex");

export const generateCode = (): string => {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  const chars = Array.from(bytes)
    .map((byte) => BASE32_ALPHABET[byte % 32])
    .join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
};

// The ENCRYPTION_KEY env var is an arbitrary secret string; it is
// stretched to the 32 bytes AES-256 requires by hashing, so any value works
// locally without the operator having to supply exact key material.
export const deriveEncryptionKey = (secret: string): Buffer =>
  crypto.createHash("sha256").update(secret).digest();

// base64( iv | authTag | ciphertext ), with a fresh random IV per record.
export const encryptRecord = <T>(record: T, key: Buffer): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(record), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64"
  );
};

// Returns the record, or null when the blob is missing, malformed, tampered
// with (GCM's auth tag fails), or was encrypted under a different key.
export const decryptRecord = <T>(
  encoded: string | undefined,
  key: Buffer
): T | null => {
  try {
    const buffer = Buffer.from(String(encoded), "base64");
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch (error) {
    return null;
  }
};
