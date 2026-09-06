// Storage interface for the sync server core (docs/multi-user-sync/RFC.md
// §1/§2.1). Adapters implement two pairs of operations:
//
//   readJson(key)         → Promise<T | null>   (null when absent)
//   writeJson(key, value) → Promise<void>
//
//   readJsonVersioned(key)
//     → Promise<VersionedRecord<T> | null>
//       `version` is an opaque string — the S3 ETag in production, a
//       monotonically increasing integer serialized as a string locally.
//   writeJsonVersioned(key, value, { expectedVersion })
//     → Promise<string | null>
//       Compare-and-swap: `expectedVersion: null` means "create only".
//       Returns the new version, or null when the expectation failed
//       (a concurrent update, or the key already exists).
//
// Keys are slash-delimited logical paths, e.g. "users/{sha256(email)}".
// Versioned keys (parties) and plain keys (users, pointers) are disjoint
// namespaces — a key is always reached through the same pair of methods, so
// an adapter never has to reconcile a plain write with a versioned one.
//
// `createMemoryStorage` is the reference implementation, used by the contract
// tests; `server/storage-fs.ts` is the on-disk adapter.

// A value together with the version to hand back to the next CAS write.
export interface VersionedRecord<T> {
  value: T;
  version: string;
}

export interface StorageAdapter {
  // The caller names the record shape it expects; adapters only round-trip
  // JSON and cannot validate it, so this is an assertion by the caller.
  readJson<T>(key: string): Promise<T | null>;
  writeJson(key: string, value: unknown): Promise<void>;
  readJsonVersioned<T>(key: string): Promise<VersionedRecord<T> | null>;
  writeJsonVersioned(
    key: string,
    value: unknown,
    options: { expectedVersion: string | null }
  ): Promise<string | null>;
}

// Versions count up from "1" for a key's first write, so the value read back
// with a record is always the one a later CAS compares against.
export const nextVersion = (currentVersion: string | null): string =>
  String(Number(currentVersion || "0") + 1);

export const createMemoryStorage = (): StorageAdapter => {
  const objects = new Map<string, string>();
  const versioned = new Map<string, { json: string; version: string }>();

  return {
    readJson: async <T>(key: string): Promise<T | null> => {
      const stored = objects.get(key);
      return stored === undefined ? null : (JSON.parse(stored) as T);
    },
    writeJson: async (key: string, value: unknown): Promise<void> => {
      objects.set(key, JSON.stringify(value));
    },
    readJsonVersioned: async <T>(
      key: string
    ): Promise<VersionedRecord<T> | null> => {
      const record = versioned.get(key);
      if (record === undefined) return null;
      return { value: JSON.parse(record.json) as T, version: record.version };
    },
    // No await between the read and the write here, so this is atomic by
    // virtue of the single-threaded event loop. The fs adapter has real
    // await points and has to serialize explicitly — see storage-fs.ts.
    writeJsonVersioned: async (
      key: string,
      value: unknown,
      { expectedVersion }: { expectedVersion: string | null }
    ): Promise<string | null> => {
      const record = versioned.get(key);
      const currentVersion = record ? record.version : null;
      if (currentVersion !== expectedVersion) return null;
      const version = nextVersion(currentVersion);
      versioned.set(key, { json: JSON.stringify(value), version });
      return version;
    },
  };
};
