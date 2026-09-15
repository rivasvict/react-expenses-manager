// POST /api/party/invitations (docs/multi-user-sync/RFC.md §3, endpoint 5):
// the organizer mints a one-time code plus an organizer-chosen password
// (AC-2.3, docs/multi-user-sync/PRD.md). The code is returned exactly once;
// at rest it exists only as a keyed lookup hash and an AES-256-GCM encrypted
// record (AC-2.4) — see ../invitations.ts.
import { hashPassword } from "../crypto";
import {
  Authenticate,
  Handler,
  InvitationPointer,
  InvitationRecord,
  MutateParty,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import {
  codeLookupHash,
  encryptRecord,
  generateCode,
} from "../invitations";
import { StorageAdapter } from "../storage";
import { error, unauthorized } from "./responses";
import { invitationPointerKey } from "./partyKeys";
import { isNonEmptyString, requestFields } from "./validation";

interface CreateInvitationHandlerOptions {
  storage: StorageAdapter;
  authenticate: Authenticate;
  mutateParty: MutateParty;
  encryptionKey: Buffer;
  now: () => number;
}

export const createCreateInvitationHandler = ({
  storage,
  authenticate,
  mutateParty,
  encryptionKey,
  now,
}: CreateInvitationHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    if (!user.partyId)
      return error(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NO_PARTY,
        "You don't belong to a party."
      );

    const { password } = requestFields(request.body);
    if (!isNonEmptyString(password))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "An invitation password is required."
      );

    const code = generateCode();
    const lookupHash = codeLookupHash(code, encryptionKey);
    const record: InvitationRecord = {
      password: hashPassword(password),
      used: false,
      createdBy: user.id,
      createdAt: now(),
    };
    const encryptedRecord = encryptRecord(record, encryptionKey);

    const outcome = await mutateParty(user.partyId, (party) => {
      if (party.organizerId !== user.id)
        return {
          response: error(
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.NOT_ORGANIZER,
            "Only the organizer can invite members."
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
      return {
        party: {
          ...party,
          invitations: { ...party.invitations, [lookupHash]: encryptedRecord },
        },
      };
    });
    if (!outcome.party) return outcome.response;

    // Written only after the party commit, so a failed or refused mutation
    // never leaves a pointer to an invitation that does not exist.
    await storage.writeJson(invitationPointerKey(lookupHash), {
      partyId: user.partyId,
    } as InvitationPointer);
    return { status: HTTP_STATUS.CREATED, body: { code } };
  };
