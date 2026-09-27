import fs from "fs";
import path from "path";
import tokens from "./tokens.json";
import { buildOutputs, toCss, toScss, tokenEntries } from "./tokenFormats";

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
  it("renders one SCSS variable per token under a group comment", () => {
    expect(toScss(sample)).toBe(
      "// GENERATED from src/styles/tokens.json by `npm run tokens:build` — do not edit.\n\n" +
        "// color\n$bg-page: #0e1116;\n$accent: #f0b90b;\n\n" +
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

describe("generated files", () => {
  const repoRoot = path.resolve(__dirname, "../..");

  it.each(Object.entries(buildOutputs(tokens)))(
    "%s is in sync with tokens.json (run `npm run tokens:build`)",
    (relativePath, expected) => {
      const actual = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(actual).toBe(expected);
    }
  );
});
