// Drives the real deploy-expenses-manager.sh against a fake box (temp
// EM_PREFIX, stub systemctl/tailscale) and a fake GitHub API + nodejs.org.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeWorld, runScript, deployEnv, DEPLOY_SCRIPT } from "./testHarness.mjs";

const worlds = [];
const world = async (options) => {
  const created = await makeWorld(options);
  worlds.push(created);
  return created;
};
after(() => worlds.forEach((created) => created.stop()));

const restarts = (w) => w.box.calls().filter((call) => call.startsWith("systemctl restart"));

describe("deploying", () => {
  test("a happy deploy lays out the release, links, restarts and publishes", async () => {
    const w = await world();
    w.publish("1.25.0");
    const result = await w.deploy();
    assert.equal(result.status, 0, result.stderr + result.stdout);

    assert.equal(w.box.current(), "1.25.0");
    assert.equal(w.box.previous(), null);
    const release = path.join(w.box.opt, "releases/1.25.0");
    for (const file of ["build/index.html", "build/version.json", "server/dist/index.js", "release.json", "deploy/deploy-expenses-manager.sh"]) {
      assert.ok(fs.existsSync(path.join(release, file)), file);
    }
    assert.equal(
      fs.readlinkSync(path.join(release, "node")),
      path.join(w.box.opt, "node/18.20.8")
    );
    assert.equal(fs.readdirSync(path.join(w.box.opt, "downloads")).length, 0, "downloads cleaned up");

    const calls = w.box.calls();
    assert.ok(calls.includes("systemctl restart expenses-manager"));
    assert.ok(calls.includes(`tailscale serve --bg --set-path=/ ${fs.realpathSync(path.join(release, "build"))}`));
    assert.ok(calls.some((call) => call.endsWith(`--set-path=/api http://127.0.0.1:${w.server.port}/api`)));
    assert.ok(!calls.some((call) => call.includes("enable")), "never enabled at boot");
    assert.match(result.stdout, /v1\.25\.0/);
  });

  test("a release already current and healthy is a no-op", async () => {
    const w = await world();
    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    const before = restarts(w).length;
    const again = await w.deploy();
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /already deployed and healthy/);
    assert.equal(restarts(w).length, before);
  });

  test("a specific version can be deployed by tag", async () => {
    const w = await world();
    w.publish("1.24.0");
    w.publish("1.25.0");
    assert.equal((await w.deploy(["v1.24.0"])).status, 0);
    assert.equal(w.box.current(), "1.24.0");
  });

  test("a bad signature changes nothing", async () => {
    const w = await world();
    w.publish("1.25.0", { tamper: "signature" });
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /signature on SHA256SUMS does not verify/);
    assert.equal(w.box.current(), null);
    assert.deepEqual(w.box.releases(), []);
    assert.ok(!w.box.calls().some((call) => call.startsWith("systemctl restart")));
  });

  test("a bad checksum changes nothing", async () => {
    const w = await world();
    w.publish("1.25.0", { tamper: "checksum" });
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /checksum of expenses-manager-1\.25\.0\.tar\.gz does not match/);
    assert.deepEqual(w.box.releases(), []);
  });

  test("a tarball with .. in a path is rejected", async () => {
    const w = await world();
    w.publish("1.25.0", { tamper: "traversal" });
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /"\.\."/);
    assert.deepEqual(w.box.releases(), []);
  });

  test("a tarball containing a link is rejected", async () => {
    const w = await world();
    w.publish("1.25.0", { tamper: "symlink" });
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /links or special files/);
    assert.deepEqual(w.box.releases(), []);
  });

  test("a Node download that does not match the signed manifest is rejected", async () => {
    const w = await world();
    w.publish("1.25.0", { nodeSha: "e".repeat(64) });
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Node download does not match the checksum/);
    assert.equal(w.box.current(), null);
  });

  test("an unsupported architecture stops with a clear message", async () => {
    const w = await world();
    w.publish("1.25.0");
    const result = await w.deploy([], { EM_UNAME_M: "riscv64" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unsupported CPU architecture "riscv64"/);
    assert.equal(w.box.current(), null);
  });

  test("a release that never gets healthy is rolled back automatically", async () => {
    const w = await world();
    w.publish("1.24.0");
    assert.equal((await w.deploy()).status, 0);
    w.publish("1.25.0");
    w.state.healthy = ["1.24.0"];
    w.save();

    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /rolling back/i);
    assert.match(result.stderr, /journal line/);
    assert.equal(w.box.current(), "1.24.0");
    assert.equal(restarts(w).length, 3, "first deploy, failed deploy, rollback");
  });

  test("a failed first deploy leaves nothing running", async () => {
    const w = await world();
    w.publish("1.25.0");
    w.state.healthy = [];
    w.save();
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.equal(w.box.current(), null);
    assert.ok(w.box.calls().includes("systemctl stop expenses-manager"));
  });

  test("the deployer updates itself after a successful deploy", async () => {
    const w = await world();
    fs.mkdirSync(path.join(w.box.opt, "bin"), { recursive: true });
    fs.writeFileSync(path.join(w.box.opt, "bin/deploy-expenses-manager.sh"), "old");
    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    assert.match(
      fs.readFileSync(path.join(w.box.opt, "bin/deploy-expenses-manager.sh"), "utf8"),
      /deployer shipped with 1\.25\.0/
    );
  });

  test("the data is backed up before the switch", async () => {
    const w = await world();
    fs.writeFileSync(path.join(w.box.var, "data/users.json"), "{}");
    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    const backups = fs.readdirSync(path.join(w.box.var, "backups"));
    assert.equal(backups.length, 1);
    assert.match(backups[0], /^\d{8}T\d{6}Z-before-1\.25\.0\.tar\.gz$/);
  });

  test("old backups are pruned to KEEP_BACKUPS", async () => {
    const w = await world();
    fs.writeFileSync(path.join(w.box.var, "data/users.json"), "{}");
    fs.appendFileSync(path.join(w.box.etc, "deploy.conf"), "KEEP_BACKUPS=2\n");
    for (const stamp of ["20200101T000000Z", "20200102T000000Z", "20200103T000000Z"]) {
      fs.writeFileSync(path.join(w.box.var, `backups/${stamp}-before-1.0.0.tar.gz`), "x");
    }
    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    const backups = fs.readdirSync(path.join(w.box.var, "backups")).sort();
    assert.equal(backups.length, 2);
    assert.match(backups[1], /before-1\.25\.0/);
  });
});

