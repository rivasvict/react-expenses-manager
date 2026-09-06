// POST /api/party/join (docs/multi-user-sync/RFC.md §3, endpoint 6): an
// invitee redeems a code plus its password (AC-2.5–2.7, EC-6/7/8 in
// docs/multi-user-sync/PRD.md).
import { verifyPassword } from "../crypto";
import {
  Authenticate,
  Handler,
  InvitationPointer,
  InvitationRecord,
  MutateParty,
  PartyMutation,
  PartyRecord,
  SetUserPartyId,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { codeLookupHash, decryptRecord, encryptRecord } from "../invitations";
import { StorageAdapter } from "../storage";
import { error, publicParty, publicUser, unauthorized } from "./responses";
import { invitationPointerKey, partyKey } from "./partyKeys";
import { isNonEmptyString, requestFields } from "./validation";

interface JoinPartyHandlerOptions {
  storage: StorageAdapter;
  authenticate: Authenticate;
  mutateParty: MutateParty;
  setUserPartyId: SetUserPartyId;
  encryptionKey: Buffer;
}

const invitationNotFound = () =>
  error(
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.INVITATION_NOT_FOUND,
    "That invitation code doesn't exist."
  );

export const createJoinPartyHandler = ({
  storage,
  authenticate,
  mutateParty,
  setUserPartyId,
  encryptionKey,
}: JoinPartyHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();

    const { code, password } = requestFields(request.body);
    if (!isNonEmptyString(code) || !isNonEmptyString(password))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "An invitation code and password are required."
      );

    // EC-6 before anything else: a user who already belongs to a party is
    // turned away without the invitation being touched, so it stays
    // redeemable by whoever it was actually meant for.
    if (user.partyId)
      return error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_IN_PARTY,
        "You already belong to a party."
      );

    const lookupHash = codeLookupHash(code, encryptionKey);
    const pointer = await storage.readJson<InvitationPointer>(
      invitationPointerKey(lookupHash)
    );
    // An unknown code and a code whose party record has gone are the same
    // answer to the invitee: there is nothing here to redeem. Reporting the
    // missing party instead would also tell a stranger that this code was
    // real, which the generic answer does not.
    if (!pointer) return invitationNotFound();
    if (!(await storage.readJsonVersioned<PartyRecord>(partyKey(pointer.partyId))))
      return invitationNotFound();

    // Every check runs inside the compare-and-swap callback, against the
    // party as it was read for *this* attempt — that is what makes "still
    // unused" true at the instant the used flag is written, rather than
    // merely true a moment earlier. Two concurrent redeems of one code
    // therefore lose exactly one race (EC-8).
    //
    // Nothing is written on a rejected check, so a wrong password never
    // consumes the invitation (EC-7).
    const redeem = (party: PartyRecord): PartyMutation => {
      if (party.canceled)
        return {
          response: error(
            HTTP_STATUS.GONE,
            ERROR_CODES.PARTY_CANCELED,
            "This party was canceled."
          ),
        };

      const invitation = decryptRecord<InvitationRecord>(
        party.invitations[lookupHash],
        encryptionKey
      );
      if (!invitation) return { response: invitationNotFound() };

      // AC-2.6: once redeemed, permanently rejected — right password or not.
      // Checked before the password so a used invitation cannot be used as
      // an oracle for guessing what its password was.
      if (invitation.used)
        return {
          response: error(
            HTTP_STATUS.GONE,
            ERROR_CODES.INVITATION_USED,
            "This invitation has already been used."
          ),
        };
      if (!verifyPassword(password, invitation.password))
        return {
          response: error(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.INVITATION_WRONG_PASSWORD,
            "That password doesn't match this invitation."
          ),
        };

      return {
        party: {
          ...party,
          members: [...party.members, { ...publicUser(user), blocked: false }],
          invitations: {
            ...party.invitations,
            [lookupHash]: encryptRecord(
              { ...invitation, used: true },
              encryptionKey
            ),
          },
        },
      };
    };

    const outcome = await mutateParty(pointer.partyId, redeem);
    if (!outcome.party) return outcome.response;

    await setUserPartyId(user, pointer.partyId);
    return {
      status: HTTP_STATUS.OK,
      body: { party: publicParty(outcome.party, user.id) },
    };
  };
