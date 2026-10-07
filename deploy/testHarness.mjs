// Shared fixtures for the deploy script tests: a fake "box" rooted in a temp
// EM_PREFIX, stub systemctl/tailscale/journalctl that log their arguments,
// signed release archives, and a fake GitHub API + nodejs.org + app server
// that runs in a child process (the scripts under test are driven
// asynchronously, and spawnSync would starve an in-process server).
// Not a test file itself: node --test only picks up *.test.mjs here.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEPLOY_SCRIPT = path.join(HERE, "deploy-expenses-manager.sh");
export const INSTALL_SCRIPT = path.join(HERE, "install-expenses-manager.sh");
export const REPO = "owner/repo";
export const NODE_VERSION = "18.20.8";
export const ORIGIN_HOST = "https://box.tail1234.ts.net";

export const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
export const write = (file, content, mode) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, mode ? { mode } : undefined);
};
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout;
};
const sha256 = (file) =>
  run("sha256sum", [file]).split(" ")[0];

// --- signing ----------------------------------------------------------------

// A throwaway ed25519 key; never anything meant for production.
export const makeSigningKey = () => {
  const dir = tmp("em-key-");
  const key = path.join(dir, "key");
  run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "test", "-f", key]);
  const pub = fs.readFileSync(`${key}.pub`, "utf8").trim();
  return {
    key,
    allowedSigners: `expenses-manager-release namespaces="expenses-manager-release" ${pub}\n`,
  };
};

// --- releases ---------------------------------------------------------------

export const makeFakeNodeTarball = (dir, version = NODE_VERSION) => {
  const root = tmp("em-node-");
  const top = `node-v${version}-linux-x64`;
  write(
    path.join(root, top, "bin/node"),
    `#!/bin/sh\nif [ "$1" = "--version" ]; then echo v${version}; else exec ${process.execPath} "$@"; fi\n`,
    0o755
  );
  const file = path.join(dir, `${top}.tar.gz`);
  run("tar", ["-czf", file, "-C", root, top]);
  return { file, name: `${top}.tar.gz`, sha256: sha256(file) };
};

// Builds a signed release in `dir` and returns its asset paths.
//   tamper: "signature" signs with another key, "checksum" alters the tarball
//   after signing, "traversal" adds a ../ path, "symlink" adds a link.
export const buildRelease = ({
  dir,
  version,
  commit = "c".repeat(40),
  signingKey,
  node,
  tamper,
  nodeSha,
}) => {
  const top = `expenses-manager-${version}`;
  const stage = tmp("em-stage-");
  const root = path.join(stage, top);
  write(path.join(root, "build/index.html"), `<html>${version}</html>`);
  write(path.join(root, "build/version.json"), JSON.stringify({ version, commit }));
  write(path.join(root, "server/dist/index.js"), "// server");
  write(
    path.join(root, "deploy/deploy-expenses-manager.sh"),
    `#!/usr/bin/env bash\n# deployer shipped with ${version}\n`,
    0o755
  );
  write(
    path.join(root, "release.json"),
    JSON.stringify({
      name: "expenses-manager",
      version,
      commit,
      builtAt: "2026-10-07T00:00:00Z",
      node: {
        version: NODE_VERSION,
        "linux-x64": { file: node.name, sha256: nodeSha ?? node.sha256 },
        "linux-arm64": { file: "node-arm64.tar.gz", sha256: "d".repeat(64) },
      },
    })
  );
  if (tamper === "symlink") fs.symlinkSync("/etc/passwd", path.join(root, "evil"));

  fs.mkdirSync(dir, { recursive: true });
  const tarball = path.join(dir, `${top}.tar.gz`);
  const tarArgs = ["-czf", tarball, "-C", stage];
  if (tamper === "traversal") {
    tarArgs.push("--transform", `s,^${top}/build/version.json,${top}/../escaped.json,`);
  }
  run("tar", [...tarArgs, top]);

  const sums = path.join(dir, "SHA256SUMS");
  fs.writeFileSync(sums, `${sha256(tarball)}  ${top}.tar.gz\n`);
  const other = tamper === "signature" ? makeSigningKey().key : signingKey.key;
  fs.rmSync(`${sums}.sig`, { force: true });
  run("ssh-keygen", ["-Y", "sign", "-f", other, "-n", "expenses-manager-release", sums]);
  if (tamper === "checksum") fs.appendFileSync(tarball, "tampered");
  return { tarball, sums, sig: `${sums}.sig`, top };
};

// --- the box ----------------------------------------------------------------

