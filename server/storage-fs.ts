// On-disk storage adapter for local development (RFC §6): JSON files under
// server/.data/ (gitignored). Implements the interface documented in
// server/core/storage.ts.
import fs from "node:fs/promises";
import path from "node:path";
import { StorageAdapter } from "./core/storage";

export interface FsStorageOptions {
  dir: string;
}

const isFileNotFound = (error: unknown): boolean =>
  error instanceof Error &&
  (error as NodeJS.ErrnoException).code === "ENOENT";

export const createFsStorage = ({ dir }: FsStorageOptions): StorageAdapter => {
  const filePath = (key: string): string => {
    // Keys are logical paths like "users/{hash}"; keep them inside `dir`.
    const resolved = path.join(dir, `${key}.json`);
    if (!resolved.startsWith(path.resolve(dir) + path.sep))
      throw new Error(`Invalid storage key: ${key}`);
    return resolved;
  };

  return {
    readJson: async <T>(key: string): Promise<T | null> => {
      try {
        return JSON.parse(await fs.readFile(filePath(key), "utf8")) as T;
      } catch (error) {
        if (isFileNotFound(error)) return null;
        throw error;
      }
    },
    writeJson: async (key: string, value: unknown): Promise<void> => {
      const target = filePath(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify(value, null, 2));
    },
  };
};
