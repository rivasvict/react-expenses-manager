// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
/**
 * Single-file backup & restore (issue #109).
 *
 * The backup is one versioned JSON envelope whose `data` mirrors the four
 * persisted localStorage keys 1:1 (balance, buckets, categories,
 * fixedEntries), so export/import never has to lossily flatten the
 * time-aware bucket/fixed-entry histories the way the old CSV backup did.
 */

const BACKUP_APP_ID = "react-expenses-manager";
const BACKUP_SCHEMA_VERSION = 1;

// Builds the envelope handed to the user for download.
const buildBackupEnvelope = ({ balance, buckets, categories, fixedEntries }) => ({
  app: BACKUP_APP_ID,
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  data: {
    balance: balance || [],
    buckets: buckets || {},
    categories: categories || [],
    fixedEntries: fixedEntries || [],
  },
});

// The English message stays on the error as before; `translationKey` and
// `translationParams` let the UI show the same reason in the user's language
// (see src/i18n/).
const backupError = (message, translationKey, translationParams = {}) =>
  Object.assign(new Error(message), { translationKey, translationParams });

// Parses and validates a backup file's raw text into the `data` object ready
// for `storage.importData`. Throws a descriptive error for anything that is
// not a genuine backup of this app, before anything gets written to storage.
const parseBackupEnvelope = (text) => {
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch (parseError) {
    throw backupError(
      "This file is not a valid backup: it could not be read as JSON",
      "backup.notJson"
    );
  }

  if (!envelope || typeof envelope !== "object") {
    throw backupError("This file is not a valid backup", "backup.invalid");
  }
  if (envelope.app !== BACKUP_APP_ID) {
    throw backupError(
      "This file is not a valid backup for this app",
      "backup.otherApp"
    );
  }
  if (envelope.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw backupError(
      `Unsupported backup version: ${envelope.schemaVersion}`,
      "backup.unsupportedVersion",
      { version: String(envelope.schemaVersion) }
    );
  }

  const data =
    envelope.data && typeof envelope.data === "object" ? envelope.data : {};

  return {
    balance: Array.isArray(data.balance) ? data.balance : [],
    buckets:
      data.buckets && typeof data.buckets === "object" && !Array.isArray(data.buckets)
        ? data.buckets
        : {},
    categories: Array.isArray(data.categories) ? data.categories : [],
    fixedEntries: Array.isArray(data.fixedEntries) ? data.fixedEntries : [],
  };
};

export {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  buildBackupEnvelope,
  parseBackupEnvelope,
};
