// Parses and validates a feature's `ui/flow.json`: the screens of a flow and
// the transitions between them (design/README.md). Validation ties the flow to
// the approved screens, so a flow can never drift from what was designed.
// CommonJS for the same reason as scanFeatures.js.

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const screenKey = (approvedScreen) =>
  `${approvedScreen.screen}.${approvedScreen.state}`;

// A flow screen is either an approved screen (`<screen>.<state>`) or an
// `external` one: a screen that already exists in the app and is not designed
// here, shown as a plain box.
const checkScreens = (screens, approvedByKey, problems) => {
  const seen = new Set();
  return screens.flatMap((screen, index) => {
    const where = `flow.json screens[${index}]`;
    if (!screen || !isNonEmptyString(screen.id)) {
      problems.push(`${where} needs a non-empty "id".`);
      return [];
    }
    if (seen.has(screen.id)) {
      problems.push(`${where} repeats the id "${screen.id}".`);
      return [];
    }
    seen.add(screen.id);
    const external = screen.external === true;
    if (external && !isNonEmptyString(screen.title)) {
      problems.push(`${where} is external, so it needs a "title".`);
    }
    const approved = approvedByKey.get(screen.id);
    if (!external && !approved) {
      problems.push(
        `${where} "${screen.id}" is not a screen in ui/approved/ (mark it "external": true if it already exists in the app).`
      );
    }
    return [
      {
        id: screen.id,
        title: isNonEmptyString(screen.title) ? screen.title : screen.id,
        route: isNonEmptyString(screen.route) ? screen.route : "",
        external,
        path: approved ? approved.path : null,
      },
    ];
  });
};

const checkTransitions = (transitions, screenIds, problems) =>
  transitions.flatMap((transition, index) => {
    const where = `flow.json transitions[${index}]`;
    if (!transition || !isNonEmptyString(transition.label)) {
      problems.push(`${where} needs a non-empty "label".`);
      return [];
    }
    const unknown = ["from", "to"].filter(
      (key) => !screenIds.has(transition[key])
    );
    if (unknown.length > 0) {
      problems.push(
        `${where} "${transition.label}" has an unknown ${unknown.join(" and ")} (use an id from "screens").`
      );
      return [];
    }
    return [
      { from: transition.from, to: transition.to, label: transition.label },
    ];
  });

// Every approved screen must appear in the flow under at least one state, so
// a screen can't be designed and then left out of how users reach it.
const checkCoverage = (screens, approved, problems) => {
  const inFlow = new Set(screens.map((screen) => screen.id.split(".")[0]));
  [...new Set(approved.map((item) => item.screen))]
    .filter((name) => !inFlow.has(name))
    .forEach((name) =>
      problems.push(`flow.json does not include the approved screen "${name}".`)
    );
};

// `text` is the file's content; `approved` is the feature's approved screens.
// Returns { flow, problems }; `flow` is null when the file is unusable.
const parseFlow = (text, approved) => {
  const problems = [];
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return {
      flow: null,
      problems: [`flow.json is not valid JSON (${error.message}).`],
    };
  }
  if (!raw || !Array.isArray(raw.screens) || raw.screens.length === 0) {
    return {
      flow: null,
      problems: ['flow.json needs a non-empty "screens" array.'],
    };
  }
  const approvedByKey = new Map(
    approved.map((item) => [screenKey(item), item])
  );
  const screens = checkScreens(raw.screens, approvedByKey, problems);
  const screenIds = new Set(screens.map((screen) => screen.id));
  const transitions = checkTransitions(
    Array.isArray(raw.transitions) ? raw.transitions : [],
    screenIds,
    problems
  );
  checkCoverage(screens, approved, problems);
  return { flow: { screens, transitions }, problems };
};

// Screens in the order a user meets them: breadth-first from the first screen
// along the transitions, then any screens no transition reaches.
const orderScreens = (flow) => {
  const byId = new Map(flow.screens.map((screen) => [screen.id, screen]));
  const visited = [];
  const queue = [flow.screens[0].id];
  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.includes(id)) continue;
    visited.push(id);
    flow.transitions
      .filter((transition) => transition.from === id)
      .forEach((transition) => queue.push(transition.to));
  }
  const unreached = flow.screens
    .map((screen) => screen.id)
    .filter((id) => !visited.includes(id));
  return [...visited, ...unreached].map((id) => byId.get(id));
};

module.exports = { parseFlow, orderScreens };
