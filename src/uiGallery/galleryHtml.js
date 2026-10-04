// Renders the scanned features into design/gallery.html: one self-contained
// page that shows every feature's UI options and approved screens, with a
// status filter and a phone/desktop switch (design/README.md). It styles
// itself with the design-system tokens only, like the mockups it shows.
// CommonJS for the same reason as scanFeatures.js.

const GENERATED_NOTICE =
  "GENERATED from design/features/*/ui/ by `npm run gallery:build` — do not edit.";

const STATUS_LABELS = {
  exploring: "Exploring",
  approved: "Approved",
  implemented: "Implemented",
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Paths are relative to docs/, where the gallery lives.
const href = (relativePath) =>
  escapeHtml(relativePath.split("/").map(encodeURIComponent).join("/"));

const renderFrame = (screenPath, caption) => `
        <figure class="frame">
          <a class="frame__link" href="${href(screenPath)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(caption)} full size">
            <div class="frame__viewport">
              <iframe src="${href(screenPath)}" title="${escapeHtml(caption)}" loading="lazy" tabindex="-1"></iframe>
            </div>
          </a>
          <figcaption>${escapeHtml(caption)}</figcaption>
        </figure>`;

const renderApproved = (feature) =>
  feature.approved.length === 0
    ? ""
    : `
      <h3>Approved screens</h3>
      <div class="frames">${feature.approved
        .map((screen) =>
          renderFrame(screen.path, `${screen.screen} · ${screen.state}`)
        )
        .join("")}
      </div>`;

const renderOption = (feature, option) => `
        <div class="option">
          <h4>${escapeHtml(option.id)}${
            option.id === feature.chosen
              ? ' <span class="badge badge--approved">Chosen</span>'
              : ""
          }</h4>
          <div class="frames">${option.screens
            .map((screen) =>
              renderFrame(screen.path, `${option.id} · ${screen.name}`)
            )
            .join("")}
          </div>
        </div>`;

const renderOptions = (feature) =>
  feature.options.length === 0
    ? ""
    : `
      <details class="options"${feature.status === "exploring" ? " open" : ""}>
        <summary>Options (${feature.options.length})</summary>${feature.options
          .map((option) => renderOption(feature, option))
          .join("")}
      </details>`;

const renderLinks = (feature) => {
  const links = [
    [feature.briefPath, "Brief"],
    [feature.flowPath, "Flow"],
    [feature.decisionPath, "Decision"],
    [feature.fixturesPath, "Fixtures"],
  ].filter(([target]) => target);
  return links.length === 0
    ? ""
    : `
      <nav class="links" aria-label="${escapeHtml(feature.title)} documents">${links
        .map(
          ([target, label]) =>
            `<a href="${href(target)}" target="_blank" rel="noopener">${label}</a>`
        )
        .join("")}</nav>`;
};

const renderFeature = (feature) => `
    <section class="feature" id="feature-${escapeHtml(feature.slug)}" data-status="${escapeHtml(feature.status || "exploring")}">
      <header class="feature__head">
        <h2>${escapeHtml(feature.title)}</h2>
        <span class="badge badge--${escapeHtml(feature.status || "exploring")}">${escapeHtml(STATUS_LABELS[feature.status] || "Unknown")}</span>${
          feature.example
            ? '\n        <span class="badge badge--example">Example</span>'
            : ""
        }
      </header>${
        feature.summary
          ? `\n      <p class="summary">${escapeHtml(feature.summary)}</p>`
          : ""
      }${renderLinks(feature)}${renderApproved(feature)}${renderOptions(feature)}
    </section>`;

const STYLE = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      --fw: 375px; --fh: 720px; --scale: 0.62;
      margin: 0; padding: 0 1rem 4rem;
      font-family: var(--font-sans); font-feature-settings: "tnum";
      background: var(--bg-page); color: var(--text-primary); line-height: 1.5;
    }
    body[data-viewport="desktop"] { --fw: 1280px; --fh: 800px; --scale: 0.3; }
    .page { max-width: 72rem; margin: 0 auto; }
    .top { padding: 2.5rem 0 1rem; }
    .top h1 { margin: 0 0 0.4rem; font-size: 1.7rem; letter-spacing: -0.01em; }
    .top p { margin: 0; max-width: 60ch; color: var(--text-secondary); }
    .controls {
      display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;
      margin: 1.25rem 0 0.5rem;
    }
    .controls label { color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; }
    select, button {
      font: inherit; color: var(--text-primary); background: var(--bg-raised);
      border: 1px solid var(--border-strong); border-radius: var(--radius-control);
      padding: 0.4rem 0.75rem;
    }
    button { cursor: pointer; }
    button[aria-pressed="true"] {
      color: var(--accent); background: var(--accent-soft); border-color: var(--accent);
    }
    .empty { color: var(--text-secondary); padding: 2rem 0; }
    .feature {
      margin-top: 1.5rem; padding: 1.25rem; background: var(--bg-surface);
      border: 1px solid var(--border-subtle); border-radius: var(--radius-shell);
      box-shadow: var(--shadow-card);
    }
    .feature[hidden] { display: none; }
    .feature__head { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; }
    .feature h2 { margin: 0; font-size: 1.25rem; letter-spacing: -0.01em; }
    .feature h3 {
      margin: 1.25rem 0 0.5rem; font-size: 0.78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);
    }
    .feature h4 { margin: 0 0 0.5rem; font-size: 0.95rem; }
    .summary { margin: 0.5rem 0 0; color: var(--text-secondary); max-width: 70ch; }
    .links { display: flex; gap: 1rem; margin-top: 0.6rem; font-size: 0.9rem; }
    .links a { color: var(--accent); }
    .badge {
      font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem;
      border-radius: var(--radius-pill); border: 1px solid var(--border-strong);
      color: var(--text-secondary);
    }
    .badge--approved, .badge--implemented {
      color: var(--income); background: var(--income-soft); border-color: transparent;
    }
    .badge--exploring { color: var(--warning); border-color: var(--warning); }
    .badge--example { color: var(--text-muted); }
    .options { margin-top: 1.25rem; }
    .options summary { cursor: pointer; font-weight: 600; color: var(--text-secondary); }
    .option { margin-top: 1rem; }
    .frames { display: flex; flex-wrap: wrap; gap: 1rem; }
    .frame { margin: 0; }
    .frame__link { display: block; color: inherit; text-decoration: none; }
    .frame__viewport {
      width: calc(var(--fw) * var(--scale)); height: calc(var(--fh) * var(--scale));
      overflow: hidden; border: 1px solid var(--border-strong);
      border-radius: var(--radius-card); background: var(--bg-page);
    }
    .frame__link:hover .frame__viewport,
    .frame__link:focus-visible .frame__viewport { border-color: var(--accent); }
    iframe {
      width: var(--fw); height: var(--fh); border: 0; pointer-events: none;
      transform: scale(var(--scale)); transform-origin: 0 0;
    }
    figcaption { margin-top: 0.35rem; font-size: 0.8rem; color: var(--text-muted); }