export const makeBox = ({ signingKey, conf = "", env = "" } = {}) => {
  const prefix = tmp("em-box-");
  const bin = path.join(prefix, "stubs");
  const callsLog = path.join(prefix, "calls.log");
  const stub = (name, body) =>
    write(path.join(bin, name), `#!/bin/sh\necho "${name} $*" >> "${callsLog}"\n${body}\n`, 0o755);
  stub("systemctl", 'case "$1" in is-active) echo active;; esac; exit ${STUB_SYSTEMCTL_EXIT:-0}');
  stub(
    "tailscale",
    'case "$1 $2" in "serve --set-path=/"|"serve --set-path=/api") [ "$3" = off ] && exit ${STUB_TAILSCALE_OFF_EXIT:-0};; esac; ' +
      'if [ "$1" = status ]; then echo \'{"Self":{"DNSName":"box.tail1234.ts.net."}}\'; fi; exit 0'
  );
  stub("journalctl", 'echo "journal line"');

  const etc = path.join(prefix, "etc/expenses-manager");
  write(
    path.join(etc, "deploy.conf"),
    `GITHUB_REPO=${REPO}\nKEEP_RELEASES=5\nKEEP_BACKUPS=10\nPORT=4000\n${conf}`
  );
  write(path.join(etc, "expenses-manager.env"), `CORS_ORIGIN=${ORIGIN_HOST}\n${env}`);
  write(path.join(etc, "allowed_signers"), signingKey.allowedSigners);
  for (const dir of ["opt/expenses-manager/bin", "var/lib/expenses-manager/data", "var/lib/expenses-manager/backups"]) {
    fs.mkdirSync(path.join(prefix, dir), { recursive: true });
  }

  return {
    prefix,
    bin,
    callsLog,
    opt: path.join(prefix, "opt/expenses-manager"),
    etc,
    var: path.join(prefix, "var/lib/expenses-manager"),
    calls: () => (fs.existsSync(callsLog) ? fs.readFileSync(callsLog, "utf8").trim().split("\n") : []),
    current: () => {
      try {
        return path.basename(fs.readlinkSync(path.join(prefix, "opt/expenses-manager/current")));
      } catch {
        return null;
      }
    },
    previous: () => {
      try {
        return path.basename(fs.readlinkSync(path.join(prefix, "opt/expenses-manager/previous")));
      } catch {
        return null;
      }
    },
    releases: () => {
      const dir = path.join(prefix, "opt/expenses-manager/releases");
      return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
    },
  };
};

// --- fake server ------------------------------------------------------------

// Runs the server child process. `state` is a JSON file the test edits
// between runs; the server re-reads it on every request.
export const startFakeServer = async ({ prefix, stateFile }) => {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "--serve", prefix, stateFile], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const port = await new Promise((resolve, reject) => {
    child.stdout.once("data", (data) => resolve(Number(String(data).trim())));
    child.once("error", reject);
    child.once("exit", () => reject(new Error("fake server exited early")));
  });
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    stop: () => child.kill(),
  };
};

// Ids only need to be unique and stable across requests.
const assetId = (state, tag, name) =>
  1000 +
  Object.entries(state.releases)
    .flatMap(([releaseTag, release]) => Object.keys(release).map((assetName) => `${releaseTag}|${assetName}`))
    .indexOf(`${tag}|${name}`);

