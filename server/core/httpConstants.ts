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
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// Machine-readable `error.code` values. docs/multi-user-sync/RFC.md §3 is the
// source of truth; these are restated here rather than imported because the
// server stays dependency-free and must not reach into src/.
//
// INTERNAL_ERROR and PAYLOAD_TOO_LARGE are raised by the transport rather
// than a handler (an unexpected throw, and a body over the size cap). They
// are listed here so the adapter does not hand-roll the strings either.
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_IN_PARTY: "ALREADY_IN_PARTY",
  NOT_ORGANIZER: "NOT_ORGANIZER",
  NO_PARTY: "NO_PARTY",
  PARTY_CANCELED: "PARTY_CANCELED",
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_WRONG_PASSWORD: "INVITATION_WRONG_PASSWORD",
  INVITATION_USED: "INVITATION_USED",
  // Raised when a compare-and-swap on the party record loses its retry to a
  // concurrent update; the caller is expected to retry the whole request.
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
