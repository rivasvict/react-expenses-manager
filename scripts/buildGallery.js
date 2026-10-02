#!/usr/bin/env node
// Regenerates docs/ui-gallery.html from every docs/<feature>/ui/ folder and
// fails (without writing) when a feature breaks the convention or a mockup
// breaks the design-system rules. Usage: npm run gallery:build

const fs = require("fs");
const path = require("path");
const { scanFeatures } = require("../src/uiGallery/scanFeatures");
const { checkMockups } = require("../src/uiGallery/mockupGuard");
const { buildGalleryHtml } = require("../src/uiGallery/galleryHtml");

const docsDir = path.resolve(__dirname, "../docs");
const galleryFile = path.join(docsDir, "ui-gallery.html");

const features = scanFeatures(docsDir);
const problems = [
  ...features.flatMap((feature) => feature.problems),
  ...checkMockups(docsDir, features),
];

if (problems.length > 0) {
  console.error(`UI gallery not built — ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

fs.writeFileSync(galleryFile, buildGalleryHtml(features));
console.log(`wrote docs/ui-gallery.html (${features.length} feature(s))`);