const serve = (prefix, stateFile) => {
  const readState = () => JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const logFile = `${stateFile}.requests`;
  const send = (response, status, body, type = "application/json") => {
    response.writeHead(status, { "Content-Type": type });
    response.end(body);
  };
  const currentDir = () => {
    try {
      return fs.realpathSync(path.join(prefix, "opt/expenses-manager/current"));
    } catch {
      return null;
    }
  };

  const server = http.createServer((request, response) => {
    const state = readState();
    fs.appendFileSync(
      logFile,
      `${JSON.stringify({ url: request.url, authorization: request.headers.authorization ?? null })}\n`
    );
    const { url } = request;

    if (url === "/api/health") {
      const dir = currentDir();
      const version = dir ? path.basename(dir) : null;
      const healthy = state.healthy === null || state.healthy === undefined || state.healthy.includes(version);
      return send(response, dir && healthy ? 200 : 503, '{"status":"ok"}');
    }
    if (url === "/version.json") {
      const dir = currentDir();
      return dir
        ? send(response, 200, fs.readFileSync(path.join(dir, "build/version.json")))
        : send(response, 404, "{}");
    }

    const apiMatch = url.match(/^\/repos\/owner\/repo\/releases\/(latest|tags\/(.+))$/);
    if (apiMatch) {
      if (state.apiStatus) return send(response, state.apiStatus, '{"message":"nope"}');
      const tag = apiMatch[1] === "latest" ? state.latest : apiMatch[2];
      const release = state.releases[tag];
      if (!release) return send(response, 404, '{"message":"Not Found"}');
      const assets = Object.keys(release).map((name) => ({
        name,
        id: assetId(state, tag, name),
      }));
      return send(response, 200, JSON.stringify({ tag_name: tag, assets }));
    }

    const assetMatch = url.match(/^\/repos\/owner\/repo\/releases\/assets\/(\d+)$/);
    if (assetMatch) {
      for (const [tag, release] of Object.entries(state.releases)) {
        for (const [name, file] of Object.entries(release)) {
          if (String(assetId(state, tag, name)) === assetMatch[1]) {
            return send(response, 200, fs.readFileSync(file), "application/octet-stream");
          }
        }
      }
      return send(response, 404, "{}");
    }

    const nodeMatch = url.match(/^\/dist\/v([\d.]+)\/(.+)$/);
    if (nodeMatch && state.nodeFiles?.[nodeMatch[2]]) {
      return send(response, 200, fs.readFileSync(state.nodeFiles[nodeMatch[2]]), "application/octet-stream");
    }
    return send(response, 404, "{}");
  });
  server.listen(0, "127.0.0.1", () => {
    process.stdout.write(`${server.address().port}\n`);
  });
};

if (process.argv[2] === "--serve") serve(process.argv[3], process.argv[4]);

// --- running the scripts ----------------------------------------------------

export const runScript = (script, args, { env = {}, cwd, input } = {}) =>
  new Promise((resolve) => {
    const child = spawn("bash", [script, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
    child.stdin.end(input ?? "");
  });

// Environment that points the deployer at a box and a fake server.
export const deployEnv = (box, server, extra = {}) => ({
  EM_PREFIX: box.prefix,
  EM_SKIP_ROOT_CHECK: "1",
  EM_GITHUB_API: server.url,
  EM_NODE_DIST: `${server.url}/dist`,
  EM_SYSTEMCTL: path.join(box.bin, "systemctl"),
  EM_TAILSCALE: path.join(box.bin, "tailscale"),
  EM_JOURNALCTL: path.join(box.bin, "journalctl"),
  EM_CURL_BASE: server.url,
  EM_UNAME_M: "x86_64",
  EM_HEALTH_TIMEOUT: "2",
  PORT: String(server.port),
  ...extra,
});

// A complete test world: box, fake server, a signed release factory.
export const makeWorld = async ({ conf = "" } = {}) => {
  const signingKey = makeSigningKey();
  const box = makeBox({ signingKey, conf });
  const assets = tmp("em-assets-");
  const node = makeFakeNodeTarball(assets);
  const stateFile = path.join(tmp("em-state-"), "state.json");
  const state = {
    latest: null,
    releases: {},
    nodeFiles: { [node.name]: node.file },
    healthy: null,
    apiStatus: null,
  };
  const save = () => fs.writeFileSync(stateFile, JSON.stringify(state));
  save();

  // The box's deploy.conf must name the fake server's port.
  const server = await startFakeServer({ prefix: box.prefix, stateFile });
  fs.writeFileSync(
    path.join(box.etc, "deploy.conf"),
    `${fs.readFileSync(path.join(box.etc, "deploy.conf"), "utf8").replace("PORT=4000", `PORT=${server.port}`)}`
  );

  return {
    box,
    server,
    signingKey,
    node,
    state,
    save,
    requests: () =>
      fs.existsSync(`${stateFile}.requests`)
        ? fs.readFileSync(`${stateFile}.requests`, "utf8").trim().split("\n").map((line) => JSON.parse(line))
        : [],
    publish: (version, options = {}) => {
      const built = buildRelease({
        dir: path.join(assets, version),
        version,
        signingKey,
        node,
        ...options,
      });
      state.releases[`v${version}`] = {
        [`${built.top}.tar.gz`]: built.tarball,
        SHA256SUMS: built.sums,
        "SHA256SUMS.sig": built.sig,
      };
      state.latest = `v${version}`;
      save();
      return built;
    },
    deploy: (args = [], extra = {}) =>
      runScript(DEPLOY_SCRIPT, args, { env: deployEnv(box, server, extra) }),
    stop: () => server.stop(),
  };
};
