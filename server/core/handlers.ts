// Auth endpoint handlers (RFC §3, endpoints 1–3). Framework-free: each
// handler takes a plain request description and returns { status, body }.
import {
  sha256Hex,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomId,
  ScryptPasswordRecord,
} from "./crypto";
import { StorageAdapter } from "./storage";

// Error codes duplicated from src/services/syncApi/contract.ts deliberately —
// the server stays dependency-free; RFC §3 is the source of truth.
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// --- Stored records -------------------------------------------------------

// The persisted user document, keyed by sha256 of the normalized email.
export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: ScryptPasswordRecord;
  partyId: string | null;
  createdAt: number;
}

// Secondary pointer record: user id → the email-keyed user record's key.
export interface UserIdPointer {
  userKey: string;
}

// --- Wire shapes ----------------------------------------------------------

// The subset of the user record that is safe to return over the wire.
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ErrorBody {
  error: { code: ErrorCode; message: string };
}

export interface SessionBody {
  token: string;
  user: PublicUser;
}

// Parties land in PR 2; until then the contract returns party: null.
export interface MeBody {
  user: PublicUser;
  party: null;
}

export type ResponseBody = SessionBody | MeBody | ErrorBody;

// Mirrors node:http's IncomingHttpHeaders so the http adapter can pass its
// headers straight through, while keeping `authorization` a plain string.
export interface RequestHeaders {
  authorization?: string;
  [name: string]: string | string[] | undefined;
}

export interface AppRequest {
  method: string;
  path: string;
  headers?: RequestHeaders;
  // Parsed JSON from the transport: untrusted and unvalidated until a
  // handler narrows it.
  body?: unknown;
}

export interface AppResponse<TBody = ResponseBody> {
  status: number;
  body: TBody;
}

export type Handler = (request: AppRequest) => Promise<AppResponse>;

export interface Handlers {
  signup: Handler;
  login: Handler;
  me: Handler;
}

export interface CreateHandlersOptions {
  storage: StorageAdapter;
  tokenSecret: string;
  now?: () => number;
}

// Request bodies arrive as untyped JSON; every field is checked before use.
interface SignupRequestBody {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
}

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

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
  error(401, ERROR_CODES.INVALID_CREDENTIALS, "Email or password is incorrect.");

const unauthorized = (): AppResponse<ErrorBody> =>
  error(401, ERROR_CODES.UNAUTHORIZED, "You need to sign in again.");

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
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A valid email is required.");
    if (!isNonEmptyString(password))
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A password is required.");
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName))
      return error(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "First and last name are required."
      );

    const key = userKey(email);
    if (await storage.readJson<UserRecord>(key))
      return error(
        409,
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
    return { status: 201, body: issueSession(user) };
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
    return { status: 200, body: issueSession(user) };
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
    return { status: 200, body: { user: publicUser(user), party: null } };
  };

  return { signup, login, me };
};
