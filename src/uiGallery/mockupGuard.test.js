import fs from "fs";
import os from "os";
import path from "path";
import { checkMockups, findMockupProblems } from "./mockupGuard";

const page = (head = "", body = "") =>
  `<!doctype html><html><head>
  <link rel="stylesheet" href="../../design-system/tokens.css">${head}
  </head><body>${body}</body></html>`;

describe("findMockupProblems", () => {
  it("accepts a page that uses only token variables", () => {
    const html = page(
      "<style>.a { color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, transparent); }</style>",
      '<p style="color: var(--text-primary)">Hi <a href="#top">top</a></p>' +
        '<svg><path style="fill: var(--accent)" d="M0 0"/></svg>'
    );
    expect(findMockupProblems(html)).toEqual([]);
  });

  it("requires the tokens.css link", () => {
    expect(findMockupProblems("<html><body>No tokens</body></html>")).toEqual([
      "does not link design-system/tokens.css.",
    ]);
  });

  it.each([
    ["a hex color in a <style> block", page("<style>.a{color:#fff}</style>")],
    [
      "a hex color in a style attribute",
      page("", '<p style="color: #f0b90b">x</p>'),
    ],
    [
      "an rgba() color in a style attribute",
      page("", "<p style='background: rgba(0, 0, 0, 0.5)'>x</p>"),
    ],
    ["an hsl() color in CSS", page("<style>.a{color:hsl(10 20% 30%)}</style>")],
  ])("flags %s", (unused, html) => {
    expect(findMockupProblems(html)).toEqual([
      "uses a literal color in CSS; use a var(--token) from tokens.css.",
    ]);
  });

  it("flags a literal color in an SVG paint attribute", () => {
    expect(
      findMockupProblems(page("", '<svg><rect fill="#161b22"/></svg>'))
    ).toEqual([
      'uses a literal color in an SVG attribute; use style="fill: var(--token)".',
    ]);
  });

  it.each([
    [
      "a CDN script",
      page('<script src="https://unpkg.com/react.js"></script>'),
    ],
    [
      "a protocol-relative stylesheet",
      page('<link rel="stylesheet" href="//fonts.example.com/x.css">'),
    ],
    [
      "a remote url() in CSS",
      page("<style>.a{background:url(https://x.test/a.png)}</style>"),
    ],
  ])("flags %s", (unused, html) => {
    expect(findMockupProblems(html)).toEqual([
      "loads an external resource; mockups must be self-contained.",
    ]);
  });

  it("allows local images and in-page anchors", () => {
    expect(
      findMockupProblems(
        page("", '<img src="../../../src/images/x.png"><a href="#a1b">x</a>')
      )
    ).toEqual([]);
  });
});

describe("checkMockups", () => {
  it("prefixes each problem with the mockup's path and reads every listed file", () => {
    const docsDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-guard-"));
    try {
      fs.mkdirSync(path.join(docsDir, "f/ui"), { recursive: true });
      fs.writeFileSync(path.join(docsDir, "f/ui/good.html"), page());
      fs.writeFileSync(
        path.join(docsDir, "f/ui/bad.html"),
        page("<style>.a{color:#000}</style>")
      );

      expect(
        checkMockups(docsDir, [
          { mockupPaths: ["f/ui/good.html", "f/ui/bad.html"] },
        ])
      ).toEqual([
        "f/ui/bad.html uses a literal color in CSS; use a var(--token) from tokens.css.",
      ]);
    } finally {
      fs.rmSync(docsDir, { recursive: true, force: true });
    }
  });
});
