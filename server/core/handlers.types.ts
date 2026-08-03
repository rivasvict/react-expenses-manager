// Types for the auth endpoint handlers (server/core/handlers.ts): the stored
// record shapes, the wire shapes, and the transport-agnostic request/response
// contract the router and the node:http adapter both speak.
import { ScryptPasswordRecord } from "./crypto.types";
import { StorageAdapter } from "./storage";
import { ErrorCode } from "./httpConstants";

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

// --- Collaborators shared between handlers --------------------------------

// Mints a signed token plus the public view of a user record. Injected into
// the handlers that establish a session (signup, login).
export type IssueSession = (user: UserRecord) => SessionBody;

// Resolves a request's bearer token back to the stored user record, or null
// when the header is missing, malformed, expired or points at no record.
export type Authenticate = (request: AppRequest) => Promise<UserRecord | null>;

// --- Untrusted request bodies ---------------------------------------------

// Request bodies arrive as untyped JSON; every field is checked before use.
export interface SignupRequestBody {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
}

export interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}
