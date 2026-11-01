import fs from "fs";
import path from "path";
import tokens from "./tokens.json";
import { readThemeCatalog } from "../themes/themeCatalog";
import {
  buildOutputs,
  toAppThemesCss,
  toCatalogTs,
  toCss,
  toScss,
  toThemesCss,
  tokenEntries,
} from "./tokenFormats";

const sample = {
  $description: "ignored",
  color: { "bg-page": "#0e1116", accent: "#f0b90b" },
  radius: { "radius-card": "1rem" },
};

describe("tokenEntries", () => {
  it("flattens groups in order and skips $-prefixed metadata", () => {
    expect(tokenEntries(sample)).toEqual([
      { group: "color", name: "bg-page", value: "#0e1116" },
      { group: "color", name: "accent", value: "#f0b90b" },
      { group: "radius", name: "radius-card", value: "1rem" },
    ]);
  });

  it("rejects a name that is not kebab-case", () => {
    expect(() => tokenEntries({ color: { bgPage: "#000" } })).toThrow(
      /kebab-case/
    );
  });

  it("rejects the same name in two groups", () => {
    expect(() =>
      tokenEntries({ color: { accent: "#000" }, chart: { accent: "#111" } })
    ).toThrow(/more than once/);
  });

  it("rejects an empty value", () => {
    expect(() => tokenEntries({ color: { accent: " " } })).toThrow(/non-empty/);
  });
});

describe("toScss", () => {
  it("points themed groups at CSS variables and keeps the rest literal", () => {
    expect(toScss(sample)).toBe(
      "// GENERATED from src/styles/tokens.json by `npm run tokens:build` — do not edit.\n\n" +
        "// color\n$bg-page: var(--bg-page);\n$accent: var(--accent);\n\n" +
        "// radius\n$radius-card: 1rem;\n"
    );
  });
});

describe("toCss", () => {
  it("renders custom properties on :root under group comments", () => {
    expect(toCss(sample)).toBe(
      "/* GENERATED from src/styles/tokens.json by `npm run tokens:build` — do not edit. */\n\n" +
        ":root {\n  /* color */\n  --bg-page: #0e1116;\n  --accent: #f0b90b;\n\n" +
        "  /* radius */\n  --radius-card: 1rem;\n}\n"
    );
  });
});

describe("toThemesCss", () => {
  it("renders one data-theme block per theme with its color scheme", () => {
    const theme = {
      id: "night",
      scheme: "dark",
      color: { accent: "#f0b90b" },
      chart: { "chart-income": "#199e70" },
      shadow: { "shadow-card": "none" },
    };
    expect(toThemesCss([theme])).toBe(
      "/* GENERATED from src/themes/catalog/*.json by `npm run tokens:build` — do not edit. */\n\n" +
        '[data-theme="night"] {\n  color-scheme: dark;\n\n' +
        "  /* color */\n  --accent: #f0b90b;\n\n" +
        "  /* chart */\n  --chart-income: #199e70;\n\n" +
        "  /* shadow */\n  --shadow-card: none;\n}\n"
    );
  });
});

const nightTheme = {
  id: "night",
  scheme: "dark",
  default: true,
  color: { accent: "#f0b90b" },
  chart: { "chart-income": "#199e70" },
  shadow: { "shadow-card": "none" },
};
const dayTheme = {
  id: "day",
  scheme: "light",
  color: { accent: "#176a94" },
  chart: { "chart-income": "#1f7a4a" },
  shadow: { "shadow-card": "none" },
};

describe("toAppThemesCss", () => {
  const css = toAppThemesCss([nightTheme, dayTheme]);

  it("answers the default theme on :root as well as its own selector", () => {
    expect(css).toContain(
      ':root,\n[data-theme="night"] {\n  color-scheme: dark;\n'
    );
  });

  it("gives every other theme only its own selector and scheme", () => {
    expect(css).toContain('\n[data-theme="day"] {\n  color-scheme: light;\n');
    expect(css).toContain("--accent: #176a94;");
    expect(css.match(/:root/g)).toHaveLength(1);
  });
});

describe("toCatalogTs", () => {
  const ts = toCatalogTs([nightTheme, dayTheme]);

  it("imports each catalog file and names the default theme", () => {
    expect(ts).toContain('import night from "./catalog/night.json";');
    expect(ts).toContain('import day from "./catalog/day.json";');
    expect(ts).toContain('export const DEFAULT_THEME_ID = "night";');
  });

  it("takes the default theme's tokens from tokens.json", () => {
    expect(ts).toContain("...night,\n    color: tokens.color,");
    expect(ts).toContain("\n  day,\n");
  });

  it("camel-cases a hyphenated id into an import name", () => {
    expect(
      toCatalogTs([{ ...nightTheme, id: "midnight-gold" }])
    ).toContain("import midnightGold from");
  });
});

describe("generated files", () => {
  const repoRoot = path.resolve(__dirname, "../..");

  it.each(Object.entries(buildOutputs(tokens, readThemeCatalog(tokens))))(
    "%s is in sync with its sources (run `npm run tokens:build`)",
    (relativePath, expected) => {
      const actual = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(actual).toBe(expected);
    }
  );
});