describe("keeping releases", () => {
  test("pruning keeps current and previous even outside the keep window", async () => {
    const w = await world();
    fs.appendFileSync(path.join(w.box.etc, "deploy.conf"), "KEEP_RELEASES=2\n");
    for (const version of ["1.21.0", "1.22.0", "1.23.0", "1.24.0"]) {
      w.publish(version);
      assert.equal((await w.deploy()).status, 0);
    }
    assert.deepEqual(w.box.releases(), ["1.23.0", "1.24.0"]);

    assert.equal((await runScript(DEPLOY_SCRIPT, ["rollback"], { env: deployEnv(w.box, w.server) })).status, 0);
    assert.equal(w.box.current(), "1.23.0");
    assert.equal(w.box.previous(), "1.24.0");

    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    // Keep window is {1.25.0, 1.24.0}; 1.23.0 is the new `previous`.
    assert.deepEqual(w.box.releases(), ["1.23.0", "1.24.0", "1.25.0"]);
    assert.equal(w.box.previous(), "1.23.0");
  });
});

describe("other commands", () => {
  test("rollback swaps current and previous and restarts", async () => {
    const w = await world();
    w.publish("1.24.0");
    await w.deploy();
    w.publish("1.25.0");
    await w.deploy();
    assert.equal(w.box.current(), "1.25.0");
    assert.equal(w.box.previous(), "1.24.0");

    const result = await w.deploy(["rollback"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(w.box.current(), "1.24.0");
    assert.equal(w.box.previous(), "1.25.0");
    assert.equal(restarts(w).length, 3);
  });

  test("rollback with nothing to go back to fails clearly", async () => {
    const w = await world();
    w.publish("1.25.0");
    await w.deploy();
    const result = await w.deploy(["rollback"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no previous release/);
  });

  test("stop stops the service and removes only this app's serve paths", async () => {
    const w = await world();
    w.publish("1.25.0");
    await w.deploy();
    const result = await w.deploy(["stop"]);
    assert.equal(result.status, 0, result.stderr);
    const calls = w.box.calls();
    assert.ok(calls.includes("systemctl stop expenses-manager"));
    assert.ok(calls.includes("tailscale serve --set-path=/ off"));
    assert.ok(calls.includes("tailscale serve --set-path=/api off"));
    assert.ok(!calls.includes("tailscale serve reset"));
  });

  test("stop falls back to reset, with a warning, when per-path removal fails", async () => {
    const w = await world();
    w.publish("1.25.0");
    await w.deploy();
    const result = await w.deploy(["stop"], { STUB_TAILSCALE_OFF_EXIT: "1" });
    assert.match(result.stderr, /resetting its whole serve config/);
    assert.ok(w.box.calls().includes("tailscale serve reset"));
  });

  test("start brings an already-deployed release back up", async () => {
    const w = await world();
    w.publish("1.25.0");
    await w.deploy();
    const before = restarts(w).length;
    const result = await w.deploy(["start"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(restarts(w).length, before + 1);
  });

  test("start before any deploy points at the deploy command", async () => {
    const w = await world();
    const result = await w.deploy(["start"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Nothing is deployed yet/);
  });

  test("status and list report the releases", async () => {
    const w = await world();
    w.publish("1.24.0");
    await w.deploy();
    w.publish("1.25.0");
    await w.deploy();
    const status = await w.deploy(["status"]);
    assert.match(status.stdout, /current\s+1\.25\.0/);
    assert.match(status.stdout, /previous\s+1\.24\.0/);
    assert.match(status.stdout, /service\s+active/);
    assert.match(status.stdout, /health\s+ok/);
    const list = await w.deploy(["list"]);
    assert.equal(list.stdout.trim(), "1.25.0 (current)\n1.24.0 (previous)");
  });

  test("logs passes its arguments to journalctl", async () => {
    const w = await world();
    const result = await w.deploy(["logs", "-f"]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(w.box.calls().includes("journalctl -u expenses-manager -f"));
  });

  test("an unknown command is rejected and help works", async () => {
    const w = await world();
    const unknown = await w.deploy(["frobnicate"]);
    assert.notEqual(unknown.status, 0);
    const help = await w.deploy(["help"]);
    assert.equal(help.status, 0);
    assert.match(help.stdout, /rollback/);
  });

  test("the script passes shellcheck-style syntax checking", () => {
    const result = spawnSync("bash", ["-n", DEPLOY_SCRIPT], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  });
});

describe("talking to GitHub", () => {
  test("no Authorization header is sent when no token is configured", async () => {
    const w = await world();
    w.publish("1.25.0");
    assert.equal((await w.deploy()).status, 0);
    const githubRequests = w.requests().filter((request) => request.url.startsWith("/repos/"));
    assert.ok(githubRequests.length >= 4, "lookup plus three assets");
    assert.ok(githubRequests.every((request) => request.authorization === null));
  });

  test("the token is sent on every GitHub request when one is configured", async () => {
    const w = await world();
    fs.appendFileSync(path.join(w.box.etc, "deploy.conf"), "GITHUB_TOKEN_FILE=/etc/expenses-manager/github-token\n");
    fs.writeFileSync(path.join(w.box.etc, "github-token"), "ghp_secret\n", { mode: 0o600 });
    w.publish("1.25.0");
    const result = await w.deploy();
    assert.equal(result.status, 0, result.stderr);
    const githubRequests = w.requests().filter((request) => request.url.startsWith("/repos/"));
    assert.ok(githubRequests.every((request) => request.authorization === "Bearer ghp_secret"));
    assert.ok(!result.stdout.includes("ghp_secret") && !result.stderr.includes("ghp_secret"));
  });

  test("a configured token file that is missing is reported", async () => {
    const w = await world();
    fs.appendFileSync(path.join(w.box.etc, "deploy.conf"), "GITHUB_TOKEN_FILE=/etc/expenses-manager/github-token\n");
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /github-token but that file is missing/);
  });

  test("401 explains how to create or renew a token", async () => {
    const w = await world();
    w.state.apiStatus = 401;
    w.save();
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /answered 401/);
    assert.match(result.stderr, /fine-grained token with read-only Contents access/);
    assert.match(result.stderr, /docs\/deployment\/server-setup\.md/);
  });

  test("404 without a token hints that a private repo needs one", async () => {
    const w = await world();
    const result = await w.deploy(["v9.9.9"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /answered 404/);
    assert.match(result.stderr, /private and no token is configured/);
  });

  test("404 with a token does not blame a missing token", async () => {
    const w = await world();
    fs.appendFileSync(path.join(w.box.etc, "deploy.conf"), "GITHUB_TOKEN_FILE=/etc/expenses-manager/github-token\n");
    fs.writeFileSync(path.join(w.box.etc, "github-token"), "tok\n", { mode: 0o600 });
    const result = await w.deploy(["v9.9.9"]);
    assert.match(result.stderr, /does not exist, or the configured token cannot see/);
  });

  test("a placeholder signing key on the box blocks verification", async () => {
    const w = await world();
    fs.writeFileSync(
      path.join(w.box.etc, "allowed_signers"),
      'expenses-manager-release namespaces="expenses-manager-release" ssh-ed25519 PLACEHOLDER_X\n'
    );
    w.publish("1.25.0");
    const result = await w.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /placeholder key/);
  });
});

before(() => {
  for (const tool of ["ssh-keygen", "jq", "flock", "tar"]) {
    const found = spawnSync("sh", ["-c", `command -v ${tool}`]);
    assert.equal(found.status, 0, `${tool} is required to run these tests`);
  }
});
