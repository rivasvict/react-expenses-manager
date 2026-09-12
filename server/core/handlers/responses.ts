// Response shaping shared by every handler: the error envelope, the two
// generic auth failures, and the public projections of a user and a party
// record.
import {
  AppResponse,
  ErrorBody,
  PartyRecord,
  PublicParty,
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

// AC-1.5 (docs/multi-user-sync/PRD.md): identical body whether the email
// exists or not.
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

// Projects a stored party down to what `requesterId` may see (RFC §3,
// docs/multi-user-sync/RFC.md). A whitelist for the same reason publicUser is
// one, and here it is load-bearing: PartyRecord carries `invitations`, whose
// values are the encrypted invitation blobs. Spreading the record instead of
// naming fields would ship every invitation on the party to every member on
// every /api/me call.
//
// `youAreBlocked` is resolved here rather than left to the client, so a
// member's own blocked state arrives as an answer instead of something the
// UI has to go looking for in the member list.
export const publicParty = (
  party: PartyRecord,
  requesterId: string
): PublicParty => ({
  id: party.id,
  name: party.name,
  organizerId: party.organizerId,
  canceled: party.canceled,
  youAreBlocked: party.members.some(
    (member) => member.id === requesterId && member.blocked
  ),
  members: party.members.map(({ id, firstName, lastName, email, blocked }) => ({
    id,
    firstName,
    lastName,
    email,
    blocked,
  })),
});
