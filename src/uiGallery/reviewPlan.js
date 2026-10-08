// Turns a feature's `ui/fixtures.json` and approved screens into the list of
// screens the design reviewer captures from the real app and from the mockup,
// and reports fixtures that do not line up with the approved screens
// (design/README.md). Pure: no browser, no files.
// CommonJS for the same reason as scanFeatures.js.

const DEFAULT_VIEWPORT = { width: 375, height: 720 };

// What gets compared on each side by default: the work-area card, which both
// the app and `design/system/mockup.css` render.
const DEFAULT_REGION = {
  app: ".work-area-content-container",
  mockup: ".mk-work-area",
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const isPositiveNumber = (value) => Number.isFinite(value) && value > 0;

// localStorage holds strings; objects are written as JSON, as the app stores them.
const toStorageValue = (value) =>
  typeof value === "string" ? value : JSON.stringify(value);

const checkAction = (action, where, problems) => {
  const valid =
    action &&
    ((isNonEmptyString(action.click) && Object.keys(action).length === 1) ||
      (Array.isArray(action.fill) &&
        action.fill.length === 2 &&
        action.fill.every(isNonEmptyString) &&
        Object.keys(action).length === 1) ||
      (isPositiveNumber(action.wait) && Object.keys(action).length === 1) ||
      (action.blur === true && Object.keys(action).length === 1));
  if (!valid) {
    problems.push(
      `${where} must be one of {"click": selector}, {"fill": [selector, text]}, {"wait": milliseconds} or {"blur": true}.`
    );
  }
  return valid;
};

const planScreen = (id, fixture, mockupPath, problems) => {
  const where = `fixtures.json "${id}"`;
  if (
    !fixture ||
    !isNonEmptyString(fixture.route) ||
    !fixture.route.startsWith("/")
  ) {
    problems.push(`${where} needs a "route" that starts with "/".`);
    return null;
  }
  const viewport = fixture.viewport || DEFAULT_VIEWPORT;
  if (!isPositiveNumber(viewport.width) || !isPositiveNumber(viewport.height)) {
    problems.push(`${where} "viewport" needs a positive "width" and "height".`);
    return null;
  }
  const actions = fixture.actions === undefined ? [] : fixture.actions;
  if (!Array.isArray(actions)) {
    problems.push(`${where} "actions" must be an array.`);
    return null;
  }
  const validActions = actions.map((action, index) =>
    checkAction(action, `${where} actions[${index}]`, problems)
  );
  if (validActions.includes(false)) return null;
  // Screens that depend on today's date (the dashboard opens on the current
  // month) pin the app's clock to this moment.
  if (
    fixture.now !== undefined &&
    !(isNonEmptyString(fixture.now) && !Number.isNaN(Date.parse(fixture.now)))
  ) {
    problems.push(
      `${where} "now" must be a date the browser can parse, like "2026-10-15T12:00:00".`
    );
    return null;
  }

  return {
    id,
    route: fixture.route,
    viewport: { width: viewport.width, height: viewport.height },
    localStorage: Object.fromEntries(
      Object.entries(fixture.localStorage || {}).map(([key, value]) => [
        key,
        toStorageValue(value),
      ])
    ),
    actions,
    region: { ...DEFAULT_REGION, ...(fixture.region || {}) },
    ...(fixture.now !== undefined && { now: fixture.now }),
    mockupPath,
  };
};

// `approved` is the feature's approved screens (scanFeatures.js); `fixtures`
// is the parsed fixtures.json. Returns { screens, problems }.
const planReview = (approved, fixtures) => {
  const problems = [];
  const fixtureScreens = (fixtures && fixtures.screens) || null;
  if (!fixtureScreens || typeof fixtureScreens !== "object") {
    return {
      screens: [],
      problems: [
        'fixtures.json needs a "screens" object keyed by <screen>.<state>.',
      ],
    };
  }
  const approvedIds = approved.map((item) => `${item.screen}.${item.state}`);
  Object.keys(fixtureScreens)
    .filter((id) => !approvedIds.includes(id))
    .forEach((id) =>
      problems.push(`fixtures.json "${id}" is not a screen in ui/approved/.`)
    );

  const screens = approved.flatMap((item, index) => {
    const id = approvedIds[index];
    if (!(id in fixtureScreens)) {
      problems.push(
        `ui/approved/ screen "${id}" has no entry in fixtures.json.`
      );
      return [];
    }
    const planned = planScreen(id, fixtureScreens[id], item.path, problems);
    return planned ? [planned] : [];
  });
  return { screens, problems };
};

module.exports = { DEFAULT_REGION, DEFAULT_VIEWPORT, planReview };
