// Auth endpoint handlers (RFC §3, endpoints 1–3). Framework-free: each
// handler takes a plain request description and returns { status, body }.
// The shapes these handlers speak live in ./handlers.types.
import {
  sha256Hex,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomId,
} from "./crypto";
import { ERROR_CODES, ErrorCode, HTTP_STATUS } from "./httpConstants";
import {
  AppRequest,
  AppResponse,
  CreateHandlersOptions,
  ErrorBody,
  Handler,
  Handlers,
  LoginRequestBody,
  PublicUser,
  SessionBody,
  SignupRequestBody,
  UserIdPointer,
  UserRecord,
} from "./handlers.types";

// Re-exported so importers of `./handlers` need not know which sibling
// module a name is declared in: constants live in ./httpConstants, types in
// ./handlers.types.
export { ERROR_CODES };
export type { ErrorCode };
export type {
  AppRequest,
  AppResponse,
  CreateHandlersOptions,
  ErrorBody,
  Handler,
  Handlers,
  MeBody,
  PublicUser,
  RequestHeaders,
  ResponseBody,
  SessionBody,
  UserIdPointer,
  UserRecord,
} from "./handlers.types";

// --- Helpers --------------------------------------------------------------

const error = (
  status: number,
  code: ErrorCode,
  message: string
): AppResponse<ErrorBody> => ({
  status,
  body: { error: { code, message } },
});

// AC-1.5: identical body whether the email exists or not.
const invalidCredentials = (): AppResponse<ErrorBody> =>
  error(
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.INVALID_CREDENTIALS,
    "Email or password is incorrect."
  );

const unauthorized = (): AppResponse<ErrorBody> =>
  error(
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.UNAUTHORIZED,
    "You need to sign in again."
  );

const publicUser = ({ id, email, firstName, lastName }: UserRecord): PublicUser => ({
  id,
  email,
  firstName,
  lastName,
});

const userKey = (email: string): string =>
  `users/${sha256Hex(email.trim().toLowerCase())}`;
// Secondary pointer so /api/me can resolve the token's `sub` (user id) back
// to the email-keyed user record without scanning.
const userIdKey = (id: string): string => `user-ids/${id}`;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const isEmail = (value: unknown): value is string =>
  isNonEmptyString(value) && /^\S+@\S+\.\S+$/.test(value);

// --- Handlers -------------------------------------------------------------

export const createHandlers = ({
  storage,
  tokenSecret,
  now = Date.now,
}: CreateHandlersOptions): Handlers => {
  const issueSession = (user: UserRecord): SessionBody => ({
    token: signToken({ sub: user.id, secret: tokenSecret, now: now() }),
    user: publicUser(user),
  });

  const signup: Handler = async ({ body }) => {
    const { email, password, firstName, lastName } = (body ||
      {}) as SignupRequestBody;
    if (!isEmail(email))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "A valid email is required."
      );
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
    await storage.writeJson(userIdKey(user.id), { userKey: key } as UserIdPointer);
    return { status: HTTP_STATUS.CREATED, body: issueSession(user) };
  };

  // Hashed once per handler set; only used to equalize login timing below.
  const dummyPasswordRecord = hashPassword("dummy-timing-equalizer");

  const login: Handler = async ({ body }) => {
    const { email, password } = (body || {}) as LoginRequestBody;
    if (!isNonEmptyString(email) || !isNonEmptyString(password))
      return invalidCredentials();
    const user = await storage.readJson<UserRecord>(userKey(email));
    if (!user) {
      // AC-1.5 also covers timing: without this, an unknown email would
      // return before any scrypt work and reveal account existence. Burn
      // the same hashing cost against a dummy record, then fail generically.
      verifyPassword(password, dummyPasswordRecord);
      return invalidCredentials();
    }
    if (!verifyPassword(password, user.password)) return invalidCredentials();
    return { status: HTTP_STATUS.OK, body: issueSession(user) };
  };

  // Resolves the bearer token to the stored user, or null.
  const authenticate = async ({
    headers,
  }: AppRequest): Promise<UserRecord | null> => {
    const header = (headers && headers.authorization) || "";
    const match = /^Bearer (.+)$/.exec(header);
    if (!match) return null;
    const payload = verifyToken({
      token: match[1],
      secret: tokenSecret,
      now: now(),
    });
    if (!payload) return null;
    const pointer = await storage.readJson<UserIdPointer>(userIdKey(payload.sub));
    if (!pointer) return null;
    return storage.readJson<UserRecord>(pointer.userKey);
  };

  const me: Handler = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    return {
      status: HTTP_STATUS.OK,
      body: { user: publicUser(user), party: null },
    };
  };

  return { signup, login, me };
};
