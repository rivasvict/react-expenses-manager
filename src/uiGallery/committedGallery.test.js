// Guards the real design/ tree, like src/styles/tokenFormats.test.js guards the
// generated token files: every feature's ui/ folder follows the convention,
// every mockup follows the design-system rules, and design/gallery.html is
// up to date (run `npm run gallery:build` to fix a failure here).

import fs from "fs";
import path from "path";
import { checkMockups } from "./mockupGuard";
import { buildGalleryHtml } from "./galleryHtml";
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

  it("design/gallery.html is in sync with the ui/ folders", () => {
    const committed = fs.readFileSync(
      path.join(designDir, "gallery.html"),
      "utf8"
    );
    expect(committed).toBe(buildGalleryHtml(features));
  });
});
