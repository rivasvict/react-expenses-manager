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
