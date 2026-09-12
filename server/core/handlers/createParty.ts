// POST /api/party (docs/multi-user-sync/RFC.md §3, endpoint 4): create a
// party; the caller becomes its organizer and its first member (AC-2.1,
// docs/multi-user-sync/PRD.md).
import { randomId } from "../crypto";
import {
  Authenticate,
  Handler,
  HasActivePartyMembership,
  PartyRecord,
  SetUserPartyId,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { error, publicParty, publicUser, unauthorized } from "./responses";
import { partyKey } from "./partyKeys";

interface CreatePartyHandlerOptions {
  storage: StorageAdapter;
  authenticate: Authenticate;
  hasActivePartyMembership: HasActivePartyMembership;
  setUserPartyId: SetUserPartyId;
  now: () => number;
}

export const createCreatePartyHandler = ({
  storage,
  authenticate,
  hasActivePartyMembership,
  setUserPartyId,
  now,
}: CreatePartyHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    // AC-2.2: at most one party per user, so an existing membership is
    // refused rather than silently replaced. "Existing" means active: a
    // member who was blocked, or whose party was canceled, is free to start
    // over here even though their record still points at the old party
    // (docs/multi-user-sync/DESIGN.md §3.6).
    if (await hasActivePartyMembership(user))
      return error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_IN_PARTY,
        "You already belong to a party."
      );

    const party: PartyRecord = {
      id: randomId(),
      name: `${user.firstName}'s Party`,
      organizerId: user.id,
      members: [{ ...publicUser(user), blocked: false }],
      canceled: false,
      invitations: {},
      createdAt: now(),
    };

    // `expectedVersion: null` means create-only, so this cannot clobber an
    // existing record even if a generated id ever repeated.
    const version = await storage.writeJsonVersioned(partyKey(party.id), party, {
      expectedVersion: null,
    });
    if (version === null)
      return error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT,
        "Please try again."
      );

    await setUserPartyId(user, party.id);
    return {
      status: HTTP_STATUS.CREATED,
      body: { party: publicParty(party, user.id) },
    };
  };
