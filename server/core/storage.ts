// Storage interface for the sync server core (RFC §1). Adapters implement:
//
//   readJson(key)         → Promise<object | null>   (null when absent)
//   writeJson(key, value) → Promise<void>
//
// Keys are slash-delimited logical paths, e.g. "users/{sha256(email)}".
// `createMemoryStorage` is the reference implementation, used by the
// contract tests; `server/storage-fs.ts` is the on-disk adapter.

export interface StorageAdapter {
  // The caller names the record shape it expects; adapters only round-trip
  // JSON and cannot validate it, so this is an assertion by the caller.
  readJson<T>(key: string): Promise<T | null>;
  writeJson(key: string, value: unknown): Promise<void>;
}

export const createMemoryStorage = (): StorageAdapter => {
  const objects = new Map<string, string>();
  return {
    readJson: async <T>(key: string): Promise<T | null> => {
      const stored = objects.get(key);
      return stored === undefined ? null : (JSON.parse(stored) as T);
    },
    writeJson: async (key: string, value: unknown): Promise<void> => {
      objects.set(key, JSON.stringify(value));
    },
  };
};
