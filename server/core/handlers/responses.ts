// Response shaping shared by every auth handler: the error envelope, the two
// generic auth failures, and the public projection of a user record.
import {
  AppResponse,
  ErrorBody,
  PublicUser,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, ErrorCode, HTTP_STATUS } from "../httpConstants";

export const error = (
  status: number,
  code: ErrorCode,
  message: string
): AppResponse<ErrorBody> => ({
  status,
  body: { error: { code, message } },
});

// AC-1.5: identical body whether the email exists or not.
export const invalidCredentials = (): AppResponse<ErrorBody> =>
  error(
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.INVALID_CREDENTIALS,
    "Email or password is incorrect."
  );

export const unauthorized = (): AppResponse<ErrorBody> =>
  error(
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.UNAUTHORIZED,
    "You need to sign in again."
  );

// Projects a stored user record down to the four fields that may cross the
// wire. This is a whitelist, not a pass-through: UserRecord also carries the
// scrypt `password` record, `partyId` and `createdAt`, and destructuring
// here is what keeps all three out of every signup, login and /api/me
// response (AC-1.2).
//
// Deliberately a whitelist rather than a `delete`/omit of known-secret
// fields: a field added to UserRecord later is excluded by default, so
// leaking it takes a positive edit here instead of a forgotten one.
// responses.test.ts asserts the exact key set, so widening it fails.
export const publicUser = ({
  id,
  email,
  firstName,
  lastName,
}: UserRecord): PublicUser => ({
  id,
  email,
  firstName,
  lastName,
});
