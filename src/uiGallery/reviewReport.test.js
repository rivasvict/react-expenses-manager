import { findMockupProblems } from "./mockupGuard";
import {
  buildReportHtml,
  buildReportMarkdown,
  judgeScreen,
} from "./reviewReport";

const size = (width, height) => ({ width, height });

describe("judgeScreen", () => {
  it("passes when sizes match and the differing share is within the threshold", () => {
    expect(
      judgeScreen(
        { mockupSize: size(10, 10), appSize: size(10, 10), ratio: 0.01 },
        2
      )
    ).toEqual({ pass: true, reason: "1.00% of pixels differ" });
  });

  it("fails when too many pixels differ", () => {
    expect(
      judgeScreen(
        { mockupSize: size(10, 10), appSize: size(10, 10), ratio: 0.05 },
        2
      )
    ).toEqual({ pass: false, reason: "5.00% of pixels differ (allowed 2%)" });
  });

  it("fails on a size mismatch before looking at pixels", () => {
    expect(
      judgeScreen(
        { mockupSize: size(343, 600), appSize: size(343, 640), ratio: 0 },
        2
      )
    ).toEqual({
      pass: false,
      reason: "size mismatch: mockup 343×600, app 343×640",
    });
  });

  it("allows exactly the threshold", () => {
    expect(
      judgeScreen(
        { mockupSize: size(1, 1), appSize: size(1, 1), ratio: 0.02 },
        2
      ).pass
    ).toBe(true);
  });
});

const results = [
  {
    id: "form.default",
    pass: true,
    reason: "0.10% of pixels differ",
    files: {
      mockup: "form.default.mockup.png",
      app: "form.default.app.png",
      diff: "form.default.diff.png",
    },
  },
  {
    id: "form.error",
    pass: false,
    reason: "size mismatch: mockup 343×600, app 343×640",
    files: { mockup: "a.png", app: "b.png", diff: "c.png" },
  },
];
const options = { tolerance: 12, thresholdPercent: 2 };

describe("buildReportMarkdown", () => {
  it("summarises every screen with its verdict", () => {
    const markdown = buildReportMarkdown("my-feature", results, options);
    expect(markdown).toContain("# Design review: my-feature");
    expect(markdown).toContain("1 of 2 screen(s) do not match.");
    expect(markdown).toContain(
      "| form.default | ✅ match | 0.10% of pixels differ |"
    );
    expect(markdown).toContain(
      "| form.error | ❌ differs | size mismatch: mockup 343×600, app 343×640 |"
    );
  });

  it("says so when everything matches", () => {
    expect(buildReportMarkdown("x", [results[0]], options)).toContain(
      "All 1 screen(s) match."
    );
  });
});

describe("buildReportHtml", () => {
  it("shows the three images and the verdict for each screen", () => {
    const page = buildReportHtml("my-feature", results, options);
    expect(page).toContain('src="form.default.mockup.png"');
    expect(page).toContain('src="form.default.diff.png"');
    expect(page).toContain("rv-badge--pass");
    expect(page).toContain("rv-badge--fail");
    expect(page).toContain("size mismatch: mockup 343×600, app 343×640");
  });

  it("shows the reason but no images for a screen that could not be captured", () => {
    const page = buildReportHtml(
      "x",
      [
        {
          id: "form.default",
          pass: false,
          reason: "could not capture: timeout",
        },
      ],
      options
    );
    expect(page).toContain("could not capture: timeout");
    expect(page).not.toContain("<img");
  });

  it("escapes the feature name", () => {
    expect(buildReportHtml("<b>x</b>", results, options)).not.toContain(
      "<b>x</b>"
    );
  });

  it("follows the mockup rules itself (tokens only, self-contained)", () => {
    expect(findMockupProblems(buildReportHtml("x", results, options))).toEqual(
      []
    );
  });
});
