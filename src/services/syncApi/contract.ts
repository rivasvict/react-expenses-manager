// Shared shapes and error codes for the sync API (docs/multi-user-sync/RFC.md
// §3). The dep-free server duplicates the error codes deliberately — RFC §3 is
// the source of truth for both sides.

export const SYNC_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  ALREADY_IN_PARTY: "ALREADY_IN_PARTY",
  NOT_ORGANIZER: "NOT_ORGANIZER",
  NO_PARTY: "NO_PARTY",
  PARTY_CANCELED: "PARTY_CANCELED",
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_WRONG_PASSWORD: "INVITATION_WRONG_PASSWORD",
  INVITATION_USED: "INVITATION_USED",
  // 403 on every party-data call once the organizer has blocked the caller
  // (EC-9, docs/multi-user-sync/PRD.md).
  BLOCKED: "BLOCKED",
  // 404 from GET /api/party/backup while no backup exists yet (EC-1).
  NO_BACKUP: "NO_BACKUP",
  // 409 from PUT /api/party/backup when the uploaded baseVersion no longer
  // matches the stored backup (EC-2) — the client must download again.
  VERSION_CONFLICT: "VERSION_CONFLICT",
  // 409 when the server exhausts its CAS retry on a concurrent update.
  CONFLICT: "CONFLICT",
  // 413 from the transport layer when a request body exceeds 1 MB (RFC §3,
  // endpoint 10).
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  // Used by the client for transport-level failures (server unreachable).
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type SyncErrorCode =
  (typeof SYNC_ERROR_CODES)[keyof typeof SYNC_ERROR_CODES];

export interface SyncUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: SyncUser;
}

export interface PartyMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  blocked: boolean;
}

// Party as the server presents it to the requesting member (RFC §3 /api/me).
export interface Party {
  id: string;
  name: string;
  organizerId: string;
  canceled: boolean;
  youAreBlocked: boolean;
  members: PartyMember[];
}

export interface MeResponse {
  user: SyncUser;
  party: Party | null;
}

export interface PartyResponse {
  party: Party;
}

export interface InvitationResponse {
  // Returned exactly once; never retrievable again (AC-2.4,
  // docs/multi-user-sync/PRD.md).
  code: string;
}

// The single-file backup's data slices (buildBackupEnvelope in
// src/helpers/backupHelper/backupHelper.js) — the sync path reuses the
// exact same shape (RFC §2.3), so entries, buckets, categories and fixed
// entries stay whatever the backup feature already writes.
export interface BackupData {
  balance: any[];
  buckets: { [name: string]: any };
  categories: string[];
  fixedEntries: any[];
}

export interface BackupEnvelope {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

// RFC §3 endpoint 9: the stored envelope plus the version to send back as
// `baseVersion` on the next upload.
export interface BackupDownloadResponse {
  version: string;
  envelope: BackupEnvelope;
}

// RFC §3 endpoint 10: the version just written.
export interface BackupUploadResponse {
  version: string;
}

export interface SyncApiError extends Error {
  code: SyncErrorCode;
  status: number | null;
}

// Factory instead of `class extends Error` — the ES5 build target breaks
// `instanceof` for subclassed errors; callers switch on `error.code`.
export const createSyncApiError = ({
  code,
  message,
  status = null,
}: {
  code: SyncErrorCode;
  message: string;
  status?: number | null;
}): SyncApiError => {
  const error = new Error(message) as SyncApiError;
  error.name = "SyncApiError";
  error.code = code;
  error.status = status;
  return error;
};

export const isSyncApiError = (error: unknown): error is SyncApiError =>
  error instanceof Error && (error as SyncApiError).code !== undefined;
