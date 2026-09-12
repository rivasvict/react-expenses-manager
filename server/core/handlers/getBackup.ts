// GET /api/party/backup (docs/multi-user-sync/RFC.md §3, endpoint 9): hands
// an admitted member the party's current backup together with its version,
// which is what they send back as `baseVersion` when they upload (EC-2,
// docs/multi-user-sync/PRD.md).
//
// The caller goes through requirePartyAccess first, so a blocked member or
// a member of a canceled party never reaches the read (EC-9/AC-2.10). The
// party id comes from the gate's freshly read party record, not from the
// user record, so the read is always against the party they were admitted to.
import {
  BackupRecord,
  Handler,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { backupKey } from "./partyKeys";
import { error } from "./responses";

interface GetBackupHandlerOptions {
  storage: StorageAdapter;
  requirePartyAccess: RequirePartyAccess;
}

export const createGetBackupHandler =
  ({ storage, requirePartyAccess }: GetBackupHandlerOptions): Handler =>
  async (request) => {
    const admitted = await requirePartyAccess(request);
    if (!admitted.access) return admitted.response;

    const stored = await storage.readJsonVersioned<BackupRecord>(
      backupKey(admitted.access.party.id)
    );
    // EC-1: no backup yet is a normal answer, not a failure — the client
    // responds by uploading its local snapshot as the party's starting point.
    if (!stored)
      return error(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NO_BACKUP,
        "No backup has been uploaded yet."
      );

    // Only the envelope crosses the wire; uploadedBy/uploadedAt stay
    // server-side bookkeeping.
    return {
      status: HTTP_STATUS.OK,
      body: { version: stored.version, envelope: stored.value.envelope },
    };
  };
