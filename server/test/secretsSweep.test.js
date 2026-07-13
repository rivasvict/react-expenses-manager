// NFR-2/AC-1.2/AC-2.4 sweep: runs the full account/party/invitation/backup
// lifecycle against the REAL fs storage adapter with known secrets, then
// greps everything at rest (every file under the data dir) and everything
// logged (console captured for the whole run) for any plaintext secret.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("../core/router");
const { createFsStorage } = require("../storage-fs");

const SECRETS = {
  janePassword: "jane-account-password-7f3",
  tomPassword: "tom-account-password-9c1",
  invitePassword: "family-invite-password-4b8",
};

const readTreeText = async (dir) => {
  const parts = [];
  const walk = async (current) => {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else parts.push(`${full}\n${await fs.readFile(full, "utf8")}`);
    }
  };
  await walk(dir);
  return parts.join("\n");
};

test("no plaintext password or invitation secret at rest or in logs (NFR-2)", async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-sweep-"));
  const logged = [];
  const original = { log: console.log, error: console.error, warn: console.warn };
  console.log = (...args) => logged.push(args.join(" "));
  console.error = (...args) => logged.push(args.join(" "));
  console.warn = (...args) => logged.push(args.join(" "));

  try {
    const app = createApp({
      storage: createFsStorage({ dir: dataDir }),
      tokenSecret: "sweep-token-secret",
      encryptionSecret: "sweep-encryption-secret",
    });
    const call = (method, path_, body, token) =>
      app.handle({
        method,
        path: path_,
        body,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

    // Full lifecycle: two accounts, a party, an invitation (wrong password
    // first), a redeem, a block, a backup upload + re-upload.
    const jane = (
      await call("POST", "/api/auth/signup", {
        email: "jane@example.com",
        password: SECRETS.janePassword,
        firstName: "Jane",
        lastName: "Doe",
      })
    ).body;
    const tom = (
      await call("POST", "/api/auth/signup", {
        email: "tom@example.com",
        password: SECRETS.tomPassword,
        firstName: "Tom",
        lastName: "Doe",
      })
    ).body;
    await call("POST", "/api/auth/login", {
      email: "jane@example.com",
      password: SECRETS.janePassword,
    });
    await call("POST", "/api/party", {}, jane.token);
    const invited = (
      await call(
        "POST",
        "/api/party/invitations",
        { password: SECRETS.invitePassword },
        jane.token
      )
    ).body;
    await call(
      "POST",
      "/api/party/join",
      { code: invited.code, password: "wrong-attempt" },
      tom.token
    );
    await call(
      "POST",
      "/api/party/join",
      { code: invited.code, password: SECRETS.invitePassword },
      tom.token
    );
    const upload = await call(
      "PUT",
      "/api/party/backup",
      {
        baseVersion: null,
        envelope: {
          app: "react-expenses-manager",
          schemaVersion: 1,
          exportedAt: "2026-07-13T00:00:00Z",
          data: { balance: [], buckets: {}, categories: [], fixedEntries: [] },
        },
      },
      jane.token
    );
    assert.equal(upload.status, 200);
    await call("POST", `/api/party/members/${tom.user.id}/block`, {}, jane.token);

    // The sweep: nothing at rest, nothing logged.
    const atRest = await readTreeText(dataDir);
    const logs = logged.join("\n");
    const bareCode = invited.code.replace("-", "");
    for (const [name, secret] of [
      ...Object.entries(SECRETS),
      ["invitationCode", invited.code],
      ["invitationCodeBare", bareCode],
    ]) {
      assert.ok(!atRest.includes(secret), `${name} found at rest`);
      assert.ok(!logs.includes(secret), `${name} found in logs`);
    }
    // Sanity: the sweep actually saw the stored records.
    assert.ok(atRest.includes('"algo": "scrypt"'));
  } finally {
    console.log = original.log;
    console.error = original.error;
    console.warn = original.warn;
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
