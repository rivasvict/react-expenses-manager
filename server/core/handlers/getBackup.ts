// GET /api/party/backup (docs/multi-user-sync/RFC.md §3, endpoint 9) — a
// deliberate placeholder. The route exists now so the blocked/canceled
// enforcement is already in force on it: the caller goes through
// requirePartyAccess first, and only an admitted member reaches the answer.
//
// That answer is always 404 NO_BACKUP, which is also the truth: nothing can
// upload a backup yet, so none exists (EC-1, docs/multi-user-sync/PRD.md).
// The real download lands with the sync engine in a later PR and replaces
// only the line after the gate.
import { Handler, RequirePartyAccess } from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { error } from "./responses";

interface GetBackupHandlerOptions {
  requirePartyAccess: RequirePartyAccess;
}

export const createGetBackupHandler =
  ({ requirePartyAccess }: GetBackupHandlerOptions): Handler =>
  async (request) => {
    const admitted = await requirePartyAccess(request);
    if (!admitted.access) return admitted.response;

    return error(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NO_BACKUP,
      "No backup has been uploaded yet."
    );
  };
