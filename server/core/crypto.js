// Crypto primitives for the sync server (RFC §5). Plain Node, no dependencies.
const crypto = require("node:crypto");

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (AC-1.3)

const base64url = (buffer) => Buffer.from(buffer).toString("base64url");

const sha256Hex = (text) =>
  crypto.createHash("sha256").update(text).digest("hex");

// Hashes a plaintext password with scrypt (AC-1.2). Returns the storable
// record; the plaintext is never persisted.
const hashPassword = (password) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return {
    algo: "scrypt",
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    saltB64: salt.toString("base64"),
    hashB64: hash.toString("base64"),
  };
};

const verifyPassword = (password, record) => {
  const { N, r, p, saltB64, hashB64 } = record;
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(
    password,
    Buffer.from(saltB64, "base64"),
    expected.length,
    { N, r, p }
  );
  return crypto.timingSafeEqual(actual, expected);
};

const hmacSignature = (encodedPayload, secret) =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

// Compact HMAC-SHA256-signed token: base64url(payload).base64url(sig),
// payload { sub, iat, exp } (seconds). RFC §5.
const signToken = ({ sub, secret, now = Date.now(), ttlMs = TOKEN_TTL_MS }) => {
  const payload = {
    sub,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + ttlMs) / 1000),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${hmacSignature(encoded, secret)}`;
};

// Returns the payload when the signature is valid and the token unexpired,
// otherwise null. Never throws on malformed input.
const verifyToken = ({ token, secret, now = Date.now() }) => {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = Buffer.from(hmacSignature(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= now)
      return null;
    return payload;
  } catch (error) {
    return null;
  }
};

const randomId = () => crypto.randomUUID();

module.exports = {
  sha256Hex,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomId,
  TOKEN_TTL_MS,
};
