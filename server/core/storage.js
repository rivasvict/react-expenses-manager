// Storage interface for the sync server core (RFC §1). Adapters implement:
//
//   readJson(key)         → Promise<object | null>   (null when absent)
//   writeJson(key, value) → Promise<void>
//
// Keys are slash-delimited logical paths, e.g. "users/{sha256(email)}".
// `createMemoryStorage` is the reference implementation, used by the
// contract tests; `server/storage-fs.js` is the on-disk adapter.

const createMemoryStorage = () => {
  const objects = new Map();
  return {
    readJson: async (key) =>
      objects.has(key) ? JSON.parse(objects.get(key)) : null,
    writeJson: async (key, value) => {
      objects.set(key, JSON.stringify(value));
    },
  };
};

module.exports = { createMemoryStorage };
