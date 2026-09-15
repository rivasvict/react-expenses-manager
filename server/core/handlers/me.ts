// GET /api/me (docs/multi-user-sync/RFC.md §3, endpoint 3): the current user
// behind a bearer token, plus the party they belong to.
import { Authenticate, Handler, PartyRecord } from "../handlers.types";
import { HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { publicParty, publicUser, unauthorized } from "./responses";
import { partyKey } from "./partyKeys";

interface CreateMeHandlerOptions {
  storage: StorageAdapter;
  authenticate: Authenticate;
}

export const createMeHandler =
  ({ storage, authenticate }: CreateMeHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();

    // This endpoint is what re-surfaces membership, blocked and canceled
    // state to a client, which is why the party is read fresh here rather
    // than trusted from anything the client cached (RFC §2.2). A partyId
    // pointing at a record that is gone reads as no party rather than an
    // error — there is nothing for the user to act on either way.
    const record = user.partyId
      ? await storage.readJsonVersioned<PartyRecord>(partyKey(user.partyId))
      : null;

    return {
      status: HTTP_STATUS.OK,
      body: {
        user: publicUser(user),
        party: record ? publicParty(record.value, user.id) : null,
      },
    };
  };
