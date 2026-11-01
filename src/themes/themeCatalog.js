// Reads the theme catalog: one JSON file per theme in src/themes/catalog/.
// Adding a theme means adding a file there and running `npm run tokens:build`;
// nothing else in the app lists themes by hand. The default theme's file
// carries only its metadata: its tokens are src/styles/tokens.json.
// CommonJS so the plain-Node build script can require it (see tokenFormats.js).

const fs = require("fs");
const path = require("path");

const CATALOG_DIR = path.join(__dirname, "catalog");
const THEMED_GROUPS = ["color", "chart", "shadow"];

// The default theme first, then the rest by file name.
const readThemeCatalog = (tokens, dir = CATALOG_DIR) => {
  const themes = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")))
    .map((theme) =>
      theme.default
        ? {
            ...theme,
            ...Object.fromEntries(THEMED_GROUPS.map((g) => [g, tokens[g]])),
          }
        : theme
    );
  return [
    ...themes.filter((theme) => theme.default),
    ...themes.filter((theme) => !theme.default),
  ];
};

module.exports = { CATALOG_DIR, THEMED_GROUPS, readThemeCatalog };
