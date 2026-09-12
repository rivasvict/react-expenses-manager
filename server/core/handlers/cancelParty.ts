// POST /api/party/cancel (docs/multi-user-sync/RFC.md §3, endpoint 8): the
// organizer cancels the party (AC-2.10, docs/multi-user-sync/PRD.md).
//
// Cancelling only flips the flag. Every member keeps their row and their
// local data; what changes is that ./partyAccess.ts now refuses all of them
// with PARTY_CANCELED, and that each of them is free to create or join
// another party (docs/multi-user-sync/DESIGN.md §3.6).
import { Authenticate, Handler, MutateParty } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { error, publicParty, unauthorized } from "./responses";

interface CancelPartyHandlerOptions {
  authenticate: Authenticate;
  mutateParty: MutateParty;
}

export const createCancelPartyHandler =
  ({ authenticate, mutateParty }: CancelPartyHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NO_PARTY,
        "You don't belong to a party."
      );

    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return {
          response: error(
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.NOT_ORGANIZER,
            "Only the organizer can cancel the party."
          ),
        };
      return { party: { ...party, canceled: true } };
    });
    if (!outcome.party) return outcome.response;

    return {
      status: HTTP_STATUS.OK,
      body: { party: publicParty(outcome.party, user.id) },
    };
  };
