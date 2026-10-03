// Judges and reports the design reviewer's comparisons (design/README.md):
// whether each screen of the built app matches its approved mockup, as a
// verdict, a Markdown summary and a side-by-side HTML page. Pure: it only
// formats results that scripts/designReview.js measured.
// CommonJS for the same reason as scanFeatures.js.

const formatPercent = (ratio) => `${(ratio * 100).toFixed(2)}%`;

const sizeText = (size) => `${size.width}×${size.height}`;

// `result` has `mockupSize`, `appSize` ({ width, height }) and `ratio` (the
// share of differing pixels). A screen passes when both sides render at the
// same size and the differing share is within `thresholdPercent`.
const judgeScreen = (result, thresholdPercent) => {
  if (
    result.mockupSize.width !== result.appSize.width ||
    result.mockupSize.height !== result.appSize.height
  ) {
    return {
      pass: false,
      reason: `size mismatch: mockup ${sizeText(result.mockupSize)}, app ${sizeText(result.appSize)}`,
    };
  }
  if (result.ratio * 100 > thresholdPercent) {
    return {
      pass: false,
      reason: `${formatPercent(result.ratio)} of pixels differ (allowed ${thresholdPercent}%)`,
    };
  }
  return {
    pass: true,
    reason: `${formatPercent(result.ratio)} of pixels differ`,
  };
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const summaryLine = (results) => {
  const failed = results.filter((result) => !result.pass).length;
  return failed === 0
    ? `All ${results.length} screen(s) match.`
    : `${failed} of ${results.length} screen(s) do not match.`;
};

const buildReportMarkdown = (slug, results, options) =>
  [
    `# Design review: ${slug}`,
    "",
    `${summaryLine(results)} Tolerance ${options.tolerance}/255 per channel, allowed ${options.thresholdPercent}% of pixels.`,
    "",
    "| Screen | Result | Detail |",
    "|---|---|---|",
    ...results.map(
      (result) =>
        `| ${result.id} | ${result.pass ? "✅ match" : "❌ differs"} | ${result.reason} |`
    ),
    "",
  ].join("\n");

// A screen that could not be captured has a reason but no images.
const renderImages = (files) =>
  files
    ? `
      <div class="rv-images">
        <figure><img src="${escapeHtml(files.mockup)}" alt="Approved mockup"><figcaption>Approved mockup</figcaption></figure>
        <figure><img src="${escapeHtml(files.app)}" alt="Built app"><figcaption>Built app</figcaption></figure>
        <figure><img src="${escapeHtml(files.diff)}" alt="Difference"><figcaption>Difference (magenta)</figcaption></figure>
      </div>`
    : "";

const renderRow = (result) => `
    <section class="rv-row">
      <h2>${escapeHtml(result.id)}
        <span class="rv-badge ${result.pass ? "rv-badge--pass" : "rv-badge--fail"}">${result.pass ? "match" : "differs"}</span></h2>
      <p class="mk-text-secondary">${escapeHtml(result.reason)}</p>${renderImages(result.files)}
    </section>`;

// The report lives in design/.review/<feature>/, two levels below design/.
const buildReportHtml = (slug, results, options) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design review — ${escapeHtml(slug)}</title>
  <link rel="stylesheet" href="../../system/tokens.css">
  <link rel="stylesheet" href="../../system/mockup.css">
  <style>
    .rv { max-width: 72rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .rv h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
    .rv-row { margin-top: 2rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-shell); }
    .rv-row h2 { margin: 0; font-size: 1.1rem; }
    .rv-badge { margin-left: 0.5rem; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: var(--radius-pill); }
    .rv-badge--pass { color: var(--income); background: var(--income-soft); }
    .rv-badge--fail { color: var(--danger); background: var(--danger-soft); }
    .rv-images { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; }
    .rv-images figure { margin: 0; }
    .rv-images img { display: block; max-width: 100%; border: 1px solid var(--border-strong); border-radius: var(--radius-control); }
    .rv-images figcaption { margin-top: 0.35rem; font-size: 0.8rem; color: var(--text-muted); }
  </style>
</head>
<body class="mk">
  <div class="rv">
    <h1>Design review — ${escapeHtml(slug)}</h1>
    <p class="mk-text-secondary">${escapeHtml(summaryLine(results))} Tolerance ${options.tolerance}/255 per channel, allowed ${options.thresholdPercent}% of pixels.</p>${results.map(renderRow).join("")}
  </div>
</body>
</html>
`;

module.exports = { buildReportHtml, buildReportMarkdown, judgeScreen };
