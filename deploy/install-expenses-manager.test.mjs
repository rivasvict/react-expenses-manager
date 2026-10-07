// Drives the real install-expenses-manager.sh against a temp EM_PREFIX with
// stub systemctl/tailscale. The clone it runs from is a copy of deploy/ with a
// real signing key in allowed_signers, so the placeholder guard passes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INSTALL_SCRIPT, makeBox, makeSigningKey, runScript, tmp, write } from "./testHarness.mjs";

const DEPLOY_DIR = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(file, "utf8");

// A clone with the repo's deploy/ files, the legacy stop.sh and optional data.
const makeClone = ({ legacyData, placeholder = false } = {}) => {
  const clone = tmp("em-clone-");
  fs.mkdirSync(path.join(clone, "deploy"));
  for (const file of ["install-expenses-manager.sh", "deploy-expenses-manager.sh", "expenses-manager.service", "expenses-manager.env.example", "deploy.conf.example"]) {
    fs.copyFileSync(path.join(DEPLOY_DIR, file), path.join(clone, "deploy", file));
  }
  fs.copyFileSync(path.join(DEPLOY_DIR, "..", "stop.sh"), path.join(clone, "stop.sh"));
  // The committed file is the placeholder; a real key replaces it unless the
  // test wants the placeholder guard.
  fs.copyFileSync(path.join(DEPLOY_DIR, "allowed_signers"), path.join(clone, "deploy/allowed_signers"));
  if (!placeholder) {
    fs.writeFileSync(path.join(clone, "deploy/allowed_signers"), makeSigningKey().allowedSigners);
  }
  for (const [name, content] of Object.entries(legacyData ?? {})) {
    write(path.join(clone, "server/.data", name), content);
  }
  return clone;
};

const install = (clone, box, { args = [], env = {} } = {}) =>
  runScript(path.join(clone, "deploy/install-expenses-manager.sh"), args, {
    env: {
      EM_PREFIX: box.prefix,
      EM_SKIP_ROOT_CHECK: "1",
      EM_SYSTEMCTL: path.join(box.bin, "systemctl"),
      EM_TAILSCALE: path.join(box.bin, "tailscale"),
      TOKEN_SECRET: "tok-secret",
      ENCRYPTION_KEY: 'enc"key\\x',
      PORT: "45999",
      ...env,
    },
  });

const newBox = () => {
  const box = makeBox({ signingKey: makeSigningKey() });
  // The installer creates everything itself; start from a bare prefix.
  fs.rmSync(path.join(box.prefix, "etc"), { recursive: true });
  fs.rmSync(path.join(box.prefix, "opt"), { recursive: true });
  fs.rmSync(path.join(box.prefix, "var"), { recursive: true });
  return box;
};

const modeOf = (file) => (fs.statSync(file).mode & 0o777).toString(8);

test("a fresh install creates the layout, files and modes", async () => {
  const box = newBox();
  const clone = makeClone();
  const result = await install(clone, box);
  assert.equal(result.status, 0, result.stderr + result.stdout);

  for (const dir of ["bin", "releases", "node", "downloads"]) {
    assert.ok(fs.statSync(path.join(box.opt, dir)).isDirectory(), dir);
  }
  assert.equal(modeOf(box.etc), "700");
  assert.equal(modeOf(path.join(box.var, "data")), "700");
  assert.equal(modeOf(path.join(box.var, "backups")), "700");
  assert.equal(modeOf(path.join(box.etc, "expenses-manager.env")), "600");
  assert.equal(modeOf(path.join(box.etc, "deploy.conf")), "600");
  assert.equal(modeOf(path.join(box.etc, "allowed_signers")), "644");
  assert.equal(modeOf(path.join(box.opt, "bin/deploy-expenses-manager.sh")), "755");
  assert.ok(fs.existsSync(path.join(box.prefix, "etc/systemd/system/expenses-manager.service")));
  assert.equal(
    fs.readlinkSync(path.join(box.prefix, "usr/local/bin/deploy-expenses-manager")),
    "/opt/expenses-manager/bin/deploy-expenses-manager.sh"
  );
  assert.match(result.stdout, /sudo deploy-expenses-manager latest/);
});

