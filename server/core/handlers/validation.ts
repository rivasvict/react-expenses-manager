// Guards for the untrusted JSON bodies and fields that arrive on requests.
// Each one narrows `unknown`, so a handler that passes the guard can use the
// value without further casting.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Makes a parsed JSON body destructurable without asserting anything about
// its fields. A body that is absent, null, or not an object at all becomes an
// empty record, so every field reads as `undefined` and falls through to the
// guards below — which are what actually narrow each one to `string`.
export const requestFields = (body: unknown): Record<string, unknown> =>
  isRecord(body) ? body : {};

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export const isEmail = (value: unknown): value is string =>
  isNonEmptyString(value) && /^\S+@\S+\.\S+$/.test(value);
