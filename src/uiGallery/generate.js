// Every file `npm run gallery:build` generates, keyed by its path relative to
// `design/`: the gallery page and one flow page per feature that has a
// `flow.json` (design/README.md). Shared by the build script and by the test
// that fails when a committed file is stale.
// CommonJS for the same reason as scanFeatures.js.

const { buildFlowHtml } = require("./flowHtml");
const { buildGalleryHtml } = require("./galleryHtml");
const { findMockupProblems } = require("./mockupGuard");

const withGeneratedFlow = (features) =>
  features.filter((feature) => feature.flowGenerated && feature.flow);

const generatedFiles = (features) => ({
  "gallery.html": buildGalleryHtml(features),
  ...Object.fromEntries(
    withGeneratedFlow(features).map((feature) => [
      feature.flowPath,
      buildFlowHtml(feature),
    ])
  ),
});

// Generated flow pages follow the same mockup rules as hand-written ones.
const checkGeneratedFlows = (files) =>
  Object.entries(files)
    .filter(([relativePath]) => relativePath !== "gallery.html")
    .flatMap(([relativePath, html]) =>
      findMockupProblems(html).map((problem) => `${relativePath} ${problem}`)
    );

module.exports = { generatedFiles, checkGeneratedFlows };
