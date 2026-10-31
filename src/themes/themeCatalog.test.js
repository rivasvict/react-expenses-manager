import fs from "fs";
import os from "os";
import path from "path";
import tokens from "../styles/tokens.json";
import { THEMED_GROUPS, readThemeCatalog } from "./themeCatalog";

const LANGUAGES = ["en", "es", "fr"];

// WCAG 2 relative luminance and contrast ratio. A translucent color is
// composited over the background it sits on first.
const parseColor = (value) => {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value.trim());
  if (!rgb) throw new Error(`Cannot parse color "${value}"`);
  const [r, g, b, a = 1] = rgb[1].split(",").map(Number);
  return [r, g, b, a];
};
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (fgValue, bgValue) => {
  const bg = parseColor(bgValue);
  const [high, low] = [luminance(over(parseColor(fgValue), bg)), luminance(bg)].sort(
    (a, b) => b - a
  );
  return (high + 0.05) / (low + 0.05);
};

// What every theme must meet, on both the work area and the cards on it, so
// no theme can make the app harder to read than the default
// (design/features/theme-picker/feature-brief.md, "Constraints").
const ON_SURFACES = [
  ["text-primary", 7],
  ...[
    "text-secondary",
    "text-muted",
    "accent",
    "income",
    "expense",
    "danger",
    "text-validation",
    "chart-income",
    "chart-expense",
    "chart-warning",
  ].map((name) => [name, 4.5]),
  ["warning", 3],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => [`chart-categorical-${i}`, 3]),
];

const contrastProblems = (theme) => {
  const all = { ...theme.color, ...theme.chart };
  const checks = [
    ...["bg-surface", "bg-raised"].flatMap((bg) =>
      ON_SURFACES.map(([fg, min]) => [fg, bg, min])
    ),
    ["text-primary", "bg-page", 7],
    ["text-on-accent", "accent", 4.5],
    ["text-on-accent", "accent-hover", 4.5],
  ];
  return checks
    .map(([fg, bg, min]) => ({ fg, bg, min, ratio: contrast(all[fg], all[bg]) }))
    .filter(({ ratio, min }) => ratio < min)
    .map(({ fg, bg, min, ratio }) => `${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`);
};

const catalog = readThemeCatalog(tokens);

describe("the theme catalog", () => {
  it("lists the default theme first and exactly once", () => {
    expect(catalog[0].default).toBe(true);
    expect(catalog.filter((theme) => theme.default)).toHaveLength(1);
  });

  it("gives every theme a unique id matching its file name", () => {
    const files = fs
      .readdirSync(path.join(__dirname, "catalog"))
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
      .sort();
    expect(catalog.map((theme) => theme.id).sort()).toEqual(files);
  });

  it("gives the default theme exactly the tokens in tokens.json", () => {
    THEMED_GROUPS.forEach((group) => {
      expect(catalog[0][group]).toEqual(tokens[group]);
    });
  });

  it("reads the files of another directory", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "themes-"));
    fs.writeFileSync(path.join(dir, "b.json"), JSON.stringify({ id: "b" }));
    fs.writeFileSync(
      path.join(dir, "a.json"),
      JSON.stringify({ id: "a", default: true })
    );
    expect(readThemeCatalog(tokens, dir).map((theme) => theme.id)).toEqual([
      "a",
      "b",
    ]);
  });

  describe.each(catalog.map((theme) => [theme.id, theme]))("%s", (id, theme) => {
    it("has a name, a scheme and a description in every language", () => {
      expect(theme.name).toEqual(expect.any(String));
      expect(theme.inspiration).toEqual(expect.any(String));
      expect(["dark", "light"]).toContain(theme.scheme);
      LANGUAGES.forEach((language) => {
        expect(theme.description[language]).toEqual(expect.any(String));
      });
    });

    it("sets every themed token and nothing else", () => {
      THEMED_GROUPS.forEach((group) => {
        expect(Object.keys(theme[group]).sort()).toEqual(
          Object.keys(tokens[group]).sort()
        );
      });
    });

    it("meets the contrast rules", () => {
      expect(contrastProblems(theme)).toEqual([]);
    });
  });
});
