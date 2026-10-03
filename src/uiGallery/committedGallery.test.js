// Guards the real design/ tree, like src/styles/tokenFormats.test.js guards the
// generated token files: every feature's ui/ folder follows the convention,
// every mockup follows the design-system rules, and every generated file
// (design/gallery.html, each ui/flow.html) is up to date (run `npm run gallery:build` to fix a failure here).

import fs from "fs";
import path from "path";
import { checkGeneratedFlows, generatedFiles } from "./generate";
import { checkMockups } from "./mockupGuard";
import { scanFeatures } from "./scanFeatures";

const designDir = path.resolve(__dirname, "../../design");
const features = scanFeatures(designDir);

describe("design/ UI packages", () => {
  it("every feature's ui/ folder follows the convention", () => {
    expect(features.flatMap((feature) => feature.problems)).toEqual([]);
  });

  it("every mockup follows the design-system rules", () => {
    expect(checkMockups(designDir, features)).toEqual([]);
  });

  it("every generated flow page follows the mockup rules", () => {
    expect(checkGeneratedFlows(generatedFiles(features))).toEqual([]);
  });

  it.each(Object.keys(generatedFiles(features)))(
    "design/%s is in sync with the ui/ folders (run `npm run gallery:build`)",
    (relativePath) => {
      const committed = fs.readFileSync(
        path.join(designDir, relativePath),
        "utf8"
      );
      expect(committed).toBe(generatedFiles(features)[relativePath]);
    }
  );
});
