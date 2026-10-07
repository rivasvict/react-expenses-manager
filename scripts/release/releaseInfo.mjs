#!/usr/bin/env node
// Release metadata helpers: read the app version, compare it against another
// version, check the CHANGELOG entry and extract it for the release notes.
// Dependency-free Node ESM, used by the Release readiness check and the
// release workflow (docs/deployment/releases.md) and importable by tests.
//
// CLI:  node scripts/release/releaseInfo.mjs <command> [options]
//   version                          print package.json's version
//   check-bump --base <package.json> fail unless version > the base's version
//   check-bump --base-version <x.y.z> same, against a bare version string
//   check-changelog                  fail unless CHANGELOG.md has the entry
//   notes                            print the version's changelog section
//   max                              print the highest version read from stdin
// Every command takes --root <dir> (default: the current directory).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class ReleaseCheckError extends Error {}

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export const parseSemver = (version) => {
  const match = SEMVER.exec(String(version).trim());
  if (!match) {
    throw new ReleaseCheckError(
      `"${version}" is not a valid version: use MAJOR.MINOR.PATCH, optionally with a -prerelease suffix (e.g. 1.25.0 or 1.25.0-rc.1).`
    );
  }
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] === undefined ? [] : match[4].split("."),
  };
};

const comparePrereleaseId = (a, b) => {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b));
  if (aNumeric) return -1; // numeric identifiers sort below alphanumeric
  if (bNumeric) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

// Returns -1, 0 or 1 following semver precedence (a release outranks its own
// pre-releases; pre-release identifiers compare field by field).
export const compareSemver = (left, right) => {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) {
      return a.core[index] < b.core[index] ? -1 : 1;
    }
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  const shared = Math.min(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < shared; index += 1) {
    const result = comparePrereleaseId(a.prerelease[index], b.prerelease[index]);
    if (result !== 0) return result;
  }
  return Math.sign(a.prerelease.length - b.prerelease.length);
};

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new ReleaseCheckError(`Could not read ${file}: ${error.message}`);
  }
};

// package.json's version, after making sure package-lock.json agrees: a
// lockfile left behind makes `npm ci` builds report a different version.
export const readVersion = (root = ".") => {
  const { version } = readJson(path.join(root, "package.json"));
  parseSemver(version);
  const lock = readJson(path.join(root, "package-lock.json"));
  const lockVersions = [lock.version, lock.packages?.[""]?.version];
  if (lockVersions.some((lockVersion) => lockVersion !== version)) {
    throw new ReleaseCheckError(
      `package-lock.json (${lockVersions.join(" / ")}) does not match package.json (${version}). Run \`npm version --no-git-tag-version ${version}\` to resync them.`
    );
  }
  return version;
};

export const checkBump = ({ root = ".", baseVersion, baseLabel = "master" }) => {
  const version = readVersion(root);
  if (compareSemver(version, baseVersion) <= 0) {
    throw new ReleaseCheckError(
      `Version ${version} must be greater than ${baseVersion} (${baseLabel}). Bump \`version\` in package.json and package-lock.json above ${baseVersion} (\`npm version --no-git-tag-version <x.y.z>\`), then add \`## [x.y.z] - YYYY-MM-DD\` to CHANGELOG.md.`
    );
  }
  return version;
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const changelogLines = (root) =>
  fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8").split(/\r?\n/);

const headingIndexes = (lines, version) => {
  const heading = new RegExp(
    `^## \\[${escapeRegExp(version)}\\] - \\d{4}-\\d{2}-\\d{2}$`
  );
  return lines.flatMap((line, index) => (heading.test(line) ? [index] : []));
};

export const checkChangelog = (root = ".") => {
  const version = readVersion(root);
  const found = headingIndexes(changelogLines(root), version);
  if (found.length === 0) {
    throw new ReleaseCheckError(
      `CHANGELOG.md has no \`## [${version}] - YYYY-MM-DD\` heading. Add one (Keep a Changelog format, ISO date) for the version in package.json.`
    );
  }
  if (found.length > 1) {
    throw new ReleaseCheckError(
      `CHANGELOG.md has ${found.length} \`## [${version}]\` headings. Keep exactly one entry per version.`
    );
  }
  return version;
};

// The body of the version's section, up to the next `## [` heading, trimmed.
export const extractNotes = (root = ".") => {
  const version = checkChangelog(root);
  const lines = changelogLines(root);
  const [start] = headingIndexes(lines, version);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## ["));
  return `${(end === -1 ? rest : rest.slice(0, end)).join("\n").trim()}\n`;
};

// Highest valid version in the list; entries that are not versions are
// ignored (stray tags such as `v1.2` must not break a release).
export const maxVersion = (versions) =>
  versions
    .map((version) => version.trim())
    .filter((version) => SEMVER.test(version))
    .reduce(
      (highest, version) =>
        highest === null || compareSemver(version, highest) > 0
          ? version
          : highest,
      null
    );

const parseOptions = (args) => {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (!flag.startsWith("--") || args[index + 1] === undefined) {
      throw new ReleaseCheckError(`Unexpected argument "${flag}".`);
    }
    options[flag.slice(2)] = args[index + 1];
  }
  return options;
};

export const run = (argv, stdin = () => fs.readFileSync(0, "utf8")) => {
  const [command, ...rest] = argv;
  const options = parseOptions(rest);
  const root = options.root ?? ".";
  switch (command) {
    case "version":
      return readVersion(root);
    case "check-bump": {
      if (options.base) {
        const { version: baseVersion } = readJson(options.base);
        return checkBump({ root, baseVersion });
      }
      if (options["base-version"]) {
        return checkBump({
          root,
          baseVersion: options["base-version"],
          baseLabel: "latest release",
        });
      }
      throw new ReleaseCheckError(
        "check-bump needs --base <package.json> or --base-version <x.y.z>."
      );
    }
    case "check-changelog":
      return checkChangelog(root);
    case "notes":
      return extractNotes(root).trimEnd();
    case "max":
      return maxVersion(stdin().split(/\r?\n/)) ?? "";
    default:
      throw new ReleaseCheckError(
        `Unknown command "${command ?? ""}". Use: version, check-bump, check-changelog, notes, max.`
      );
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(run(process.argv.slice(2)));
  } catch (error) {
    if (!(error instanceof ReleaseCheckError)) throw error;
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
