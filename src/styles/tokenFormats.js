// Renders src/styles/tokens.json into the formats the rest of the project
// consumes. CommonJS so the plain-Node build script (scripts/buildTokens.js)
// can require it without a transpiler.

const GENERATED_NOTICE =
  "GENERATED from src/styles/tokens.json by `npm run tokens:build` — do not edit.";

const TOKEN_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const SCSS_PATH = "src/styles/_tokens.scss";
const CSS_PATH = "design/system/tokens.css";
const THEMES_CSS_PATH = "design/system/themes.css";
const APP_THEMES_CSS_PATH = "src/styles/themes.generated.css";
const CATALOG_TS_PATH = "src/themes/catalog.generated.ts";

// The groups the app themes at runtime: SCSS reads them as CSS variables.
// Radius and font stacks are the same in every theme and stay literal.
const THEMED_VAR_GROUPS = ["color", "chart", "shadow"];

const THEMES_NOTICE =
  "GENERATED from src/themes/catalog/*.json by `npm run tokens:build` — do not edit.";

const isMetaKey = (key) => key.startsWith("$");

// Flattens the grouped JSON into ordered { group, name, value } rows, failing
// loudly on anything that would generate a broken or ambiguous variable.
const tokenEntries = (tokens) => {
  const seen = new Set();
  return Object.keys(tokens)
    .filter((group) => !isMetaKey(group))
    .flatMap((group) =>
      Object.entries(tokens[group]).map(([name, value]) => {
        if (!TOKEN_NAME.test(name)) {
          throw new Error(`Token "${name}" must be kebab-case.`);
        }
        if (seen.has(name)) {
          throw new Error(`Token "${name}" is defined more than once.`);
        }
        if (typeof value !== "string" || value.trim() === "") {
          throw new Error(
            `Token "${name}" must have a non-empty string value.`
          );
        }
        seen.add(name);
        return { group, name, value };
      })
    );
};

// Renders one block per group: a group comment, then one line per token.
const renderGrouped = (tokens, { comment, line }) => {
  const entries = tokenEntries(tokens);
  const groups = [...new Set(entries.map((entry) => entry.group))];
  return groups
    .map((group) =>
      [
        comment(group),
        ...entries.filter((entry) => entry.group === group).map(line),
      ].join("\n")
    )
    .join("\n\n");
};

// Themed tokens (color, chart, shadow) become `$name: var(--name);` so a theme
// switch at runtime recolors the app; the rest keep their literal value.
const toScss = (tokens) => {
  const body = renderGrouped(tokens, {
    comment: (group) => `// ${group}`,
    line: ({ group, name, value }) =>
      THEMED_VAR_GROUPS.includes(group)
        ? `$${name}: var(--${name});`
        : `$${name}: ${value};`,
  });
  return `// ${GENERATED_NOTICE}\n\n${body}\n`;
};

const toCss = (tokens) => {
  const body = renderGrouped(tokens, {
    comment: (group) => `  /* ${group} */`,
    line: ({ name, value }) => `  --${name}: ${value};`,
  });
  return `/* ${GENERATED_NOTICE} */\n\n:root {\n${body}\n}\n`;
};

// One `[data-theme="<id>"]` block per theme, so a mockup can show any theme
// on any element (the whole page, or one preview card inside it).
const toThemesCss = (themes) => {
  const blocks = themes.map((theme) => {
    const body = renderGrouped(
      { color: theme.color, chart: theme.chart, shadow: theme.shadow },
      {
        comment: (group) => `  /* ${group} */`,
        line: ({ name, value }) => `  --${name}: ${value};`,
      }
    );
    return `[data-theme="${theme.id}"] {\n  color-scheme: ${theme.scheme};\n\n${body}\n}`;
  });
  return `/* ${THEMES_NOTICE} */\n\n${blocks.join("\n\n")}\n`;
};

// The stylesheet the app imports once: the default theme answers on :root (so
// the app is themed before anything sets data-theme) and every theme answers on
// its own `[data-theme]` selector, on <html> or on one preview element.
const toAppThemesCss = (themes) => {
  const blocks = themes.map((theme) => {
    const body = renderGrouped(
      { color: theme.color, chart: theme.chart, shadow: theme.shadow },
      {
        comment: (group) => `  /* ${group} */`,
        line: ({ name, value }) => `  --${name}: ${value};`,
      }
    );
    const selector = theme.default
      ? `:root,\n[data-theme="${theme.id}"]`
      : `[data-theme="${theme.id}"]`;
    return `${selector} {\n  color-scheme: ${theme.scheme};\n\n${body}\n}`;
  });
  return `/* ${THEMES_NOTICE} */\n\n${blocks.join("\n\n")}\n`;
};

const importName = (id) =>
  id.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());

// The runtime registry: every catalog file imported statically, in catalog
// order. The default theme's tokens come from tokens.json, the rest from
// their own file. Nothing else in the app lists themes by hand.
const toCatalogTs = (themes) => {
  const defaultTheme = themes.find((theme) => theme.default);
  const entries = themes.map((theme) =>
    theme.default
      ? [
          "  {",
          `    ...${importName(theme.id)},`,
          "    color: tokens.color,",
          "    chart: tokens.chart,",
          "    shadow: tokens.shadow,",
          "  },",
        ].join("\n")
      : `  ${importName(theme.id)},`
  );
  return [
    `// ${THEMES_NOTICE}`,
    "",
    'import tokens from "../styles/tokens.json";',
    ...themes.map(
      (theme) => `import ${importName(theme.id)} from "./catalog/${theme.id}.json";`
    ),
    'import type { Theme } from "./theme.types";',
    "",
    `export const DEFAULT_THEME_ID = ${JSON.stringify(defaultTheme.id)};`,
    "",
    "// The default theme first, then the others by id.",
    "export const THEME_CATALOG = [",
    ...entries,
    "] as Theme[];",
    "",
  ].join("\n");
};

// Every generated file, keyed by its repo-relative path.
const buildOutputs = (tokens, themes = []) => ({
  [SCSS_PATH]: toScss(tokens),
  [CSS_PATH]: toCss(tokens),
  [THEMES_CSS_PATH]: toThemesCss(themes),
  [APP_THEMES_CSS_PATH]: toAppThemesCss(themes),
  ...(themes.some((theme) => theme.default)
    ? { [CATALOG_TS_PATH]: toCatalogTs(themes) }
    : {}),
});

module.exports = {
  tokenEntries,
  toScss,
  toCss,
  toThemesCss,
  toAppThemesCss,
  toCatalogTs,
  buildOutputs,
};
