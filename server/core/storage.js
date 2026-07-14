// Storage interface for the sync server core (RFC §1/§2.1). Adapters
// implement:
//
//   readJson(key)         → Promise<object | null>   (null when absent)
//   writeJson(key, value) → Promise<void>
//
//   readJsonVersioned(key)
//     → Promise<{ value, version } | null>
//       `version` is an opaque string (S3 ETag in prod, a monotonically
//       increasing integer serialized as a string locally).
//   writeJsonVersioned(key, value, { expectedVersion })
//     → Promise<string | null>
//       Compare-and-swap: `expectedVersion: null` means "create only".
//       Returns the new version, or null when the expectation failed
//       (concurrent update / already exists).
//
// Keys are slash-delimited logical paths, e.g. "users/{sha256(email)}".
// Versioned keys (parties) and plain keys (users, pointers) are disjoint
// namespaces — a key is always accessed through the same pair of methods.
// `createMemoryStorage` is the reference implementation, used by the
// contract tests; `server/storage-fs.js` is the on-disk adapter.

const createMemoryStorage = () => {
  const objects = new Map();
  const versioned = new Map();

  return {
    readJson: async (key) =>
      objects.has(key) ? JSON.parse(objects.get(key)) : null,
    writeJson: async (key, value) => {
      objects.set(key, JSON.stringify(value));
    },
    readJsonVersioned: async (key) => {
      const record = versioned.get(key);
      if (!record) return null;
      return { value: JSON.parse(record.json), version: record.version };
    },
    writeJsonVersioned: async (key, value, { expectedVersion }) => {
      const record = versioned.get(key);
      const currentVersion = record ? record.version : null;
      if (currentVersion !== expectedVersion) return null;
      const newVersion = String(Number(currentVersion || "0") + 1);
      versioned.set(key, { json: JSON.stringify(value), version: newVersion });
      return newVersion;
    },
  };
};

module.exports = { createMemoryStorage };
