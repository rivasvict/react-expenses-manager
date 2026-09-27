#!/usr/bin/env node
// Regenerates every file derived from src/styles/tokens.json.
// Usage: npm run tokens:build

const fs = require("fs");
const path = require("path");
const { buildOutputs } = require("../src/styles/tokenFormats");
const tokens = require("../src/styles/tokens.json");

const repoRoot = path.resolve(__dirname, "..");

Object.entries(buildOutputs(tokens)).forEach(([relativePath, content]) => {
  const target = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log(`wrote ${relativePath}`);
});
