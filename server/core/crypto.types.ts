// Types for the sync server crypto primitives (server/core/crypto.ts).

// Storable password record: the scrypt cost parameters travel with the hash
// so stored records stay verifiable if SCRYPT_PARAMS is ever tuned upwards.
export interface ScryptPasswordRecord {
  algo: "scrypt";
  N: number;
  r: number;
  p: number;
  saltB64: string;
  hashB64: string;
}

// Claims carried by the compact HMAC token; `iat`/`exp` are Unix seconds.
export interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface SignTokenOptions {
  sub: string;
  secret: string;
  now?: number;
  ttlMs?: number;
}

export interface VerifyTokenOptions {
  token: string;
  secret: string;
  now?: number;
}