test("the env file carries the secrets, origin and defaults", async () => {
  const box = newBox();
  assert.equal((await install(makeClone(), box)).status, 0);
  const env = read(path.join(box.etc, "expenses-manager.env"));
  assert.match(env, /^NODE_ENV=production$/m);
  assert.match(env, /^HOST=127\.0\.0\.1$/m);
  assert.match(env, /^PORT=45999$/m);
  assert.match(env, /^DATA_DIR=\/var\/lib\/expenses-manager\/data$/m);
  assert.match(env, /^CORS_ORIGIN=https:\/\/box\.tail1234\.ts\.net$/m);
  assert.match(env, /^TOKEN_SECRET="tok-secret"$/m);
  assert.match(env, /^ENCRYPTION_KEY="enc\\"key\\\\x"$/m);
});

test("the generated files cover every key in the shipped examples", async () => {
  const box = newBox();
  assert.equal((await install(makeClone(), box)).status, 0);
  const keysOf = (text) => [...text.matchAll(/^#?\s*([A-Z_]+)=/gm)].map((match) => match[1]);
  const generatedEnv = read(path.join(box.etc, "expenses-manager.env"));
  for (const key of keysOf(read(path.join(DEPLOY_DIR, "expenses-manager.env.example")))) {
    assert.match(generatedEnv, new RegExp(`^${key}=`, "m"), key);
  }
  const generatedConf = read(path.join(box.etc, "deploy.conf"));
  for (const key of keysOf(read(path.join(DEPLOY_DIR, "deploy.conf.example"))).filter((k) => k !== "GITHUB_TOKEN_FILE")) {
    assert.match(generatedConf, new RegExp(`^${key}=`, "m"), key);
  }
});

test("deploy.conf has the repo and retention defaults and no token line", async () => {
  const box = newBox();
  assert.equal((await install(makeClone(), box)).status, 0);
  const conf = read(path.join(box.etc, "deploy.conf"));
  assert.match(conf, /^GITHUB_REPO=rivasvict\/react-expenses-manager$/m);
  assert.match(conf, /^KEEP_RELEASES=5$/m);
  assert.match(conf, /^KEEP_BACKUPS=10$/m);
  assert.doesNotMatch(conf, /GITHUB_TOKEN_FILE/);
});

test("--github-token-file stores the token and wires it into deploy.conf", async () => {
  const box = newBox();
  const tokenFile = path.join(tmp("em-token-"), "t");
  fs.writeFileSync(tokenFile, "ghp_abc\n");
  const result = await install(makeClone(), box, { args: ["--github-token-file", tokenFile] });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(path.join(box.etc, "github-token")), "ghp_abc");
  assert.equal(modeOf(path.join(box.etc, "github-token")), "600");
  assert.match(read(path.join(box.etc, "deploy.conf")), /^GITHUB_TOKEN_FILE=\/etc\/expenses-manager\/github-token$/m);
});

test("it never enables the service at boot", async () => {
  const box = newBox();
  assert.equal((await install(makeClone(), box)).status, 0);
  const calls = box.calls();
  assert.ok(calls.includes("systemctl daemon-reload"));
  assert.ok(!calls.some((call) => /\benable\b/.test(call)));
});

test("re-running keeps existing env and conf, and says what it refreshed", async () => {
  const box = newBox();
  const clone = makeClone();
  assert.equal((await install(clone, box)).status, 0);

  const envFile = path.join(box.etc, "expenses-manager.env");
  const confFile = path.join(box.etc, "deploy.conf");
  fs.appendFileSync(envFile, "CUSTOM=1\n");
  fs.appendFileSync(confFile, "KEEP_RELEASES=7\n");
  const envBefore = read(envFile);
  const confBefore = read(confFile);

  // A different secret in the environment must not replace the stored one.
  const again = await install(clone, box, { env: { TOKEN_SECRET: "other", ENCRYPTION_KEY: "other" } });
  assert.equal(again.status, 0, again.stderr);
  assert.equal(read(envFile), envBefore);
  assert.equal(read(confFile), confBefore);
  assert.match(again.stdout, /Kept the existing .*expenses-manager\.env/);
  assert.match(again.stdout, /the deploy command is up to date/);
});

test("re-running refreshes the deployer and the signing key", async () => {
  const box = newBox();
  const clone = makeClone();
  assert.equal((await install(clone, box)).status, 0);
  fs.appendFileSync(path.join(clone, "deploy/deploy-expenses-manager.sh"), "\n# newer\n");
  fs.writeFileSync(path.join(clone, "deploy/allowed_signers"), makeSigningKey().allowedSigners);

  const again = await install(clone, box);
  assert.match(again.stdout, /Refreshed the deploy command/);
  assert.match(again.stdout, /Refreshed the release-signing key/);
  assert.equal(
    read(path.join(box.etc, "allowed_signers")),
    read(path.join(clone, "deploy/allowed_signers"))
  );
});

test("it refuses to install while allowed_signers is still the placeholder", async () => {
  const box = newBox();
  const result = await install(makeClone({ placeholder: true }), box);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /placeholder/);
  assert.ok(!fs.existsSync(path.join(box.etc, "expenses-manager.env")));
});

test("without secrets and without a terminal it stops instead of inventing them", async () => {
  const box = newBox();
  const result = await install(makeClone(), box, { env: { TOKEN_SECRET: "", ENCRYPTION_KEY: "" } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /rotating TOKEN_SECRET invalidates every issued/);
  assert.match(result.stderr, /no terminal to ask on/);
  assert.ok(!fs.existsSync(path.join(box.etc, "expenses-manager.env")));
});

test("legacy data is copied, not moved, into an empty target", async () => {
  const box = newBox();
  const clone = makeClone({ legacyData: { "users.json": '{"a":1}', "nested/party.json": "{}" } });
  const result = await install(clone, box);
  assert.equal(result.status, 0, result.stderr);

  assert.equal(read(path.join(box.var, "data/users.json")), '{"a":1}');
  assert.ok(fs.existsSync(path.join(box.var, "data/nested/party.json")));
  assert.ok(fs.existsSync(path.join(clone, "server/.data/users.json")), "the old copy is kept");
  assert.match(result.stdout, /old copy .* is kept/);
});

test("data migration never overwrites a non-empty target", async () => {
  const box = newBox();
  const clone = makeClone({ legacyData: { "users.json": "legacy" } });
  write(path.join(box.var, "data/users.json"), "precious");
  const result = await install(clone, box);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(path.join(box.var, "data/users.json")), "precious");
  assert.match(result.stderr, /NOT copied/);
});

test("--migrate-from reads the legacy data from another clone", async () => {
  const box = newBox();
  const legacyClone = makeClone({ legacyData: { "users.json": "from-elsewhere" } });
  const installClone = makeClone();
  const result = await install(installClone, box, { args: ["--migrate-from", legacyClone] });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(path.join(box.var, "data/users.json")), "from-elsewhere");
});

test("a second run does not migrate again once the target has data", async () => {
  const box = newBox();
  const clone = makeClone({ legacyData: { "users.json": "v1" } });
  assert.equal((await install(clone, box)).status, 0);
  fs.writeFileSync(path.join(box.var, "data/users.json"), "changed after migration");
  const again = await install(clone, box);
  assert.equal(read(path.join(box.var, "data/users.json")), "changed after migration");
  assert.match(again.stderr, /NOT copied/);
});
