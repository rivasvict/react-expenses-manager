// Shared shapes and error codes for the sync API (RFC §3). The dep-free
// server duplicates the error codes deliberately — RFC §3 is the source of
// truth for both sides.

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
  BLOCKED: "BLOCKED",
  NO_BACKUP: "NO_BACKUP",
  // 409 when the uploaded baseVersion no longer matches the stored backup.
  VERSION_CONFLICT: "VERSION_CONFLICT",
  // 413 from the transport layer when a request body exceeds 1 MB.
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  // 409 when the server exhausts its CAS retry on a concurrent update.
  CONFLICT: "CONFLICT",
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

// The single-file backup envelope shape (buildBackupEnvelope) — the sync
// path reuses it verbatim (RFC §2.3).
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

export interface BackupDownloadResponse {
  version: string;
  envelope: BackupEnvelope;
}

export interface BackupUploadResponse {
  version: string;
}

export interface InvitationResponse {
  // Returned exactly once; never retrievable again (AC-2.4).
  code: string;
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
