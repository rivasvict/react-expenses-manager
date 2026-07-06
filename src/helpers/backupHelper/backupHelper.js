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

// Parses and validates a backup file's raw text into the `data` object ready
// for `storage.importData`. Throws a descriptive error for anything that is
// not a genuine backup of this app, before anything gets written to storage.
const parseBackupEnvelope = (text) => {
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch (parseError) {
    throw new Error(
      "This file is not a valid backup: it could not be read as JSON"
    );
  }

  if (!envelope || typeof envelope !== "object") {
    throw new Error("This file is not a valid backup");
  }
  if (envelope.app !== BACKUP_APP_ID) {
    throw new Error("This file is not a valid backup for this app");
  }
  if (envelope.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup version: ${envelope.schemaVersion}`);
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
