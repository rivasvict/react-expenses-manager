#!/usr/bin/env node
// Regenerates design/gallery.html and every feature's ui/flow.html (from its
// flow.json) from the design/features/<feature>/ui/ folders, and fails
// (without writing) when a feature breaks the convention or a mockup breaks
// the design-system rules. Usage: npm run gallery:build

const fs = require("fs");
const path = require("path");
const { scanFeatures } = require("../src/uiGallery/scanFeatures");
const { checkMockups } = require("../src/uiGallery/mockupGuard");
const {
  checkGeneratedFlows,
  generatedFiles,
} = require("../src/uiGallery/generate");

const designDir = path.resolve(__dirname, "../design");

const features = scanFeatures(designDir);
const files = generatedFiles(features);
const problems = [
  ...features.flatMap((feature) => feature.problems),
  ...checkMockups(designDir, features),
  ...checkGeneratedFlows(files),
];

if (problems.length > 0) {
  console.error(`UI gallery not built — ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

Object.entries(files).forEach(([relativePath, content]) => {
  fs.writeFileSync(path.join(designDir, relativePath), content);
  console.log(`wrote design/${relativePath}`);
});
