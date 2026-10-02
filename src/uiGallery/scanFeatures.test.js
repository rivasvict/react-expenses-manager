import fs from "fs";
import os from "os";
import path from "path";
import {
  parseApprovedName,
  parseFrontMatter,
  scanFeatures,
} from "./scanFeatures";

const writeFile = (root, relativePath, content = "") => {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const decision = (fields) =>
  `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n---\n`;

describe("parseFrontMatter", () => {
  it("reads flat key: value lines and returns the body", () => {
    expect(
      parseFrontMatter('---\ntitle: "Hello"\nexample: true\n---\nBody text')
    ).toEqual({ data: { title: "Hello", example: true }, body: "Body text" });
  });

  it("treats text without a front-matter block as body only", () => {
    expect(parseFrontMatter("# Just a doc")).toEqual({
      data: {},
      body: "# Just a doc",
    });
  });
});

describe("parseApprovedName", () => {
  it.each([
    ["bucket-list.empty.html", { screen: "bucket-list", state: "empty" }],
    ["bucket-list.html", { screen: "bucket-list", state: "default" }],
  ])("parses %s", (fileName, expected) => {
    expect(parseApprovedName(fileName)).toEqual(expected);
  });

  it("rejects names with more than a screen and a state", () => {
    expect(parseApprovedName("a.b.c.html")).toBeNull();
  });
});

describe("scanFeatures", () => {
  let docsDir;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-gallery-"));
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it("ignores docs folders that have no ui/ folder", () => {
    writeFile(docsDir, "multi-user-sync/PRD.md", "# PRD");
    expect(scanFeatures(docsDir)).toEqual([]);
  });

  it("reads a valid approved feature into the model with no problems", () => {
    writeFile(docsDir, "buckets/feature-brief.md", "# Brief");
    writeFile(
      docsDir,
      "buckets/ui/decision.md",
      decision({
        title: "Buckets",
        summary: "Why",
        status: "approved",
        chosen: "a-simple",
      })
    );
    writeFile(docsDir, "buckets/ui/options/a-simple/list.html", "<html>");
    writeFile(docsDir, "buckets/ui/options/b-rich/list.html", "<html>");
    writeFile(docsDir, "buckets/ui/approved/list.empty.html", "<html>");
    writeFile(docsDir, "buckets/ui/flow.html", "<html>");
    writeFile(docsDir, "buckets/ui/fixtures.json", "{}");

    const [feature] = scanFeatures(docsDir);

    expect(feature).toMatchObject({
      slug: "buckets",
      title: "Buckets",
      summary: "Why",
      status: "approved",
      chosen: "a-simple",
      example: false,
      briefPath: "buckets/feature-brief.md",
      decisionPath: "buckets/ui/decision.md",
      flowPath: "buckets/ui/flow.html",
      fixturesPath: "buckets/ui/fixtures.json",
      problems: [],
    });
    expect(feature.options.map((option) => option.id)).toEqual([
      "a-simple",
      "b-rich",
    ]);
    expect(feature.approved).toEqual([
      {
        screen: "list",
        state: "empty",
        path: "buckets/ui/approved/list.empty.html",
      },
    ]);
    expect(feature.mockupPaths).toEqual([
      "buckets/ui/options/a-simple/list.html",
      "buckets/ui/options/b-rich/list.html",
      "buckets/ui/approved/list.empty.html",
      "buckets/ui/flow.html",
    ]);
  });

  it("accepts brief.md as well as feature-brief.md", () => {
    writeFile(docsDir, "f/brief.md", "# Brief");
    writeFile(docsDir, "f/ui/decision.md", decision({ status: "exploring" }));
    writeFile(docsDir, "f/ui/options/a/x.html", "<html>");
    expect(scanFeatures(docsDir)[0].briefPath).toBe("f/brief.md");
  });

  it("reports a missing decision.md", () => {
    writeFile(docsDir, "f/ui/options/a/x.html", "<html>");
    expect(scanFeatures(docsDir)[0].problems).toEqual([
      "f: ui/decision.md is missing.",
    ]);
  });

  it("reports an unknown status", () => {
    writeFile(docsDir, "f/ui/decision.md", decision({ status: "done" }));
    writeFile(docsDir, "f/ui/options/a/x.html", "<html>");
    expect(scanFeatures(docsDir)[0].problems).toEqual([
      'f: ui/decision.md needs "status:" to be one of exploring, approved, implemented (got "done").',
    ]);
  });

  it("requires a chosen option and approved screens once approved", () => {
    writeFile(docsDir, "f/ui/decision.md", decision({ status: "approved" }));
    writeFile(docsDir, "f/ui/options/a/x.html", "<html>");
    expect(scanFeatures(docsDir)[0].problems).toEqual([
      'f: A approved feature needs "chosen:" in ui/decision.md.',
      "f: A approved feature needs at least one screen in ui/approved/.",
    ]);
  });

  it("reports a chosen option that does not exist", () => {
    writeFile(
      docsDir,
      "f/ui/decision.md",
      decision({ status: "exploring", chosen: "z" })
    );
    writeFile(docsDir, "f/ui/options/a/x.html", "<html>");
    expect(scanFeatures(docsDir)[0].problems).toEqual([
      'f: ui/decision.md "chosen: z" is not a folder in ui/options/.',
    ]);
  });

  it("reports an option folder without screens and a badly named approved file", () => {
    writeFile(docsDir, "f/ui/decision.md", decision({ status: "exploring" }));
    writeFile(docsDir, "f/ui/options/a/notes.md", "no html here");
    writeFile(docsDir, "f/ui/approved/a.b.c.html", "<html>");
    expect(scanFeatures(docsDir)[0].problems).toEqual([
      "f: ui/options/a/ has no .html screen.",
      "f: ui/approved/a.b.c.html must be named <screen>.<state>.html (or <screen>.html).",
      "f: The feature has no mockups in ui/options/ or ui/approved/.",
    ]);
  });
});
