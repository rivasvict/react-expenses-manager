import { DEFAULT_REGION, DEFAULT_VIEWPORT, planReview } from "./reviewPlan";

const approved = [
  {
    screen: "form",
    state: "default",
    path: "features/f/ui/approved/form.default.html",
  },
  {
    screen: "form",
    state: "error",
    path: "features/f/ui/approved/form.error.html",
  },
];

const fixtures = (screens) => ({ screens });

describe("planReview", () => {
  it("plans every approved screen with defaults filled in", () => {
    const { screens, problems } = planReview(
      approved,
      fixtures({
        "form.default": { route: "/add" },
        "form.error": {
          route: "/add",
          viewport: { width: 414, height: 800 },
          localStorage: { language: "es", buckets: { Groceries: 800 } },
          actions: [{ click: "text=Submit" }, { wait: 200 }, { blur: true }],
          region: { app: "main" },
        },
      })
    );

    expect(problems).toEqual([]);
    expect(screens[0]).toEqual({
      id: "form.default",
      route: "/add",
      viewport: DEFAULT_VIEWPORT,
      localStorage: {},
      actions: [],
      region: DEFAULT_REGION,
      mockupPath: "features/f/ui/approved/form.default.html",
    });
    expect(screens[1]).toMatchObject({
      viewport: { width: 414, height: 800 },
      // Non-string values are stored as JSON, the way the app stores them.
      localStorage: { language: "es", buckets: '{"Groceries":800}' },
      actions: [{ click: "text=Submit" }, { wait: 200 }, { blur: true }],
      region: { app: "main", mockup: DEFAULT_REGION.mockup },
    });
  });

  it("requires a fixtures.json with a screens object", () => {
    expect(planReview(approved, {}).problems).toEqual([
      'fixtures.json needs a "screens" object keyed by <screen>.<state>.',
    ]);
    expect(planReview(approved, null).screens).toEqual([]);
  });

  it("reports approved screens without a fixture, and fixtures without a screen", () => {
    const { screens, problems } = planReview(
      approved,
      fixtures({
        "form.default": { route: "/add" },
        "ghost.default": { route: "/x" },
      })
    );
    expect(screens.map((screen) => screen.id)).toEqual(["form.default"]);
    expect(problems).toEqual([
      'fixtures.json "ghost.default" is not a screen in ui/approved/.',
      'ui/approved/ screen "form.error" has no entry in fixtures.json.',
    ]);
  });

  it.each([
    ["a missing route", { viewport: DEFAULT_VIEWPORT }, /needs a "route"/],
    ["a route without a leading slash", { route: "add" }, /needs a "route"/],
    [
      "a bad viewport",
      { route: "/a", viewport: { width: 0, height: 5 } },
      /"viewport" needs/,
    ],
    [
      "actions that are not an array",
      { route: "/a", actions: "click" },
      /"actions" must be an array/,
    ],
    [
      "an unknown action",
      { route: "/a", actions: [{ hover: "x" }] },
      /must be one of/,
    ],
    [
      "a click with extra keys",
      { route: "/a", actions: [{ click: "x", fill: ["a", "b"] }] },
      /must be one of/,
    ],
  ])("rejects %s", (unused, fixture, pattern) => {
    const { screens, problems } = planReview(
      [approved[0]],
      fixtures({ "form.default": fixture })
    );
    expect(screens).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(pattern);
  });
});
