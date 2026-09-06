// Unit tests for the on-disk storage adapter (server/storage-fs.ts), run with
// the Node built-in test runner: npm run test:server
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFsStorage } from "./storage-fs";
import { StorageAdapter } from "./core/storage";

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
      // The versioned methods take the same keys and so need the same guard;
      // a CAS write that skipped it would be a way back out of the dir.
      await assert.rejects(
        () => storage.writeJsonVersioned(key, { pwned: true }, { expectedVersion: null }),
        /^Error: Invalid storage key: /,
        `writeJsonVersioned should reject key ${key}`
      );
      await assert.rejects(
        () => storage.readJsonVersioned(key),
        /^Error: Invalid storage key: /,
        `readJsonVersioned should reject key ${key}`
      );
    }

    // Nothing was created outside the storage dir by the attempts above.
    assert.equal(await exists(path.join(dir, "..", "secret.json")), false);
  }));

// --- Versioned (compare-and-swap) keys ------------------------------------

test("readJsonVersioned returns null for a key never written", () =>
  withTempDir(async (_dir, storage) => {
    assert.equal(await storage.readJsonVersioned("parties/nobody"), null);
  }));

test("a versioned write round-trips through the on-disk envelope", () =>
  withTempDir(async (dir, storage) => {
    const version = await storage.writeJsonVersioned("parties/p1", jane, {
      expectedVersion: null,
    });

    assert.equal(version, "1");
    assert.deepEqual(await storage.readJsonVersioned<UserDoc>("parties/p1"), {
      value: jane,
      version: "1",
    });
    // The version really is on disk, not held in the adapter's closure: a
    // fresh adapter over the same dir has to be able to continue the chain,
    // or a restarted server would lose every party's version.
    const reopened = createFsStorage({ dir });
    assert.equal(
      await reopened.writeJsonVersioned("parties/p1", jane, {
        expectedVersion: "1",
      }),
      "2"
    );
  }));

test("a create-only write on an existing key is refused", () =>
  withTempDir(async (_dir, storage) => {
    await storage.writeJsonVersioned("parties/p1", jane, {
      expectedVersion: null,
    });

    const second = await storage.writeJsonVersioned(
      "parties/p1",
      { id: "clobbered" },
      { expectedVersion: null }
    );

    assert.equal(second, null);
    const record = await storage.readJsonVersioned<UserDoc>("parties/p1");
    assert.deepEqual(record?.value, jane);
    assert.equal(record?.version, "1");
  }));

test("a write with a stale version is refused and changes nothing", () =>
  withTempDir(async (_dir, storage) => {
    await storage.writeJsonVersioned("parties/p1", jane, {
      expectedVersion: null,
    });
    await storage.writeJsonVersioned(
      "parties/p1",
      { ...jane, email: "winner@example.com" },
      { expectedVersion: "1" }
    );

    const loser = await storage.writeJsonVersioned(
      "parties/p1",
      { ...jane, email: "loser@example.com" },
      { expectedVersion: "1" }
    );

    assert.equal(loser, null);
    const record = await storage.readJsonVersioned<UserDoc>("parties/p1");
    assert.equal(record?.value.email, "winner@example.com");
  }));

test("concurrent compare-and-swap writes: exactly one of them wins", () =>
  withTempDir(async (_dir, storage) => {
    await storage.writeJsonVersioned("parties/p1", { count: 0 }, {
      expectedVersion: null,
    });

    // Ten writers all holding version "1", fired without awaiting between
    // them. Reading the current version and writing the file are separate
    // awaits, so without the adapter's serialization several of these would
    // interleave — each passing the version check before any of them wrote —
    // and all report success. Exactly one may.
    const results = await Promise.all(
      Array.from({ length: 10 }, (_value, index) =>
        storage.writeJsonVersioned(
          "parties/p1",
          { count: index + 1 },
          { expectedVersion: "1" }
        )
      )
    );

    assert.equal(results.filter((version) => version !== null).length, 1);
    assert.equal((await storage.readJsonVersioned("parties/p1"))?.version, "2");
  }));

test("sequential compare-and-swap writes each build on the last", () =>
  withTempDir(async (_dir, storage) => {
    let version = await storage.writeJsonVersioned("parties/p1", { count: 0 }, {
      expectedVersion: null,
    });

    for (let count = 1; count <= 5; count += 1) {
      version = await storage.writeJsonVersioned(
        "parties/p1",
        { count },
        { expectedVersion: version }
      );
      assert.equal(version, String(count + 1));
    }

    const record = await storage.readJsonVersioned<{ count: number }>(
      "parties/p1"
    );
    assert.deepEqual(record, { value: { count: 5 }, version: "6" });
  }));

test("a rejected CAS write does not wedge the writes queued behind it", () =>
  withTempDir(async (_dir, storage) => {
    await storage.writeJsonVersioned("parties/p1", { count: 0 }, {
      expectedVersion: null,
    });

    // An escaping key throws inside the serialized section. The chain has to
    // survive that, or one bad request would stall every CAS write after it.
    await assert.rejects(() =>
      storage.writeJsonVersioned("../escape", {}, { expectedVersion: null })
    );

    assert.equal(
      await storage.writeJsonVersioned(
        "parties/p1",
        { count: 1 },
        { expectedVersion: "1" }
      ),
      "2"
    );
  }));

test("a versioned key is stored wrapped in a version envelope", () =>
  withTempDir(async (dir, storage) => {
    await storage.writeJson("users/jane", jane);
    await storage.writeJsonVersioned("parties/p1", jane, {
      expectedVersion: null,
    });

    // The two families of methods are not interchangeable on one key: a
    // versioned key holds { version, data } on disk while a plain one holds
    // the bare value. That is why core/storage.ts documents them as disjoint
    // namespaces — reading a key through the other pair yields the wrong
    // shape rather than an error, which is the trap this pins.
    const onDisk = JSON.parse(
      await fs.readFile(path.join(dir, "parties", "p1.json"), "utf8")
    );
    assert.deepEqual(Object.keys(onDisk).sort(), ["data", "version"]);
    assert.deepEqual(onDisk.data, jane);

    const plainOnDisk = JSON.parse(
      await fs.readFile(path.join(dir, "users", "jane.json"), "utf8")
    );
    assert.deepEqual(plainOnDisk, jane);
  }));
