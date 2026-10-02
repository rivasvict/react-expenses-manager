// Keeps UI mockups honest about the design system (docs/ui-workflow.md): a
// mockup must take its look from docs/design-system/tokens.css, never from
// literal colors, and must be self-contained (no CDN scripts or fonts) so it
// renders the same everywhere, including offline and in the sandbox.
// CommonJS for the same reason as scanFeatures.js.

const fs = require("fs");
const path = require("path");

const TOKENS_LINK = "design-system/tokens.css";

const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(\s*[\d.]/;
const PAINT_ATTRIBUTE =
  /\b(?:fill|stroke|stop-color|flood-color)\s*=\s*["'](?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl)a?\()/;
const EXTERNAL_RESOURCE =
  /<(?:script|link|img|iframe|source)\b[^>]*\b(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i;
const EXTERNAL_URL = /url\(\s*["']?\s*(?:https?:)?\/\//i;

// The text of every <style> block and every style="" attribute.
const cssTexts = (html) => [
  ...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]),
  ...[...html.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/\bstyle\s*=\s*'([^']*)'/gi)].map((m) => m[1]),
];

// Returns human-readable problems for one mockup's HTML source.
const findMockupProblems = (html) => {
  const problems = [];
  if (!html.includes(TOKENS_LINK)) {
    problems.push(`does not link ${TOKENS_LINK}.`);
  }
  if (cssTexts(html).some((css) => LITERAL_COLOR.test(css))) {
    problems.push(
      "uses a literal color in CSS; use a var(--token) from tokens.css."
    );
  }
  if (PAINT_ATTRIBUTE.test(html)) {
    problems.push(
      'uses a literal color in an SVG attribute; use style="fill: var(--token)".'
    );
  }
  if (EXTERNAL_RESOURCE.test(html) || EXTERNAL_URL.test(html)) {
    problems.push(
      "loads an external resource; mockups must be self-contained."
    );
  }
  return problems;
};

// Checks every mockup of every feature, reading files under `docsDir`.
const checkMockups = (docsDir, features) =>
  features.flatMap((feature) =>
    feature.mockupPaths.flatMap((mockupPath) =>
      findMockupProblems(
        fs.readFileSync(path.join(docsDir, mockupPath), "utf8")
      ).map((problem) => `${mockupPath} ${problem}`)
    )
  );

module.exports = { findMockupProblems, checkMockups };
