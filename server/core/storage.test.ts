// Unit tests for the in-memory storage adapter (server/core/storage.ts), the
// reference implementation the contract tests run against. Its behaviour has
// to match server/storage-fs.ts, or tests would pass against a fiction.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryStorage } from "./storage";

interface UserDoc {
  id: string;
  email: string;
  tags: string[];
  meta: { active: boolean };
}

const jane: UserDoc = {
  id: "u-1",
  email: "jane@example.com",
  tags: ["owner"],
  meta: { active: true },
};

test("writeJson → readJson round-trips a deep-equal object", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson("users/jane", jane);

  assert.deepEqual(await storage.readJson<UserDoc>("users/jane"), jane);
});

test("readJson returns null for a missing key instead of throwing", async () => {
  const storage = createMemoryStorage();

  assert.equal(await storage.readJson("users/nobody"), null);
});

test("writeJson overwrites an existing key", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson("users/jane", jane);
  await storage.writeJson("users/jane", { ...jane, email: "j2@example.com" });

  const read = await storage.readJson<UserDoc>("users/jane");
  assert.equal(read?.email, "j2@example.com");
});

test("stored values are serialized, not held by reference", async () => {
  const storage = createMemoryStorage();
  const mutable = { id: "u-1", tags: ["owner"] };
  await storage.writeJson("users/jane", mutable);

  // Mutating the object after the write must not change what was stored —
  // the fs adapter serializes to disk, so the in-memory one has to snapshot
  // too, otherwise tests would pass here and fail against real storage.
  mutable.tags.push("mutated");
  mutable.id = "changed";

  assert.deepEqual(await storage.readJson("users/jane"), {
    id: "u-1",
    tags: ["owner"],
  });
});

test("reads return independent copies", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson("users/jane", jane);

  const first = (await storage.readJson<UserDoc>("users/jane")) as UserDoc;
  first.email = "tampered@example.com";

  // A second read is unaffected by mutating the first.
  const second = (await storage.readJson<UserDoc>("users/jane")) as UserDoc;
  assert.equal(second.email, "jane@example.com");
});

test("keys are independent and namespaced by their full path", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson("users/a", { id: "a" });
  await storage.writeJson("users/b", { id: "b" });
  await storage.writeJson("user-ids/a", { userKey: "users/a" });

  assert.deepEqual(await storage.readJson("users/a"), { id: "a" });
  assert.deepEqual(await storage.readJson("users/b"), { id: "b" });
  assert.deepEqual(await storage.readJson("user-ids/a"), {
    userKey: "users/a",
  });
});

// --- Versioned (compare-and-swap) keys ------------------------------------

test("readJsonVersioned returns null for a key never written", async () => {
  const storage = createMemoryStorage();

  assert.equal(await storage.readJsonVersioned("parties/nobody"), null);
});

test("a create-only write establishes the first version", async () => {
  const storage = createMemoryStorage();

  const version = await storage.writeJsonVersioned("parties/p1", jane, {
    expectedVersion: null,
  });

  assert.equal(version, "1");
  assert.deepEqual(await storage.readJsonVersioned<UserDoc>("parties/p1"), {
    value: jane,
    version: "1",
  });
});

test("a create-only write on an existing key is refused", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned("parties/p1", jane, {
    expectedVersion: null,
  });

  const second = await storage.writeJsonVersioned(
    "parties/p1",
    { id: "clobbered" },
    { expectedVersion: null }
  );

  // Null, not a throw — and the original survives untouched.
  assert.equal(second, null);
  const record = await storage.readJsonVersioned<UserDoc>("parties/p1");
  assert.deepEqual(record?.value, jane);
  assert.equal(record?.version, "1");
});

test("a write with the current version succeeds and moves the version on", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned("parties/p1", jane, {
    expectedVersion: null,
  });

  const version = await storage.writeJsonVersioned(
    "parties/p1",
    { ...jane, email: "j2@example.com" },
    { expectedVersion: "1" }
  );

  assert.equal(version, "2");
  const record = await storage.readJsonVersioned<UserDoc>("parties/p1");
  assert.equal(record?.value.email, "j2@example.com");
  assert.equal(record?.version, "2");
});

test("a write with a stale version is refused and changes nothing", async () => {
  const storage = createMemoryStorage();
  await storage.writeJsonVersioned("parties/p1", jane, {
    expectedVersion: null,
  });
  await storage.writeJsonVersioned(
    "parties/p1",
    { ...jane, email: "winner@example.com" },
    { expectedVersion: "1" }
  );

  // A second writer still holding version "1" — the lost-update case the
  // whole mechanism exists to prevent.
  const loser = await storage.writeJsonVersioned(
    "parties/p1",
    { ...jane, email: "loser@example.com" },
    { expectedVersion: "1" }
  );

  assert.equal(loser, null);
  const record = await storage.readJsonVersioned<UserDoc>("parties/p1");
  assert.equal(record?.value.email, "winner@example.com");
  assert.equal(record?.version, "2");
});

test("versioned values are snapshotted and not mutable, like the plain ones", async () => {
  const storage = createMemoryStorage();
  const mutable = { id: "p-1", tags: ["owner"] };
  await storage.writeJsonVersioned("parties/p1", mutable, {
    expectedVersion: null,
  });

  mutable.tags.push("mutated");

  const record = await storage.readJsonVersioned("parties/p1");
  assert.deepEqual(record?.value, { id: "p-1", tags: ["owner"] });
});

test("versioned and plain keys are separate namespaces", async () => {
  const storage = createMemoryStorage();
  await storage.writeJson("shared/key", { from: "plain" });
  await storage.writeJsonVersioned(
    "shared/key",
    { from: "versioned" },
    { expectedVersion: null }
  );

  // Adapters may store the two differently (the fs one wraps versioned
  // values in an envelope), so neither may be reachable through the other's
  // methods — a plain read of a versioned key would otherwise hand back the
  // envelope instead of the value.
  assert.deepEqual(await storage.readJson("shared/key"), { from: "plain" });
  assert.deepEqual((await storage.readJsonVersioned("shared/key"))?.value, {
    from: "versioned",
  });
});
