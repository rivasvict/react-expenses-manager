import { checkGeneratedFlows, generatedFiles } from "./generate";

const flowFeature = {
  slug: "f",
  title: "F",
  summary: "",
  status: "approved",
  chosen: "a",
  example: false,
  options: [],
  approved: [],
  briefPath: null,
  decisionPath: null,
  fixturesPath: null,
  flowGenerated: true,
  flowPath: "features/f/ui/flow.html",
  flow: {
    screens: [
      {
        id: "s.default",
        title: "S",
        route: "/s",
        external: false,
        path: "features/f/ui/approved/s.default.html",
      },
    ],
    transitions: [],
  },
};

describe("generatedFiles", () => {
  it("always generates the gallery", () => {
    expect(Object.keys(generatedFiles([]))).toEqual(["gallery.html"]);
  });

  it("generates a flow page for each feature with a flow.json, keyed by its path", () => {
    const files = generatedFiles([
      flowFeature,
      {
        ...flowFeature,
        slug: "g",
        flowGenerated: false,
        flowPath: "features/g/ui/flow.html",
        flow: null,
      },
    ]);
    expect(Object.keys(files)).toEqual([
      "gallery.html",
      "features/f/ui/flow.html",
    ]);
    expect(files["features/f/ui/flow.html"]).toContain(
      "<title>Flow — F</title>"
    );
  });
});

describe("checkGeneratedFlows", () => {
  it("accepts the flow pages the generator produces", () => {
    expect(checkGeneratedFlows(generatedFiles([flowFeature]))).toEqual([]);
  });

  it("flags a flow page that breaks the mockup rules, and skips the gallery", () => {
    const files = {
      "gallery.html": "<p>no tokens here</p>",
      "features/f/ui/flow.html": "<p>no tokens either</p>",
    };
    expect(checkGeneratedFlows(files)).toEqual([
      "features/f/ui/flow.html does not link system/tokens.css.",
    ]);
  });
});
