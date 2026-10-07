// Tests for the release metadata helpers (./releaseInfo.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ReleaseCheckError,
  checkBump,
  checkChangelog,
  compareSemver,
  extractNotes,
  maxVersion,
  parseSemver,
  readVersion,
  run,
} from "./releaseInfo.mjs";

const SCRIPT = fileURLToPath(new URL("./releaseInfo.mjs", import.meta.url));

const CHANGELOG = `# Changelog

## [1.25.0] - 2026-10-07

### Added

- Newest thing.

## [1.24.0] - 2026-10-05

### Changed

- Middle thing.

## [1.23.0] - 2026-10-03

- Oldest thing.
`;

const makeRepo = ({
  version = "1.25.0",
  lockVersion = version,
  lockPackageVersion = lockVersion,
  changelog = CHANGELOG,
} = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-info-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version }));
  fs.writeFileSync(
    path.join(root, "package-lock.json"),
    JSON.stringify({
      version: lockVersion,
      packages: { "": { version: lockPackageVersion } },
    })
  );
  fs.writeFileSync(path.join(root, "CHANGELOG.md"), changelog);
  return root;
};

test("compareSemver orders greater, equal and lower versions", () => {
  assert.equal(compareSemver("1.25.0", "1.24.0"), 1);
  assert.equal(compareSemver("1.24.0", "1.25.0"), -1);
  assert.equal(compareSemver("1.24.0", "1.24.0"), 0);
  assert.equal(compareSemver("2.0.0", "1.99.99"), 1);
  assert.equal(compareSemver("1.10.0", "1.9.0"), 1, "numeric, not lexical");
});

test("compareSemver follows pre-release precedence", () => {
  const ascending = [
    "1.0.0-alpha",
    "1.0.0-alpha.1",
    "1.0.0-alpha.beta",
    "1.0.0-beta",
    "1.0.0-beta.2",
    "1.0.0-beta.11",
    "1.0.0-rc.1",
    "1.0.0",
  ];
  for (let index = 1; index < ascending.length; index += 1) {
    assert.equal(
      compareSemver(ascending[index], ascending[index - 1]),
      1,
      `${ascending[index]} > ${ascending[index - 1]}`
    );
  }
});

test("parseSemver rejects anything but MAJOR.MINOR.PATCH[-pre]", () => {
  for (const bad of ["1.2", "v1.2.3", "01.2.3", "1.2.3+build", "", "a.b.c"]) {
    assert.throws(() => parseSemver(bad), ReleaseCheckError, bad);
  }
});

test("readVersion returns the version when the lockfile agrees", () => {
  assert.equal(readVersion(makeRepo({ version: "1.25.0" })), "1.25.0");
});

test("readVersion fails when the lockfile disagrees at either level", () => {
  assert.throws(
    () => readVersion(makeRepo({ version: "1.25.0", lockVersion: "1.24.0" })),
    /package-lock\.json .* does not match package\.json \(1\.25\.0\)/
  );
  assert.throws(
    () =>
      readVersion(
        makeRepo({ version: "1.25.0", lockPackageVersion: "1.24.0" })
      ),
    /does not match/
  );
});

test("checkBump passes only for a strictly greater version", () => {
  const root = makeRepo({ version: "1.25.0" });
  assert.equal(checkBump({ root, baseVersion: "1.24.0" }), "1.25.0");
  assert.throws(
    () => checkBump({ root, baseVersion: "1.25.0" }),
    /must be greater than 1\.25\.0 \(master\)/
  );
  assert.throws(() => checkBump({ root, baseVersion: "1.26.0" }), /Bump/);
});

test("checkBump treats a pre-release as lower than its release", () => {
  const root = makeRepo({ version: "1.25.0-rc.1" });
  assert.throws(() => checkBump({ root, baseVersion: "1.25.0" }));
  assert.equal(checkBump({ root, baseVersion: "1.24.0" }), "1.25.0-rc.1");
});

test("checkChangelog accepts exactly one well-formed heading", () => {
  assert.equal(checkChangelog(makeRepo()), "1.25.0");
});

test("checkChangelog fails when the heading is missing", () => {
  const root = makeRepo({ version: "1.26.0" });
  assert.throws(() => checkChangelog(root), /no `## \[1\.26\.0\] - YYYY-MM-DD`/);
});

test("checkChangelog fails on a malformed heading", () => {
  for (const heading of [
    "## [1.25.0] 2026-10-07",
    "## [1.25.0] - 07/10/2026",
    "## [1.25.0] - 2026-10-07 (draft)",
    "### [1.25.0] - 2026-10-07",
    "## [1.25.01] - 2026-10-07",
  ]) {
    const root = makeRepo({ changelog: `# Changelog\n\n${heading}\n\n- x\n` });
    assert.throws(() => checkChangelog(root), /no `## \[1\.25\.0\]/, heading);
  }
});

test("checkChangelog does not let the dots match any character", () => {
  const root = makeRepo({
    changelog: "# Changelog\n\n## [1x25y0] - 2026-10-07\n",
  });
  assert.throws(() => checkChangelog(root));
});

test("checkChangelog fails on a duplicate heading", () => {
  const root = makeRepo({
    changelog: `${CHANGELOG}\n## [1.25.0] - 2026-10-08\n\n- again\n`,
  });
  assert.throws(() => checkChangelog(root), /2 `## \[1\.25\.0\]` headings/);
});

test("extractNotes returns the first section without its heading", () => {
  assert.equal(
    extractNotes(makeRepo({ version: "1.25.0" })),
    "### Added\n\n- Newest thing.\n"
  );
});

test("extractNotes returns a middle section only", () => {
  assert.equal(
    extractNotes(makeRepo({ version: "1.24.0" })),
    "### Changed\n\n- Middle thing.\n"
  );
});

test("extractNotes returns the last section to the end of the file", () => {
  assert.equal(
    extractNotes(makeRepo({ version: "1.23.0" })),
    "- Oldest thing.\n"
  );
});

test("maxVersion picks the highest valid version and skips junk", () => {
  assert.equal(
    maxVersion(["1.9.0", "1.24.0", "1.24.0-rc.1", "junk", "1.2", ""]),
    "1.24.0"
  );
  assert.equal(maxVersion(["junk"]), null);
  assert.equal(maxVersion([]), null);
});

test("run dispatches commands and rejects unknown ones", () => {
  const root = makeRepo();
  assert.equal(run(["version", "--root", root]), "1.25.0");
  assert.equal(run(["check-changelog", "--root", root]), "1.25.0");
  assert.equal(run(["max"], () => "1.0.0\n1.2.0\n"), "1.2.0");
  assert.throws(() => run(["nope"]), /Unknown command/);
  assert.throws(() => run(["check-bump", "--root", root]), /--base/);
});

test("the CLI exits non-zero with a one-line error on failure", () => {
  const root = makeRepo({ version: "1.26.0" });
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "check-changelog", "--root", root],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^error: CHANGELOG\.md has no/);
  assert.equal(result.stderr.trim().split("\n").length, 1);
});

test("the CLI compares against a base package.json", () => {
  const root = makeRepo({ version: "1.25.0" });
  const base = path.join(root, "base.json");
  fs.writeFileSync(base, JSON.stringify({ version: "1.24.0" }));
  const ok = spawnSync(
    process.execPath,
    [SCRIPT, "check-bump", "--root", root, "--base", base],
    { encoding: "utf8" }
  );
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout.trim(), "1.25.0");
});
