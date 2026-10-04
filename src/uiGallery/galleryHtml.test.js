import { findMockupProblems } from "./mockupGuard";
import { buildGalleryHtml } from "./galleryHtml";

const feature = (overrides = {}) => ({
  slug: "buckets",
  title: "Buckets <redesign>",
  summary: "Why & how",
  status: "approved",
  chosen: "a-simple",
  example: false,
  options: [
    {
      id: "a-simple",
      screens: [
        { name: "list", path: "buckets/ui/options/a-simple/list.html" },
      ],
    },
    {
      id: "b-rich",
      screens: [{ name: "list", path: "buckets/ui/options/b-rich/list.html" }],
    },
  ],
  approved: [
    {
      screen: "list",
      state: "empty",
      path: "buckets/ui/approved/list.empty.html",
    },
  ],
  briefPath: "buckets/feature-brief.md",
  decisionPath: "buckets/ui/decision.md",
  flowPath: "buckets/ui/flow.html",
  fixturesPath: null,
  ...overrides,
});

describe("buildGalleryHtml", () => {
  it("shows a friendly message when no feature has a ui/ folder", () => {
    expect(buildGalleryHtml([])).toContain(
      "No features have a ui/ folder yet."
    );
  });

  it("renders a feature with its status, links, approved screens and options", () => {
    const page = buildGalleryHtml([feature()]);

    expect(page).toContain('data-status="approved"');
    expect(page).toContain(
      '<span class="badge badge--approved">Approved</span>'
    );
    expect(page).toContain('src="buckets/ui/approved/list.empty.html"');
    expect(page).toContain("list · empty");
    expect(page).toContain('href="buckets/feature-brief.md"');
    expect(page).toContain('href="buckets/ui/flow.html"');
    expect(page).not.toContain("Fixtures</a>");
    expect(page).toContain("Options (2)");
    expect(page).toContain('src="buckets/ui/options/b-rich/list.html"');
  });

  it("marks only the chosen option", () => {
    const page = buildGalleryHtml([feature()]);
    expect(page.match(/>Chosen</g)).toHaveLength(1);
    expect(page).toMatch(/a-simple <span class="badge badge--approved">Chosen/);
  });

  it("escapes text coming from the docs", () => {
    const page = buildGalleryHtml([feature()]);
    expect(page).toContain("Buckets &lt;redesign&gt;");
    expect(page).toContain("Why &amp; how");
    expect(page).not.toContain("<redesign>");
  });

  it("opens the options for a feature that is still being explored", () => {
    const exploringPage = buildGalleryHtml([
      feature({ status: "exploring", approved: [] }),
    ]);
    expect(exploringPage).toContain('<details class="options" open>');
    expect(buildGalleryHtml([feature()])).toContain(
      '<details class="options">'
    );
  });

  it("flags an example feature", () => {
    expect(buildGalleryHtml([feature({ example: true })])).toContain(
      '<span class="badge badge--example">Example</span>'
    );
  });

  it("is itself a valid mockup page: tokens only, self-contained", () => {
    expect(findMockupProblems(buildGalleryHtml([feature()]))).toEqual([]);
  });
});
