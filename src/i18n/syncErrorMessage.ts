import type { SyncErrorCode } from "../services/syncApi/contract";
import { DEFAULT_LANGUAGE } from "./languages";
import { TranslationKey } from "./translations/en";
import { Translator } from "./translator";

const SYNC_ERROR_KEYS: Record<SyncErrorCode, TranslationKey> = {
  VALIDATION_ERROR: "syncError.VALIDATION_ERROR",
  EMAIL_TAKEN: "syncError.EMAIL_TAKEN",
  INVALID_CREDENTIALS: "syncError.INVALID_CREDENTIALS",
  UNAUTHORIZED: "syncError.UNAUTHORIZED",
  ALREADY_IN_PARTY: "syncError.ALREADY_IN_PARTY",
  NOT_ORGANIZER: "syncError.NOT_ORGANIZER",
  NO_PARTY: "syncError.NO_PARTY",
  PARTY_CANCELED: "syncError.PARTY_CANCELED",
  INVITATION_NOT_FOUND: "syncError.INVITATION_NOT_FOUND",
  INVITATION_WRONG_PASSWORD: "syncError.INVITATION_WRONG_PASSWORD",
  INVITATION_USED: "syncError.INVITATION_USED",
  BLOCKED: "syncError.BLOCKED",
  NO_BACKUP: "syncError.NO_BACKUP",
  VERSION_CONFLICT: "syncError.VERSION_CONFLICT",
  CONFLICT: "syncError.CONFLICT",
  PAYLOAD_TOO_LARGE: "syncError.PAYLOAD_TOO_LARGE",
  NETWORK_ERROR: "syncError.NETWORK_ERROR",
  UNSUPPORTED_SCHEMA_VERSION: "syncError.UNSUPPORTED_SCHEMA_VERSION",
};

/**
 * The text to show for a failed sync-server call. The server (and the sync
 * client) word their errors in English, which is kept as is when the UI is in
 * English — it is often more specific than a per-code message. In any other
 * language the error's code picks a translated message instead, so the user
 * never gets an English sentence in the middle of a translated screen.
 */
export const getSyncErrorMessage = (
  error: { code?: string; message?: string } | null | undefined,
  { t, language }: Translator,
  fallbackKey: TranslationKey
): string => {
  const key = error?.code && SYNC_ERROR_KEYS[error.code as SyncErrorCode];
  if (language === DEFAULT_LANGUAGE || !key) {
    return error?.message || t(fallbackKey);
  }
  return t(key);
};