`;

const SCRIPT = `
    (() => {
      const status = document.getElementById("status");
      const apply = () =>
        document.querySelectorAll(".feature").forEach((feature) => {
          feature.hidden =
            status.value !== "all" && feature.dataset.status !== status.value;
        });
      status.addEventListener("change", apply);
      document.querySelectorAll("[data-viewport]").forEach((button) => {
        if (button.tagName !== "BUTTON") return;
        button.addEventListener("click", () => {
          document.body.dataset.viewport = button.dataset.viewport;
          document.querySelectorAll("button[data-viewport]").forEach((other) =>
            other.setAttribute("aria-pressed", String(other === button))
          );
        });
      });
    })();
`;

const buildGalleryHtml = (features) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UI gallery</title>
  <!-- ${GENERATED_NOTICE} -->
  <link rel="stylesheet" href="system/tokens.css">
  <style>${STYLE}  </style>
</head>
<body data-viewport="phone">
  <div class="page">
    <header class="top">
      <h1>UI gallery</h1>
      <p>Every feature's UI options and approved screens, straight from <code>design/features/&lt;feature&gt;/ui/</code>. Click a screen to open it full size.</p>
      <div class="controls">
        <label>Status
          <select id="status">
            <option value="all">All</option>
            <option value="exploring">Exploring</option>
            <option value="approved">Approved</option>
            <option value="implemented">Implemented</option>
          </select>
        </label>
        <div role="group" aria-label="Viewport">
          <button type="button" data-viewport="phone" aria-pressed="true">Phone 375</button>
          <button type="button" data-viewport="desktop" aria-pressed="false">Desktop 1280</button>
        </div>
      </div>
    </header>
    <main>${
      features.length === 0
        ? '\n      <p class="empty">No features have a ui/ folder yet.</p>'
        : features.map(renderFeature).join("")
    }
    </main>
  </div>
  <script>${SCRIPT}  </script>
</body>
</html>
`;

module.exports = { buildGalleryHtml };
