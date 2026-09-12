// PUT /api/party/backup (docs/multi-user-sync/RFC.md §3, endpoint 10) — a
// deliberate placeholder, the counterpart of ./getBackup.ts. The route
// exists now so the blocked/canceled enforcement is already in force on it:
// the caller goes through requirePartyAccess first.
//
// An admitted member gets 501 NOT_IMPLEMENTED, a code that is scaffolding
// rather than part of the RFC contract — see ERROR_CODES. The real upload
// (compare-and-swap on the backup version, envelope validation) lands with
// the sync engine in a later PR and replaces only the line after the gate.
import { Handler, RequirePartyAccess } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { error } from "./responses";

interface PutBackupHandlerOptions {
  requirePartyAccess: RequirePartyAccess;
}

export const createPutBackupHandler =
  ({ requirePartyAccess }: PutBackupHandlerOptions): Handler =>
  async (request) => {
    const admitted = await requirePartyAccess(request);
    if (!admitted.access) return admitted.response;

    return error(
      HTTP_STATUS.NOT_IMPLEMENTED,
      ERROR_CODES.NOT_IMPLEMENTED,
      "Backup upload arrives with sync."
    );
  };
