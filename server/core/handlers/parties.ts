// Writing party state: the compare-and-swap update path every party handler
// goes through, and the user→party backlink that follows a successful one.
// (docs/multi-user-sync/RFC.md §2.1.)
import {
  MutateParty,
  PartyMutation,
  PartyRecord,
  SetUserPartyId,
  UserRecord,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { error } from "./responses";
import { partyKey } from "./partyKeys";
import { userKey } from "./userKeys";

// One retry, per RFC §2.1: at family scale a collision is already unlikely,
// and a second one on the same request means something is genuinely
// contended rather than merely unlucky. Retrying forever would turn that into
// a hang instead of an answer the client can act on.
const MAX_ATTEMPTS = 2;

interface PartyStoreOptions {
  storage: StorageAdapter;
}

// Read-modify-write on a party under compare-and-swap.
//
// `mutate(party)` decides, from the record as it was *just* read, whether to
// commit ({ party }) or to abort with a finished response ({ response }). The
// write only lands if the record has not changed since that read; otherwise
// the whole cycle runs again against the new state.
//
// The re-read is the point, not an optimization: it is what makes `mutate`'s
// checks — is this invitation still unused, is this party still active —
// hold at the moment of the write rather than merely at the moment they were
// evaluated. So `mutate` must be a pure function of the party it is handed
// and safe to run more than once; it must not carry a decision over from a
// previous attempt, or perform effects of its own.
export const createMutateParty = ({
  storage,
}: PartyStoreOptions): MutateParty =>
  async (
    partyId: string,
    mutate: (party: PartyRecord) => PartyMutation
  ): Promise<PartyMutation> => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const record = await storage.readJsonVersioned<PartyRecord>(
        partyKey(partyId)
      );
      if (!record)
        return {
          response: error(
            HTTP_STATUS.NOT_FOUND,
            ERROR_CODES.NO_PARTY,
            "No party found."
          ),
        };

      const outcome = mutate(record.value);
      if (!outcome.party) return outcome;

      const version = await storage.writeJsonVersioned(
        partyKey(partyId),
        outcome.party,
        { expectedVersion: record.version }
      );
      // A null version means someone else wrote between our read and our
      // write. Nothing was persisted, so looping is safe.
      if (version !== null) return { party: outcome.party };
    }

    return {
      response: error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT,
        "The party changed concurrently. Please try again."
      ),
    };
  };

// Points a user record at the party it now belongs to.
//
// Deliberately NOT under the same compare-and-swap as the party record above.
// The CAS guarantees an invitation is consumed exactly once even under a
// race; this backlink is a plain check-then-write, so a single user firing
// two requests at once could in principle end up referenced by two parties.
// Accepted at family scale (RFC §2.1) rather than fixed: the invariant that
// actually matters — one redemption per invitation — is the one protected.
export const createSetUserPartyId = ({
  storage,
}: PartyStoreOptions): SetUserPartyId =>
  async (user: UserRecord, partyId: string): Promise<void> => {
    await storage.writeJson(userKey(user.email), { ...user, partyId });
  };
