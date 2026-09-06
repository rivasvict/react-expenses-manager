// On-disk storage adapter for local development (docs/multi-user-sync/RFC.md
// §6): JSON files under server/.data/ (gitignored). Implements the interface
// documented in server/core/storage.ts.
//
// Versioned keys (compare-and-swap, used for parties) are stored as an
// on-disk envelope { version, data } — the local stand-in for S3's ETag.
import fs from "node:fs/promises";
import path from "node:path";
import { nextVersion, StorageAdapter, VersionedRecord } from "./core/storage";

export interface FsStorageOptions {
  dir: string;
}

// What a versioned key holds on disk: the value plus the version a CAS write
// compares against. Plain keys store the bare value, with no envelope.
interface VersionEnvelope {
  version: string;
  data: unknown;
}

const isFileNotFound = (error: unknown): boolean =>
  error instanceof Error &&
  (error as NodeJS.ErrnoException).code === "ENOENT";

export const createFsStorage = ({ dir }: FsStorageOptions): StorageAdapter => {
  // Compare-and-swap on a file has `await` points between reading the current
  // version and writing the new one, so two overlapping writes could both
  // pass the version check and produce a lost update — the same invitation
  // redeemed twice, say. Each CAS write therefore runs only after the
  // previous one has settled. The chain is per-adapter rather than per-key:
  // this is a dev server, and simplicity beats throughput at family scale.
  let casChain: Promise<unknown> = Promise.resolve();
  const serialized = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = casChain.then(operation, operation);
    // Keep the chain alive whatever the operation's outcome, so one rejected
    // write does not wedge every write after it.
    casChain = result.catch(() => undefined);
    return result;
  };

  const filePath = (key: string): string => {
    // Keys are logical paths like "users/{hash}"; keep them inside `dir`.
    const resolved = path.join(dir, `${key}.json`);
    if (!resolved.startsWith(path.resolve(dir) + path.sep))
      throw new Error(`Invalid storage key: ${key}`);
    return resolved;
  };

  const readFileOrNull = async (key: string): Promise<string | null> => {
    try {
      return await fs.readFile(filePath(key), "utf8");
    } catch (error) {
      if (isFileNotFound(error)) return null;
      throw error;
    }
  };

  const writeFileMkdir = async (key: string, content: string): Promise<void> => {
    const target = filePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  };

  const readEnvelope = async (key: string): Promise<VersionEnvelope | null> => {
    const raw = await readFileOrNull(key);
    return raw === null ? null : (JSON.parse(raw) as VersionEnvelope);
  };

  return {
    readJson: async <T>(key: string): Promise<T | null> => {
      const raw = await readFileOrNull(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    },
    writeJson: async (key: string, value: unknown): Promise<void> => {
      await writeFileMkdir(key, JSON.stringify(value, null, 2));
    },
    readJsonVersioned: async <T>(
      key: string
    ): Promise<VersionedRecord<T> | null> => {
      const envelope = await readEnvelope(key);
      if (envelope === null) return null;
      return { value: envelope.data as T, version: envelope.version };
    },
    writeJsonVersioned: (
      key: string,
      value: unknown,
      { expectedVersion }: { expectedVersion: string | null }
    ): Promise<string | null> =>
      serialized(async () => {
        // Resolve the key before taking any other action so an escaping key
        // is rejected here exactly as it is on the unversioned path.
        filePath(key);
        const envelope = await readEnvelope(key);
        const currentVersion = envelope === null ? null : envelope.version;
        if (currentVersion !== expectedVersion) return null;
        const version = nextVersion(currentVersion);
        await writeFileMkdir(
          key,
          JSON.stringify({ version, data: value } as VersionEnvelope, null, 2)
        );
        return version;
      }),
  };
};
