// Test entry point for the server suite (`npm run test:server`).
//
// Why this exists rather than a glob in package.json: `node --test` cannot be
// pointed at this tree portably. Node 18 expands a *directory* argument
// recursively but rejects glob patterns; Node 20+ does the reverse, treating
// positionals as globs and failing on a bare directory with "Cannot find
// module". CI pins Node 18 (.nvmrc) while local dev runs Node 22, so neither
// form works everywhere. Listing one glob per directory did work on both, but
// silently skipped every test in any directory nobody remembered to add — so
// this walks the compiled output instead and passes explicit file paths,
// which all supported versions accept.
//
// Dependency-free (node: builtins only), like the rest of server/.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TEST_FILE_SUFFIX = ".test.js";

// Every compiled test file under `dir`, recursively, sorted for a stable
// run order. Returns [] when `dir` does not exist (an unbuilt tree), leaving
// the caller to decide that is a failure.
export const findTestFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findTestFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(TEST_FILE_SUFFIX)
        ? [entryPath]
        : [];
    })
    .sort();
};

// Discovers and runs the suite, returning the exit code to surface.
export const runTests = (dir: string): number => {
  const files = findTestFiles(dir);

  // Discovering nothing is the failure this runner exists to prevent: a
  // green "0 tests" run looks identical to a passing suite in CI. Fail loudly
  // instead of exiting 0.
  if (files.length === 0) {
    console.error(
      `No compiled test files (*${TEST_FILE_SUFFIX}) found under ${dir}.`
    );
    console.error(
      "Refusing to report success — run `npm run build:server` first, or " +
        "check that the test files were emitted."
    );
    return 1;
  }

  console.log(`Running ${files.length} server test files with node --test`);
  const { status } = spawnSync(process.execPath, ["--test", ...files], {
    stdio: "inherit",
  });
  // A null status means the child was killed by a signal; treat as failure.
  return status ?? 1;
};

// Compiled to server/dist/testRunner.js, so __dirname is the output root.
if (require.main === module) process.exit(runTests(__dirname));
