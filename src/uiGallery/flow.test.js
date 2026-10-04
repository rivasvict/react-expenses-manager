import { orderScreens, parseFlow } from "./flow";

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
  {
    screen: "list",
    state: "default",
    path: "features/f/ui/approved/list.default.html",
  },
];

const flowJson = (flow) => JSON.stringify(flow);

const validFlow = {
  screens: [
    { id: "home", title: "Home", route: "/", external: true },
    { id: "form.default", title: "Add form", route: "/add" },
    { id: "list.default", title: "List", route: "/list" },
  ],
  transitions: [
    { from: "home", to: "form.default", label: "Add" },
    { from: "form.default", to: "list.default", label: "Submit" },
  ],
};

describe("parseFlow", () => {
  it("accepts a valid flow and links approved screens to their files", () => {
    const { flow, problems } = parseFlow(flowJson(validFlow), approved);

    expect(problems).toEqual([]);
    expect(flow.screens.map((screen) => screen.id)).toEqual([
      "home",
      "form.default",
      "list.default",
    ]);
    expect(flow.screens[0]).toMatchObject({ external: true, path: null });
    expect(flow.screens[1]).toMatchObject({
      external: false,
      path: "features/f/ui/approved/form.default.html",
    });
    expect(flow.transitions).toHaveLength(2);
  });

  it("does not require every state of a screen to be listed", () => {
    // form.error is a state of "form", which the flow already includes.
    expect(parseFlow(flowJson(validFlow), approved).problems).toEqual([]);
  });

  it("reports invalid JSON and a missing screens array", () => {
    expect(parseFlow("{nope", approved).problems[0]).toMatch(/not valid JSON/);
    expect(parseFlow("{}", approved)).toEqual({
      flow: null,
      problems: ['flow.json needs a non-empty "screens" array.'],
    });
  });

  it("reports a screen that is neither approved nor external", () => {
    const { problems } = parseFlow(
      flowJson({ screens: [{ id: "form.default" }, { id: "ghost.default" }] }),
      approved
    );
    expect(problems).toContain(
      'flow.json screens[1] "ghost.default" is not a screen in ui/approved/ (mark it "external": true if it already exists in the app).'
    );
  });

  it("requires a title on external screens and unique ids", () => {
    const { problems } = parseFlow(
      flowJson({
        screens: [
          { id: "home", external: true },
          { id: "form.default" },
          { id: "form.default" },
        ],
      }),
      approved
    );
    expect(problems).toContain(
      'flow.json screens[0] is external, so it needs a "title".'
    );
    expect(problems).toContain(
      'flow.json screens[2] repeats the id "form.default".'
    );
  });

  it("reports transitions with no label or unknown endpoints", () => {
    const { problems, flow } = parseFlow(
      flowJson({
        screens: validFlow.screens,
        transitions: [
          { from: "home", to: "form.default" },
          { from: "home", to: "nowhere", label: "Go" },
        ],
      }),
      approved
    );
    expect(problems).toEqual(
      expect.arrayContaining([
        'flow.json transitions[0] needs a non-empty "label".',
        'flow.json transitions[1] "Go" has an unknown to (use an id from "screens").',
      ])
    );
    expect(flow.transitions).toEqual([]);
  });

  it("requires every approved screen to appear in the flow", () => {
    const { problems } = parseFlow(
      flowJson({ screens: [{ id: "form.default" }] }),
      approved
    );
    expect(problems).toEqual([
      'flow.json does not include the approved screen "list".',
    ]);
  });
});

describe("orderScreens", () => {
  it("walks breadth-first from the first screen, then lists unreached screens", () => {
    const flow = {
      screens: [
        { id: "a" },
        { id: "orphan" },
        { id: "c" },
        { id: "b" },
        { id: "d" },
      ],
      transitions: [
        { from: "a", to: "b", label: "x" },
        { from: "a", to: "c", label: "y" },
        { from: "b", to: "d", label: "z" },
        { from: "d", to: "a", label: "back" },
      ],
    };
    expect(orderScreens(flow).map((screen) => screen.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "orphan",
    ]);
  });
});
