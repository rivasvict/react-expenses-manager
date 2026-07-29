// Unit tests for the on-disk storage adapter (server/storage-fs.ts), run with
// the Node built-in test runner: npm run test:server
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFsStorage } from "../storage-fs";
import { StorageAdapter } from "../core/storage";

// Each test gets its own temp directory, removed afterwards even on failure.
const withTempDir = async (
  run: (dir: string, storage: StorageAdapter) => Promise<void>
): Promise<void> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "xpns-storage-fs-"));
  try {
    await run(dir, createFsStorage({ dir }));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};

const exists = async (target: string): Promise<boolean> => {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
};

interface UserDoc {
  id: string;
  email: string;
  tags: string[];
  meta: { active: boolean; score: number };
}

const jane: UserDoc = {
  id: "u-1",
  email: "jane@example.com",
  tags: ["owner", "beta"],
  meta: { active: true, score: 42 },
};

test("writeJson → readJson round-trips a deep-equal object", () =>
  withTempDir(async (dir, storage) => {
    await storage.writeJson("users/jane", jane);

    const read = await storage.readJson<UserDoc>("users/jane");
    assert.deepEqual(read, jane);
    // A fresh adapter over the same dir sees it too: the value really is on
    // disk, not cached in the closure.
    assert.deepEqual(
      await createFsStorage({ dir }).readJson<UserDoc>("users/jane"),
      jane
    );
  }));

test("readJson returns null for a missing key instead of throwing", () =>
  withTempDir(async (_dir, storage) => {
    assert.equal(await storage.readJson("users/nobody"), null);
    assert.equal(await storage.readJson("no-such-file"), null);
  }));

test("writeJson creates intermediate directories for nested keys", () =>
  withTempDir(async (dir, storage) => {
    assert.equal(await exists(path.join(dir, "users")), false);

    await storage.writeJson("users/abc", { id: "abc" });

    assert.ok(await exists(path.join(dir, "users", "abc.json")));
    assert.deepEqual(await storage.readJson("users/abc"), { id: "abc" });
  }));

test("writeJson overwrites an existing key", () =>
  withTempDir(async (_dir, storage) => {
    await storage.writeJson("users/jane", jane);
    await storage.writeJson("users/jane", { ...jane, email: "j2@example.com" });

    const read = await storage.readJson<UserDoc>("users/jane");
    assert.equal(read?.email, "j2@example.com");
  }));

test("keys that escape the storage dir are rejected", () =>
  withTempDir(async (dir, storage) => {
    const escaping = ["../secret", "../../etc/passwd", "users/../../escape"];

    for (const key of escaping) {
      await assert.rejects(
        () => storage.writeJson(key, { pwned: true }),
        new RegExp(`^Error: Invalid storage key: ${key.replace(/\./g, "\\.")}$`),
        `writeJson should reject key ${key}`
      );
      await assert.rejects(
        () => storage.readJson(key),
        /^Error: Invalid storage key: /,
        `readJson should reject key ${key}`
      );
    }

    // Nothing was created outside the storage dir by the attempts above.
    assert.equal(await exists(path.join(dir, "..", "secret.json")), false);
  }));
