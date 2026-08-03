// POST /api/auth/signup (RFC §3, endpoint 1): validate, reject a taken
// email, persist an scrypt-hashed user record, and return a session.
import { hashPassword, randomId } from "../crypto";
import {
  Handler,
  IssueSession,
  SignupRequestBody,
  UserIdPointer,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { error } from "./responses";
import { userIdKey, userKey } from "./userKeys";
import { isEmail, isNonEmptyString } from "./validation";

interface CreateSignupHandlerOptions {
  storage: StorageAdapter;
  issueSession: IssueSession;
  now: () => number;
}

export const createSignupHandler = ({
  storage,
  issueSession,
  now,
}: CreateSignupHandlerOptions): Handler =>
  async ({ body }) => {
    const { email, password, firstName, lastName } = (body ||
      {}) as SignupRequestBody;
    if (!isEmail(email))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "A valid email is required."
      );
    // TODO: enforce stricter password requirements here — today any
    // non-empty string is accepted, so "a" is a valid account password.
    // scrypt storage does not compensate for a weak secret. Policy is being
    // decided in:
    // https://github.com/rivasvict/react-expenses-manager/issues/159
    // Note this must stay signup-only: login deliberately validates nothing
    // beyond non-emptiness so pre-policy accounts keep working and its
    // failure response stays the single generic 401 (AC-1.5).
    if (!isNonEmptyString(password))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "A password is required."
      );
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "First and last name are required."
      );

    const key = userKey(email);
    if (await storage.readJson<UserRecord>(key))
      return error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.EMAIL_TAKEN,
        "An account with this email already exists."
      );

    const user: UserRecord = {
      id: randomId(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: hashPassword(password),
      partyId: null,
      createdAt: now(),
    };
    await storage.writeJson(key, user);
    await storage.writeJson(userIdKey(user.id), {
      userKey: key,
    } as UserIdPointer);
    return { status: HTTP_STATUS.CREATED, body: issueSession(user) };
  };
