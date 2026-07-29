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
