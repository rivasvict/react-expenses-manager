// Guards for the untrusted JSON fields that arrive on request bodies. Each
// one narrows `unknown` to `string`, so a handler that passes the guard can
// use the value without further casting.

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export const isEmail = (value: unknown): value is string =>
  isNonEmptyString(value) && /^\S+@\S+\.\S+$/.test(value);
