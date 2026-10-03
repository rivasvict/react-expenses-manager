// Renders a feature's flow (see flow.js) into `ui/flow.html`: a walkthrough
// where you click a transition to move to the next screen, and an overview of
// every screen with where it leads (design/README.md). Self-contained and
// styled with the design tokens only, like every mockup.
// CommonJS for the same reason as scanFeatures.js.

const { orderScreens } = require("./flow");

const GENERATED_NOTICE =
  "GENERATED from flow.json by `npm run gallery:build` — do not edit.";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// The flow page lives in `ui/`, the approved screens in `ui/approved/`.
const relativeScreenPath = (screenPath) =>
  screenPath.slice(screenPath.indexOf("/approved/") + 1);

const hrefTo = (screenPath) =>
  escapeHtml(
    relativeScreenPath(screenPath).split("/").map(encodeURIComponent).join("/")
  );

const labelsFrom = (flow, screenId) =>
  flow.transitions.filter((transition) => transition.from === screenId);

const titleOf = (flow, screenId) =>
  flow.screens.find((screen) => screen.id === screenId).title;

const renderThumb = (screen) =>
  screen.external
    ? `<div class="fl-thumb fl-thumb--external"><span>Existing screen<br>not designed here</span></div>`
    : `<div class="fl-thumb"><iframe src="${hrefTo(screen.path)}" title="${escapeHtml(screen.title)}" tabindex="-1"></iframe></div>`;

const renderStep = (flow, screen, index) => {
  const outgoing = labelsFrom(flow, screen.id);
  return `
        <li class="fl-step">
          <span class="fl-step__index">${index + 1}</span>
          ${renderThumb(screen)}
          <h3>${escapeHtml(screen.title)}</h3>
          ${screen.route ? `<p class="fl-route">${escapeHtml(screen.route)}</p>` : ""}
          ${
            outgoing.length === 0
              ? '<p class="mk-text-muted">End of this flow</p>'
              : `<ul class="fl-leads">${outgoing
                  .map(
                    (transition) =>
                      `<li><span class="mk-text-secondary">${escapeHtml(transition.label)}</span> → ${escapeHtml(titleOf(flow, transition.to))}</li>`
                  )
                  .join("")}</ul>`
          }
        </li>`;
};

const STYLE = `
    .fl { max-width: 72rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .fl h1 { margin: 0 0 0.25rem; font-size: 1.5rem; letter-spacing: -0.01em; }
    .fl h2 {
      margin: 2rem 0 0.75rem; font-size: 0.78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);
    }
    .fl-lead { margin: 0; color: var(--text-secondary); }
    .fl-walk { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
    .fl-stage {
      width: 375px; height: 720px; flex: 0 0 auto; overflow: hidden;
      border: 1px solid var(--border-strong); border-radius: var(--radius-card);
      background: var(--bg-page); position: relative;
    }
    .fl-stage iframe { width: 375px; height: 720px; border: 0; }
    .fl-stage [hidden] { display: none; }
    .fl-stage__external {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      padding: 2rem; text-align: center; color: var(--text-secondary);
    }
    .fl-panel { flex: 1 1 18rem; max-width: 26rem; }
    .fl-panel h3 { margin: 0 0 0.25rem; font-size: 1.15rem; }
    .fl-eyebrow {
      margin: 1.25rem 0 0.5rem; font-size: 0.78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);
    }
    .fl-route { margin: 0; font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); }
    .fl-next { display: flex; flex-direction: column; gap: 0.5rem; }
    .fl-controls { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
    .fl-controls .mk-btn { width: auto; flex: 1; }
    .fl-next .mk-btn { height: auto; min-height: 3.1em; padding: 0.5rem 0.75rem; text-align: center; }
    .fl-strip { display: flex; flex-wrap: wrap; gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
    .fl-step { width: 14rem; position: relative; }
    .fl-step h3 { margin: 0.5rem 0 0.15rem; font-size: 0.95rem; }
    .fl-step__index {
      position: absolute; top: 0.4rem; left: 0.4rem; z-index: 1; min-width: 1.5rem; height: 1.5rem;
      display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700;
      color: var(--text-on-accent); background: var(--accent); border-radius: var(--radius-round);
    }
    .fl-thumb {
      width: 14rem; height: 18rem; overflow: hidden; border: 1px solid var(--border-strong);
      border-radius: var(--radius-card); background: var(--bg-page);
    }
    .fl-thumb iframe { width: 375px; height: 720px; border: 0; pointer-events: none; transform: scale(0.6); transform-origin: 0 0; }
    .fl-thumb--external {
      display: flex; align-items: center; justify-content: center; text-align: center;
      border-style: dashed; color: var(--text-muted); font-size: 0.85rem;
    }
    .fl-leads { margin: 0.25rem 0 0; padding: 0; list-style: none; font-size: 0.85rem; }
    .fl-leads li { margin-bottom: 0.2rem; }
`;

