// Types for the endpoint handlers (server/core/handlers.ts): the stored record
// shapes, the wire shapes, and the transport-agnostic request/response
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

// One member as the party record stores them. Names and email are
// denormalized onto the party so rendering the member list is a single read
// rather than one user lookup per member (docs/multi-user-sync/RFC.md §2.1).
export interface PartyMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  blocked: boolean;
}

// The persisted party document. `invitations` maps each code's keyed lookup
// hash to the AES-256-GCM blob holding that invitation's record — see
// ./invitations.ts for why the key is a keyed hash and not a bare digest.
export interface PartyRecord {
  id: string;
  name: string;
  organizerId: string;
  members: PartyMember[];
  canceled: boolean;
  invitations: { [lookupHash: string]: string };
  createdAt: number;
}

// The invitation plaintext, which only ever exists decrypted in memory.
export interface InvitationRecord {
  password: ScryptPasswordRecord;
  used: boolean;
  createdBy: string;
  createdAt: number;
}

// Secondary pointer record: a code's lookup hash → the party holding it, so
// join can find the party from the code alone without scanning. Holds no
// secret of its own — just a hash and a party id.
export interface InvitationPointer {
  partyId: string;
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

// The party as one requester sees it (RFC §3, GET /api/me). Invitations never
// cross the wire, and `youAreBlocked` is computed per requester rather than
// making the client search the member list for itself.
export interface PublicParty {
  id: string;
  name: string;
  organizerId: string;
  canceled: boolean;
  youAreBlocked: boolean;
  members: PartyMember[];
}

export interface MeBody {
  user: PublicUser;
  party: PublicParty | null;
}

export interface PartyBody {
  party: PublicParty;
}

// The one-time invitation code, returned exactly once at generation and never
// retrievable again (AC-2.4) — the server keeps no plaintext copy.
export interface InvitationBody {
  code: string;
}

export type ResponseBody =
  | SessionBody
  | MeBody
  | PartyBody
  | InvitationBody
  | ErrorBody;

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
  createParty: Handler;
  createInvitation: Handler;
  joinParty: Handler;
}

export interface CreateHandlersOptions {
  storage: StorageAdapter;
  tokenSecret: string;
  // Stretched into the AES-256 key that encrypts invitation records and keys
  // their lookup hashes (see ./invitations.ts). Optional so the auth-only
  // callers that predate parties keep working on the dev default.
  encryptionSecret?: string;
  now?: () => number;
}

// --- Collaborators shared between handlers --------------------------------

// Mints a signed token plus the public view of a user record. Injected into
// the handlers that establish a session (signup, login).
export type IssueSession = (user: UserRecord) => SessionBody;

// Resolves a request's bearer token back to the stored user record, or null
// when the header is missing, malformed, expired or points at no record.
export type Authenticate = (request: AppRequest) => Promise<UserRecord | null>;

// What a caller of MutateParty hands back from its callback: either the next
// party record to commit, or a finished error response to abort with, leaving
// the stored record untouched. The two are told apart by which key is set.
export type PartyMutation =
  | { party: PartyRecord; response?: undefined }
  | { party?: undefined; response: AppResponse<ErrorBody> };

// Reads a party, applies `mutate` to it, and writes the result back under a
// compare-and-swap so a concurrent update loses rather than overwrites. The
// callback may run more than once — see ./handlers/parties.ts.
export type MutateParty = (
  partyId: string,
  mutate: (party: PartyRecord) => PartyMutation
) => Promise<PartyMutation>;

// Points a user record at the party it now belongs to.
export type SetUserPartyId = (
  user: UserRecord,
  partyId: string
) => Promise<void>;
