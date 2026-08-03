// Unit tests for the server test runner (./testRunner.ts).
//
// These cover discovery and the empty-suite guard only. `runTests` is never
// exercised on a directory that contains test files, because that would spawn
// the whole suite recursively from inside itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findTestFiles, runTests } from "./testRunner";

// Builds a throwaway tree from a { relativePath: contents } map.
const withFixture = (
  files: Record<string, string>,
  check: (dir: string) => void
): void => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "test-runner-"));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const target = path.join(dir, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents);
    }
    check(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const relative = (dir: string, files: string[]): string[] =>
  files.map((file) => path.relative(dir, file).split(path.sep).join("/"));

test("findTestFiles picks up *.test.js and ignores everything else", () => {
  withFixture(
    {
      "handlers.test.js": "",
      "handlers.js": "",
      "notes.txt": "",
      "handlers.test.js.map": "",
      "testify.js": "",
    },
    (dir) => {
      assert.deepEqual(relative(dir, findTestFiles(dir)), ["handlers.test.js"]);
    }
  );
});

test("findTestFiles recurses into nested directories", () => {
  // The regression this runner exists for: a test file added in a directory
  // nobody remembered to list must still be discovered.
  withFixture(
    {
      "index.test.js": "",
      "core/router.test.js": "",
      "core/handlers/login.test.js": "",
      "core/handlers/deeply/nested/thing.test.js": "",
      "core/handlers/login.js": "",
    },
    (dir) => {
      assert.deepEqual(relative(dir, findTestFiles(dir)), [
        "core/handlers/deeply/nested/thing.test.js",
        "core/handlers/login.test.js",
        "core/router.test.js",
        "index.test.js",
      ]);
    }
  );
});

test("findTestFiles returns a stable, sorted order", () => {
  withFixture(
    { "z.test.js": "", "a.test.js": "", "m/b.test.js": "" },
    (dir) => {
      assert.deepEqual(relative(dir, findTestFiles(dir)), [
        "a.test.js",
        "m/b.test.js",
        "z.test.js",
      ]);
    }
  );
});

test("findTestFiles returns nothing for a directory that does not exist", () => {
  assert.deepEqual(findTestFiles(path.join(os.tmpdir(), "no-such-dir-here")), []);
});

test("runTests fails loudly when it discovers no test files", () => {
  // The whole point of the runner: an empty discovery must not exit 0, or a
  // suite that silently stopped being found would look like a passing build.
  withFixture({ "handlers.js": "" }, (dir) => {
    assert.equal(runTests(dir), 1);
  });
});

test("runTests fails when the build output is missing entirely", () => {
  assert.equal(runTests(path.join(os.tmpdir(), "no-such-dist-dir")), 1);
});
