// Reading a user's standing in their party: whether they still actively
// belong to one, and the gate that admits or refuses them to the party's
// data. Both answer from the party record, never from the user record
// alone — a partyId is only a pointer, and blocked/canceled live on the
// party (docs/multi-user-sync/DESIGN.md §3.6; EC-9 and AC-2.9–2.11 in
// docs/multi-user-sync/PRD.md). The write path lives next door in
// ./parties.ts.
import {
  Authenticate,
  HasActivePartyMembership,
  PartyRecord,
  RequirePartyAccess,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter, VersionedRecord } from "../storage";
import { error, unauthorized } from "./responses";
import { partyKey } from "./partyKeys";

interface HasActivePartyMembershipOptions {
  storage: StorageAdapter;
}

interface RequirePartyAccessOptions {
  storage: StorageAdapter;
  authenticate: Authenticate;
}

// The party the user's record points at, or null when they point at none or
// at a record that is gone. Both read as "no party" to every caller here.
const readUsersParty = async (
  storage: StorageAdapter,
  user: UserRecord
): Promise<VersionedRecord<PartyRecord> | null> =>
  user.partyId
    ? storage.readJsonVersioned<PartyRecord>(partyKey(user.partyId))
    : null;

const isBlockedIn = (party: PartyRecord, userId: string): boolean =>
  party.members.some((member) => member.id === userId && member.blocked);

const noParty = () =>
  error(
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NO_PARTY,
    "You don't belong to a party."
  );

// Decides whether the user is free to create or join a party. A bare
// `user.partyId` check would say no forever to anyone who was ever a member:
// their record keeps pointing at the old party after they are blocked or it
// is canceled, because the member row stays behind as attribution history
// (AC-2.9) and only the pointer moves on when they join elsewhere.
export const createHasActivePartyMembership =
  ({ storage }: HasActivePartyMembershipOptions): HasActivePartyMembership =>
  async (user: UserRecord): Promise<boolean> => {
    const record = await readUsersParty(storage, user);
    if (!record) return false;
    const party = record.value;
    if (party.canceled) return false;
    return !isBlockedIn(party, user.id);
  };

// Admits the caller to their party's data or refuses them, in this order:
// UNAUTHORIZED, NO_PARTY, BLOCKED, PARTY_CANCELED. Blocked is checked before
// canceled so a member who was blocked and whose party was then canceled
// hears the reason that applies to them personally.
//
// Every backup endpoint runs through this first, so a stale client can never
// download or upload once blocked or canceled (RFC §3 notes,
// docs/multi-user-sync/RFC.md) — and the real backup implementations that
// land in a later PR inherit the enforcement without re-stating it.
export const createRequirePartyAccess =
  ({ storage, authenticate }: RequirePartyAccessOptions): RequirePartyAccess =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return { response: unauthorized() };

    const record = await readUsersParty(storage, user);
    if (!record) return { response: noParty() };

    const party = record.value;
    if (isBlockedIn(party, user.id))
      return {
        response: error(
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.BLOCKED,
          "You've been removed from this party by its organizer."
        ),
      };
    if (party.canceled)
      return {
        response: error(
          HTTP_STATUS.GONE,
          ERROR_CODES.PARTY_CANCELED,
          "This party was canceled."
        ),
      };

    return { access: { user, party, version: record.version } };
  };