const SCRIPT = `
    (() => {
      const data = JSON.parse(document.getElementById("flow-data").textContent);
      const byId = new Map(data.screens.map((screen) => [screen.id, screen]));
      const frame = document.getElementById("fl-frame");
      const external = document.getElementById("fl-external");
      const title = document.getElementById("fl-title");
      const route = document.getElementById("fl-route");
      const next = document.getElementById("fl-next");
      const back = document.getElementById("fl-back");
      let history = [data.screens[0].id];

      const show = () => {
        const screen = byId.get(history[history.length - 1]);
        title.textContent = screen.title;
        route.textContent = screen.route;
        external.hidden = !screen.external;
        frame.hidden = screen.external;
        if (!screen.external) frame.src = screen.src;
        next.textContent = "";
        const outgoing = data.transitions.filter((t) => t.from === screen.id);
        if (outgoing.length === 0) {
          const end = document.createElement("p");
          end.className = "mk-text-muted";
          end.textContent = "End of this flow.";
          next.append(end);
        }
        outgoing.forEach((transition) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "mk-btn mk-btn--secondary";
          button.textContent = transition.label + " \\u2192 " + byId.get(transition.to).title;
          button.addEventListener("click", () => {
            history.push(transition.to);
            show();
          });
          next.append(button);
        });
        back.disabled = history.length < 2;
      };

      back.addEventListener("click", () => {
        if (history.length > 1) history.pop();
        show();
      });
      document.getElementById("fl-restart").addEventListener("click", () => {
        history = [data.screens[0].id];
        show();
      });
      show();
    })();
`;

// `feature` needs `title` and a validated `flow` (flow.js).
const buildFlowHtml = (feature) => {
  const { flow } = feature;
  const ordered = orderScreens(flow);
  const data = {
    screens: flow.screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      route: screen.route,
      external: screen.external,
      src: screen.external ? "" : relativeScreenPath(screen.path),
    })),
    transitions: flow.transitions,
  };
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Flow — ${escapeHtml(feature.title)}</title>
  <!-- ${GENERATED_NOTICE} -->
  <link rel="stylesheet" href="../../../system/tokens.css">
  <link rel="stylesheet" href="../../../system/mockup.css">
  <style>${STYLE}  </style>
</head>
<body class="mk">
  <div class="fl">
    <h1>Flow — ${escapeHtml(feature.title)}</h1>
    <p class="fl-lead">Click through the screens the way a user would, or scan them all below.</p>

    <h2>Walkthrough</h2>
    <section class="fl-walk" aria-label="Walkthrough">
      <div class="fl-stage">
        <iframe id="fl-frame" title="Current screen"></iframe>
        <div id="fl-external" class="fl-stage__external" hidden>This screen already exists in the app and is not designed here.</div>
      </div>
      <div class="fl-panel">
        <p class="fl-eyebrow" style="margin-top: 0">You are on</p>
        <h3 id="fl-title"></h3>
        <p id="fl-route" class="fl-route"></p>
        <p class="fl-eyebrow">Next</p>
        <div id="fl-next" class="fl-next"></div>
        <div class="fl-controls">
          <button id="fl-back" type="button" class="mk-btn mk-btn--secondary">Back</button>
          <button id="fl-restart" type="button" class="mk-btn mk-btn--secondary">Restart</button>
        </div>
      </div>
    </section>

    <h2>All screens (${ordered.length})</h2>
    <ol class="fl-strip">${ordered.map((screen, index) => renderStep(flow, screen, index)).join("")}
    </ol>
  </div>
  <script type="application/json" id="flow-data">${dataJson}</script>
  <script>${SCRIPT}  </script>
</body>
</html>
`;
};

module.exports = { buildFlowHtml };
