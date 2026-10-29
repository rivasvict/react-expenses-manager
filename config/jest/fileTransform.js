const path = require("path");

// An imported asset (e.g. `import image from "./x.png"`) becomes its file
// name, which is enough for an <img src> under jsdom.
module.exports = {
  process(_sourceText, sourcePath) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
    };
  },
};
