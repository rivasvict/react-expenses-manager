// Wire-level constants shared by the core handlers, the router and the
// node:http transport adapter. Kept in one place so a status or an error
// code is never written as a bare literal at a call site (or in a test),
// where a typo silently becomes a different response.

// The HTTP statuses this server actually returns. Deliberately not an
// exhaustive status registry — add an entry when a response starts using it.
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// Machine-readable `error.code` values. RFC §3 is the source of truth; these
// are restated here rather than imported because the server stays
// dependency-free and must not reach into src/.
//
// INTERNAL_ERROR has no RFC entry: it is the transport's catch-all for an
// unexpected throw, and is listed here so the adapter does not hand-roll the
// string either.
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
