// PUT /api/party/backup (docs/multi-user-sync/RFC.md §3, endpoint 10): an
// admitted member replaces the party's backup under a compare-and-swap on
// its version. `baseVersion: null` means "create only" — the first sync
// (EC-1, docs/multi-user-sync/PRD.md); otherwise it must equal the version
// the client downloaded, or the write is refused with VERSION_CONFLICT
// (EC-2) and the client starts over from a fresh download.
//
// The envelope is an opaque blob apart from a shape check (RFC §3 notes):
// all merge intelligence lives in the client. The RFC's "oversized envelope"
// clause is enforced one layer down — the transport caps every request body
// at 1 MB (server/index.ts, MAX_BODY_BYTES) and answers 413
// PAYLOAD_TOO_LARGE before any handler runs. An envelope can never be larger
// than the body carrying it, so a second size check here would be
// unreachable code; the RFC row for this endpoint documents the 413.
import {
  BackupEnvelope,
  BackupRecord,
  Handler,
  RequirePartyAccess,
} from "../handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "../httpConstants";
import { StorageAdapter } from "../storage";
import { backupKey } from "./partyKeys";
import { error } from "./responses";
import { isRecord, requestFields } from "./validation";

// Must match BACKUP_APP_ID in src/helpers/backupHelper/backupHelper.js — the
// same envelope the single-file backup feature writes (RFC §2.3). Restated
// rather than imported because the server must not reach into src/.
export const BACKUP_APP_ID = "react-expenses-manager";

interface PutBackupHandlerOptions {
  storage: StorageAdapter;
  requirePartyAccess: RequirePartyAccess;
  now: () => number;
}

// The client sends `null` for a first sync and the downloaded version string
// otherwise. Anything else (a missing field, a number) is a client bug and
// must not be read as "create only" — that would turn a malformed request
// into a version race.
const isBaseVersion = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isBackupEnvelope = (value: unknown): value is BackupEnvelope =>
  isRecord(value) && value.app === BACKUP_APP_ID && isRecord(value.data);

export const createPutBackupHandler =
  ({ storage, requirePartyAccess, now }: PutBackupHandlerOptions): Handler =>
  async (request) => {
    const admitted = await requirePartyAccess(request);
    if (!admitted.access) return admitted.response;

    const { baseVersion, envelope } = requestFields(request.body);
    if (!isBaseVersion(baseVersion))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "baseVersion must be a version string or null."
      );
    if (!isBackupEnvelope(envelope))
      return error(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "A valid backup envelope is required."
      );

    const record: BackupRecord = {
      uploadedBy: admitted.access.user.id,
      uploadedAt: now(),
      envelope,
    };
    const version = await storage.writeJsonVersioned(
      backupKey(admitted.access.party.id),
      record,
      { expectedVersion: baseVersion }
    );
    // A null version is the CAS refusing: someone else uploaded since this
    // client downloaded (or, for a create-only upload, a backup already
    // exists). Nothing was written.
    if (version === null)
      return error(
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VERSION_CONFLICT,
        "The party backup changed since your download."
      );

    return { status: HTTP_STATUS.OK, body: { version } };
  };
