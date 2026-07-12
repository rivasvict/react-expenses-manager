// On-disk storage adapter for local development (RFC §6): JSON files under
// server/.data/ (gitignored). Implements the interface documented in
// server/core/storage.js.
const fs = require("node:fs/promises");
const path = require("node:path");

const createFsStorage = ({ dir }) => {
  const filePath = (key) => {
    // Keys are logical paths like "users/{hash}"; keep them inside `dir`.
    const resolved = path.join(dir, `${key}.json`);
    if (!resolved.startsWith(path.resolve(dir) + path.sep))
      throw new Error(`Invalid storage key: ${key}`);
    return resolved;
  };

  return {
    readJson: async (key) => {
      try {
        return JSON.parse(await fs.readFile(filePath(key), "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
      }
    },
    writeJson: async (key, value) => {
      const target = filePath(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify(value, null, 2));
    },
  };
};

module.exports = { createFsStorage };
