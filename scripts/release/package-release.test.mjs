// Tests for the release packager (./package-release.sh), run against a fake
// checkout and fixture Node metadata so nothing touches the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./package-release.sh", import.meta.url));
const COMMIT = "0123456789abcdef0123456789abcdef01234567";
const EPOCH = "1790000000";
const SHA_X64 = "a".repeat(64);
const SHA_ARM = "b".repeat(64);

const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const makeCheckout = ({ nvmrc = "18" } = {}) => {
  const root = tmp("package-release-repo-");
  write(path.join(root, "build/index.html"), "<html></html>");
  write(path.join(root, "build/static/js/main.js"), "console.log(1)");
  write(path.join(root, "server/dist/index.js"), "// server");
  write(path.join(root, "server/dist/core/router.js"), "// router");
  write(path.join(root, "server/dist/core/router.test.js"), "// test");
  write(path.join(root, "server/.nvmrc"), `${nvmrc}\n`);
  write(path.join(root, "deploy/deploy-expenses-manager.sh"), "#!/bin/sh\n");
  return root;
};

const makeFixtures = () => {
  const dir = tmp("package-release-fixtures-");
  write(
    path.join(dir, "index.json"),
    JSON.stringify([
      { version: "v20.1.0" },
      { version: "v18.20.8" },
      { version: "v18.20.7" },
      { version: "v18.0.0" },
    ])
  );
  write(
    path.join(dir, "SHASUMS256.txt"),
    [
      `${SHA_X64}  node-v18.20.8-linux-x64.tar.gz`,
      `${"c".repeat(64)}  node-v18.20.8-linux-x64.tar.xz`,
      `${SHA_ARM}  node-v18.20.8-linux-arm64.tar.gz`,
    ].join("\n")
  );
  return dir;
};

const packageRelease = ({ root, fixtures, out, version = "1.25.0", env = {} }) =>
  spawnSync("bash", [SCRIPT, version, COMMIT, out], {
    encoding: "utf8",
    env: {
      ...process.env,
      REPO_ROOT: root,
      SOURCE_DATE_EPOCH: EPOCH,
      EM_NODE_INDEX_FILE: path.join(fixtures, "index.json"),
      EM_NODE_SHASUMS_FILE: path.join(fixtures, "SHASUMS256.txt"),
      ...env,
    },
  });

const tar = (...args) => {
  const result = spawnSync("tar", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};

const build = (options = {}) => {
  const root = options.root ?? makeCheckout();
  const fixtures = makeFixtures();
  const out = tmp("package-release-out-");
  const result = packageRelease({ root, fixtures, out, ...options });
  return { root, fixtures, out, result };
};

test("the archive has the expected layout under one top directory", () => {
  const { out, result } = build();
  assert.equal(result.status, 0, result.stderr);
  const entries = tar("-tzf", path.join(out, "expenses-manager-1.25.0.tar.gz"))
    .trim()
    .split("\n");
  for (const expected of [
    "expenses-manager-1.25.0/build/index.html",
    "expenses-manager-1.25.0/build/static/js/main.js",
    "expenses-manager-1.25.0/build/version.json",
    "expenses-manager-1.25.0/server/dist/index.js",
    "expenses-manager-1.25.0/server/dist/core/router.js",
    "expenses-manager-1.25.0/server/.nvmrc",
    "expenses-manager-1.25.0/server/package.json",
    "expenses-manager-1.25.0/deploy/deploy-expenses-manager.sh",
    "expenses-manager-1.25.0/release.json",
  ]) {
    assert.ok(entries.includes(expected), `missing ${expected}`);
  }
  assert.ok(
    !entries.some((entry) => entry.endsWith(".test.js")),
    "compiled tests are left out"
  );
});

test("no entry is absolute or climbs out with ..", () => {
  const { out } = build();
  const entries = tar("-tzf", path.join(out, "expenses-manager-1.25.0.tar.gz"))
    .trim()
    .split("\n");
  for (const entry of entries) {
    assert.ok(!entry.startsWith("/"), entry);
    assert.ok(!entry.split("/").includes(".."), entry);
    assert.ok(entry.startsWith("expenses-manager-1.25.0"), entry);
  }
});

test("release.json carries the version, commit and pinned Node checksums", () => {
  const { out } = build();
  const manifest = JSON.parse(
    tar("-xzOf", path.join(out, "expenses-manager-1.25.0.tar.gz"), "expenses-manager-1.25.0/release.json")
  );
  assert.equal(manifest.name, "expenses-manager");
  assert.equal(manifest.version, "1.25.0");
  assert.equal(manifest.commit, COMMIT);
  assert.equal(manifest.builtAt, new Date(Number(EPOCH) * 1000).toISOString().replace(".000Z", "Z"));
  assert.deepEqual(manifest.node, {
    version: "18.20.8",
    "linux-x64": { file: "node-v18.20.8-linux-x64.tar.gz", sha256: SHA_X64 },
    "linux-arm64": { file: "node-v18.20.8-linux-arm64.tar.gz", sha256: SHA_ARM },
  });
});

test("build/version.json tells the deployer what is served", () => {
  const { out } = build();
  const versionJson = JSON.parse(
    tar("-xzOf", path.join(out, "expenses-manager-1.25.0.tar.gz"), "expenses-manager-1.25.0/build/version.json")
  );
  assert.deepEqual(versionJson, { version: "1.25.0", commit: COMMIT });
});

test("an exact server/.nvmrc pin skips the index lookup", () => {
  const root = makeCheckout({ nvmrc: "v18.20.7" });
  const fixtures = makeFixtures();
  fs.writeFileSync(
    path.join(fixtures, "SHASUMS256.txt"),
    `${SHA_X64}  node-v18.20.7-linux-x64.tar.gz\n${SHA_ARM}  node-v18.20.7-linux-arm64.tar.gz\n`
  );
  const out = tmp("package-release-out-");
  const result = packageRelease({ root, fixtures, out });
  assert.equal(result.status, 0, result.stderr);
});

test("SHA256SUMS verifies with sha256sum -c", () => {
  const { out } = build();
  const sums = fs.readFileSync(path.join(out, "SHA256SUMS"), "utf8");
  assert.match(sums, /^[0-9a-f]{64} {2}expenses-manager-1\.25\.0\.tar\.gz\n$/);
  const check = spawnSync("sha256sum", ["-c", "SHA256SUMS"], { cwd: out, encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
});

test("two runs produce byte-identical archives", () => {
  const root = makeCheckout();
  const first = build({ root });
  const second = build({ root });
  assert.equal(
    fs.readFileSync(path.join(first.out, "SHA256SUMS"), "utf8"),
    fs.readFileSync(path.join(second.out, "SHA256SUMS"), "utf8")
  );
});

test("a missing checksum for a platform fails loudly", () => {
  const root = makeCheckout();
  const fixtures = makeFixtures();
  fs.writeFileSync(path.join(fixtures, "SHASUMS256.txt"), `${SHA_X64}  node-v18.20.8-linux-x64.tar.gz\n`);
  const out = tmp("package-release-out-");
  const result = packageRelease({ root, fixtures, out });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no valid checksum for node-v18\.20\.8-linux-arm64\.tar\.gz/);
});

test("it refuses to run without the builds", () => {
  const root = makeCheckout();
  fs.rmSync(path.join(root, "build"), { recursive: true });
  const { result } = build({ root });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm run build/);
});

test("it rejects a malformed version or commit", () => {
  const { result } = build({ version: "v1.25" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MAJOR\.MINOR\.PATCH/);
});
