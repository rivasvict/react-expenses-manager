// Unit tests for the environment-derived configuration (./config.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolveDataDir } from "./config";

const DEFAULT_DIR = path.join("/srv", "app", ".data");

test("resolveDataDir keeps the default when DATA_DIR is unset", () => {
  assert.equal(resolveDataDir({}, DEFAULT_DIR), DEFAULT_DIR);
});

test("resolveDataDir treats an empty or blank DATA_DIR as unset", () => {
  assert.equal(resolveDataDir({ DATA_DIR: "" }, DEFAULT_DIR), DEFAULT_DIR);
  assert.equal(resolveDataDir({ DATA_DIR: "   " }, DEFAULT_DIR), DEFAULT_DIR);
});

test("resolveDataDir uses an absolute DATA_DIR as given", () => {
  assert.equal(
    resolveDataDir({ DATA_DIR: "/var/lib/expenses-manager/data" }, DEFAULT_DIR),
    "/var/lib/expenses-manager/data"
  );
});

test("resolveDataDir resolves a relative DATA_DIR against the working directory", () => {
  assert.equal(
    resolveDataDir({ DATA_DIR: "data" }, DEFAULT_DIR),
    path.resolve(process.cwd(), "data")
  );
});
