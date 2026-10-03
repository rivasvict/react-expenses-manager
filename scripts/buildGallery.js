#!/usr/bin/env node
// Regenerates design/gallery.html from every design/features/<feature>/ui/ folder and
// fails (without writing) when a feature breaks the convention or a mockup
// breaks the design-system rules. Usage: npm run gallery:build

const fs = require("fs");
const path = require("path");
const { scanFeatures } = require("../src/uiGallery/scanFeatures");
const { checkMockups } = require("../src/uiGallery/mockupGuard");
const { buildGalleryHtml } = require("../src/uiGallery/galleryHtml");

const designDir = path.resolve(__dirname, "../design");
const galleryFile = path.join(designDir, "gallery.html");

const features = scanFeatures(designDir);
const problems = [
  ...features.flatMap((feature) => feature.problems),
  ...checkMockups(designDir, features),
];

if (problems.length > 0) {
  console.error(`UI gallery not built — ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

fs.writeFileSync(galleryFile, buildGalleryHtml(features));
console.log(`wrote design/gallery.html (${features.length} feature(s))`);
