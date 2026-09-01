// Crypto primitives for the sync server (RFC §5). Plain Node, no dependencies.
import crypto from "node:crypto";
// The record and token shapes live in ./crypto.types.
import {
  ScryptPasswordRecord,
  SignTokenOptions,
  TokenPayload,
  VerifyTokenOptions,
} from "./crypto.types";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
export const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (AC-1.3)

export type {
  ScryptPasswordRecord,
  SignTokenOptions,
  TokenPayload,
  VerifyTokenOptions,
} from "./crypto.types";

const base64url = (buffer: Buffer | string): string =>
  Buffer.from(buffer).toString("base64url");

export const sha256Hex = (text: string): string =>
  crypto.createHash("sha256").update(text).digest("hex");

// Hashes a plaintext password with scrypt (AC-1.2). Returns the storable
// record; the plaintext is never persisted.
export const hashPassword = (password: string): ScryptPasswordRecord => {
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

export const verifyPassword = (
  password: string,
  record: ScryptPasswordRecord
): boolean => {
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

const hmacSignature = (encodedPayload: string, secret: string): string =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

// Compact HMAC-SHA256-signed token: base64url(payload).base64url(sig),
// payload { sub, iat, exp } (seconds). RFC §5.
export const signToken = ({
  sub,
  secret,
  now = Date.now(),
  ttlMs = TOKEN_TTL_MS,
}: SignTokenOptions): string => {
  const payload: TokenPayload = {
    sub,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + ttlMs) / 1000),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${hmacSignature(encoded, secret)}`;
};

// Returns the payload when the signature is valid and the token unexpired,
// otherwise null. Never throws on malformed input.
export const verifyToken = ({
  token,
  secret,
  now = Date.now(),
}: VerifyTokenOptions): TokenPayload | null => {
  // Kept as a runtime guard, not just a type guard: tokens arrive from
  // untrusted request headers and may not be strings at all.
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = Buffer.from(hmacSignature(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(actual, expected)) return null;
  try {
    // Only `exp` is validated here; a payload that parses to anything else
    // (null, a bare number) throws below and is caught as invalid.
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString()
    ) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= now)
      return null;
    return payload;
  } catch (error) {
    return null;
  }
};

export const randomId = (): string => crypto.randomUUID();
