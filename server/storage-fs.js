// On-disk storage adapter for local development (RFC §6): JSON files under
// server/.data/ (gitignored). Implements the interface documented in
// server/core/storage.js.
//
// Versioned keys (compare-and-swap, used for parties) are stored as an
// on-disk envelope { version, data } — the local stand-in for S3's ETag.
// The single-process dev server serializes requests per event-loop tick,
// so read-envelope/compare/write is race-free enough at family scale
// (RFC §2.1: collisions are ~impossible; handlers still retry once).
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

  const readFileOrNull = async (key) => {
    try {
      return await fs.readFile(filePath(key), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  };

  const writeFileMkdir = async (key, content) => {
    const target = filePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  };

  return {
    readJson: async (key) => {
      const raw = await readFileOrNull(key);
      return raw === null ? null : JSON.parse(raw);
    },
    writeJson: async (key, value) => {
      await writeFileMkdir(key, JSON.stringify(value, null, 2));
    },
    readJsonVersioned: async (key) => {
      const raw = await readFileOrNull(key);
      if (raw === null) return null;
      const envelope = JSON.parse(raw);
      return { value: envelope.data, version: envelope.version };
    },
    writeJsonVersioned: async (key, value, { expectedVersion }) => {
      const raw = await readFileOrNull(key);
      const currentVersion = raw === null ? null : JSON.parse(raw).version;
      if (currentVersion !== expectedVersion) return null;
      const newVersion = String(Number(currentVersion || "0") + 1);
      await writeFileMkdir(
        key,
        JSON.stringify({ version: newVersion, data: value }, null, 2)
      );
      return newVersion;
    },
  };
};

module.exports = { createFsStorage };
