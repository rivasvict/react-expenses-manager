// Reads every `design/features/<feature>/ui/` folder into a plain model the
// gallery renders from, collecting the convention's violations as `problems`
// instead of throwing, so one run can report them all (design/README.md).
// CommonJS so the plain-Node build script (scripts/buildGallery.js) can
// require it without a transpiler.

const fs = require("fs");
const path = require("path");

const STATUSES = ["exploring", "approved", "implemented"];
const BRIEF_FILES = ["feature-brief.md", "brief.md"];

const toPosix = (filePath) => filePath.split(path.sep).join("/");

const listEntries = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];

const listDirs = (dir) =>
  listEntries(dir)
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const listHtml = (dir) =>
  listEntries(dir)
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name)
    .sort();

const parseValue = (raw) => {
  const value = raw.trim().replace(/^(["'])(.*)\1$/, "$2");
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

// A minimal `---` front-matter block of flat `key: value` lines.
const parseFrontMatter = (text) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const pair = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (pair) data[pair[1]] = parseValue(pair[2]);
  });
  return { data, body: text.slice(match[0].length) };
};

// `<screen>.<state>.html`; a bare `<screen>.html` means the default state.
const parseApprovedName = (fileName) => {
  const parts = fileName.replace(/\.html$/, "").split(".");
  if (parts.length === 1 && parts[0]) {
    return { screen: parts[0], state: "default" };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { screen: parts[0], state: parts[1] };
  }
  return null;
};

const readOptions = (uiDir, relativeUi, problems) =>
  listDirs(path.join(uiDir, "options")).map((id) => {
    const screens = listHtml(path.join(uiDir, "options", id)).map((file) => ({
      name: file.replace(/\.html$/, ""),
      path: `${relativeUi}/options/${id}/${file}`,
    }));
    if (screens.length === 0) {
      problems.push(`ui/options/${id}/ has no .html screen.`);
    }
    return { id, screens };
  });

const readApproved = (uiDir, relativeUi, problems) =>
  listHtml(path.join(uiDir, "approved")).flatMap((file) => {
    const parsed = parseApprovedName(file);
    if (!parsed) {
      problems.push(
        `ui/approved/${file} must be named <screen>.<state>.html (or <screen>.html).`
      );
      return [];
    }
    return [{ ...parsed, path: `${relativeUi}/approved/${file}` }];
  });

const checkDecision = (data, options, approved, problems) => {
  const { status, chosen } = data;
  if (!STATUSES.includes(status)) {
    problems.push(
      `ui/decision.md needs "status:" to be one of ${STATUSES.join(", ")} (got "${status ?? ""}").`
    );
  }
  if (chosen && !options.some((option) => option.id === chosen)) {
    problems.push(
      `ui/decision.md "chosen: ${chosen}" is not a folder in ui/options/.`
    );
  }
  if (status === "approved" || status === "implemented") {
    if (!chosen)
      problems.push(`A ${status} feature needs "chosen:" in ui/decision.md.`);
    if (approved.length === 0) {
      problems.push(
        `A ${status} feature needs at least one screen in ui/approved/.`
      );
    }
  }
};

const readFeature = (designDir, slug) => {
  const featureDir = path.join(designDir, "features", slug);
  const uiDir = path.join(featureDir, "ui");
  if (!fs.existsSync(uiDir)) return null;

  // Every path in the model is relative to `designDir`, where the gallery lives.
  const relativeFeature = `features/${slug}`;
  const relativeUi = `${relativeFeature}/ui`;
  const problems = [];
  const decisionFile = path.join(uiDir, "decision.md");
  const hasDecision = fs.existsSync(decisionFile);
  const { data } = hasDecision
    ? parseFrontMatter(fs.readFileSync(decisionFile, "utf8"))
    : { data: {} };
  if (!hasDecision) problems.push("ui/decision.md is missing.");

  const options = readOptions(uiDir, relativeUi, problems);
  const approved = readApproved(uiDir, relativeUi, problems);
  if (hasDecision) checkDecision(data, options, approved, problems);
  const hasScreens = options.some((option) => option.screens.length > 0);
  if (!hasScreens && approved.length === 0) {
    problems.push("The feature has no mockups in ui/options/ or ui/approved/.");
  }

  const briefFile = BRIEF_FILES.find((file) =>
    fs.existsSync(path.join(featureDir, file))
  );
  const has = (file) => fs.existsSync(path.join(uiDir, file));
  const flowFile = has("flow.html") ? "flow.html" : null;

  return {
    slug,
    title: data.title || slug,
    summary: data.summary || "",
    status: data.status,
    chosen: data.chosen || "",
    example: data.example === true,
    options,
    approved,
    briefPath: briefFile ? `${relativeFeature}/${briefFile}` : null,
    decisionPath: hasDecision ? `${relativeUi}/decision.md` : null,
    flowPath: flowFile ? `${relativeUi}/${flowFile}` : null,
    fixturesPath: has("fixtures.json") ? `${relativeUi}/fixtures.json` : null,
    // Every mockup page, so the token guard can check each one.
    mockupPaths: [
      ...options.flatMap((option) => option.screens.map((s) => s.path)),
      ...approved.map((screen) => screen.path),
      ...(flowFile ? [`${relativeUi}/${flowFile}`] : []),
    ].map(toPosix),
    problems: problems.map((problem) => `${slug}: ${problem}`),
  };
};

// Every `design/features/<feature>/` that has a `ui/` folder, sorted by name.
const scanFeatures = (designDir) =>
  listDirs(path.join(designDir, "features"))
    .map((slug) => readFeature(designDir, slug))
    .filter(Boolean);

module.exports = {
  STATUSES,
  parseFrontMatter,
  parseApprovedName,
  scanFeatures,
};
