import { findMockupProblems } from "./mockupGuard";
import { buildFlowHtml } from "./flowHtml";

const feature = {
  title: "Add <a> bucket",
  flow: {
    screens: [
      {
        id: "list",
        title: "List",
        route: "/buckets",
        external: true,
        path: null,
      },
      {
        id: "form.default",
        title: "Add form",
        route: "/add",
        external: false,
        path: "features/f/ui/approved/form.default.html",
      },
      {
        id: "form.error",
        title: "Add form: error",
        route: "/add",
        external: false,
        path: "features/f/ui/approved/form.error.html",
      },
    ],
    transitions: [
      { from: "list", to: "form.default", label: "Tap Add" },
      { from: "form.default", to: "form.error", label: "Tap Submit empty" },
    ],
  },
};

describe("buildFlowHtml", () => {
  const page = buildFlowHtml(feature);

  it("titles the page with the feature and escapes it", () => {
    expect(page).toContain("<title>Flow — Add &lt;a&gt; bucket</title>");
    expect(page).not.toContain("Add <a> bucket");
  });

  it("embeds the screens and transitions for the walkthrough, with paths relative to ui/", () => {
    const json =
      /<script type="application\/json" id="flow-data">(.*)<\/script>/.exec(
        page
      )[1];
    const data = JSON.parse(json);
    expect(data.screens.map((screen) => screen.src)).toEqual([
      "",
      "approved/form.default.html",
      "approved/form.error.html",
    ]);
    expect(data.screens[0].external).toBe(true);
    expect(data.transitions).toEqual(feature.flow.transitions);
  });

  it("lists every screen in order with where each one leads", () => {
    expect(page).toContain("All screens (3)");
    expect(page).toContain("Tap Add</span> → Add form");
    expect(page).toContain("Tap Submit empty</span> → Add form: error");
    expect(page).toContain("End of this flow");
  });

  it("previews designed screens and boxes the external ones", () => {
    expect(page).toContain('src="approved/form.default.html"');
    expect(page).toContain("Existing screen<br>not designed here");
    expect(page).not.toContain('loading="lazy"');
  });

  it("keeps hidden elements hidden despite their display rules", () => {
    expect(page).toContain(".fl-stage [hidden] { display: none; }");
  });

  it("cannot be broken out of by text in the flow data", () => {
    const hostile = buildFlowHtml({
      ...feature,
      flow: {
        ...feature.flow,
        screens: [
          { ...feature.flow.screens[0], title: "</script><b>x</b>" },
          ...feature.flow.screens.slice(1),
        ],
      },
    });
    expect(hostile.match(/<\/script>/g)).toHaveLength(2);
  });

  it("follows the mockup rules itself (tokens only, self-contained)", () => {
    expect(findMockupProblems(page)).toEqual([]);
  });
});
