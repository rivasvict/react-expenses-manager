// POST /api/party/members/:userId/block (docs/multi-user-sync/RFC.md §3,
// endpoint 7): the organizer blocks a member (AC-2.9,
// docs/multi-user-sync/PRD.md).
//
// The member's row stays in the party — entries they already contributed are
// never retroactively removed — with `blocked` flipped, which is what
// ./partyAccess.ts reads to refuse them every party-data call from then on
// (EC-9). Nothing outside the party record is touched: not the member's user
// record, not any backup.
import { Authenticate, Handler, MutateParty } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { error, publicParty, unauthorized } from "./responses";
import { isNonEmptyString } from "./validation";

interface BlockMemberHandlerOptions {
  authenticate: Authenticate;
  mutateParty: MutateParty;
}

export const createBlockMemberHandler =
  ({ authenticate, mutateParty }: BlockMemberHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NO_PARTY,
        "You don't belong to a party."
      );

    const targetId = request.params?.userId;
    if (!isNonEmptyString(targetId))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "A member id is required."
      );

    // The organizer check runs inside the compare-and-swap callback, against
    // the party as read for this attempt, for the same reason join's checks
    // do: it must hold at the instant the flag is written.
    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return {
          response: error(
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.NOT_ORGANIZER,
            "Only the organizer can block members."
          ),
        };
      // The organizer is the one person who can never be blocked — there
      // would be nobody left to manage the party (AC-2.12).
      if (targetId === party.organizerId)
        return {
          response: error(
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            "The organizer cannot be blocked."
          ),
        };
      if (!party.members.some((member) => member.id === targetId))
        return {
          response: error(
            HTTP_STATUS.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            "That member isn't in your party."
          ),
        };

      return {
        party: {
          ...party,
          members: party.members.map((member) =>
            member.id === targetId ? { ...member, blocked: true } : member
          ),
        },
      };
    });
    if (!outcome.party) return outcome.response;

    return {
      status: HTTP_STATUS.OK,
      body: { party: publicParty(outcome.party, user.id) },
    };
  };
