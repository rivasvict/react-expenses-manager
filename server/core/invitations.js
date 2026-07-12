// Invitation codes and encrypted invitation records (RFC §5, AC-2.4/NFR-2).
//
// The code is 8 random base32 chars shown once as XXXX-XXXX. It is stored
// only as a keyed lookup hash (HMAC-SHA256 under the server encryption
// key — a bare hash of a 40-bit code could be brute-forced offline from a
// leaked record); the record itself ({ password: scrypt fields, used,
// createdBy, createdAt }) is AES-256-GCM-encrypted with the same key —
// neither the code nor the invite password ever exists in plaintext at
// rest.
const crypto = require("node:crypto");

// RFC 4648 base32 alphabet — unambiguous uppercase letters and digits.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CODE_LENGTH = 8;
const IV_LENGTH = 12;

// "K7X9-QP2M" and "k7x9qp2m" are the same code: normalize before hashing
// so hand-typed input matches the generated form.
const normalizeCode = (code) =>
  String(code || "").replace(/-/g, "").trim().toUpperCase();

const codeLookupHash = (code, key) =>
  crypto.createHmac("sha256", key).update(normalizeCode(code)).digest("hex");

const generateCode = () => {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  const chars = Array.from(bytes)
    .map((byte) => BASE32_ALPHABET[byte % 32])
    .join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
};

// The ENCRYPTION_KEY env var is an arbitrary secret string; it is stretched
// to the required 32 bytes by hashing, so any value works locally.
const deriveEncryptionKey = (secret) =>
  crypto.createHash("sha256").update(secret).digest();

// base64( iv | authTag | ciphertext ), fresh random IV per record.
const encryptRecord = (record, key) => {
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

// Returns the record, or null when the blob is malformed or was encrypted
// with a different key.
const decryptRecord = (encoded, key) => {
  try {
    const buffer = Buffer.from(encoded, "base64");
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = buffer.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch (error) {
    return null;
  }
};

module.exports = {
  normalizeCode,
  codeLookupHash,
  generateCode,
  deriveEncryptionKey,
  encryptRecord,
  decryptRecord,
};
