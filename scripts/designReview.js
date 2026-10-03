#!/usr/bin/env node
// The design reviewer's measuring tool: renders each approved screen of a
// feature from its mockup AND from the real built app (seeded from
// fixtures.json), compares the two pixel by pixel and writes a report with the
// mockup, the app and the difference side by side (design/README.md).
//
//   npm run build                                   # the app to review
//   npm run design:review -- --feature <slug>       # serves build/ itself
//   npm run design:review -- --feature <slug> --url http://localhost:3000
//
// Options: --tolerance <0-255> per-channel slack (default 12);
//          --threshold <percent> allowed differing pixels (default 2);
//          --out <dir> report folder (default design/.review/<slug>).
// Needs Playwright with a Chromium (`playwright` or `playwright-core`; set
// PLAYWRIGHT_MODULE to its path if it is installed elsewhere) and Node 18+.
// Exits 1 when any screen does not match, 2 when the setup is wrong.

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { serveStatic } = require("../src/uiGallery/serveStatic");
const { scanFeatures } = require("../src/uiGallery/scanFeatures");
const { planReview } = require("../src/uiGallery/reviewPlan");
const { diffPixels } = require("../src/uiGallery/pixelDiff");
const {
  buildReportHtml,
  buildReportMarkdown,
  judgeScreen,
} = require("../src/uiGallery/reviewReport");

const repoRoot = path.resolve(__dirname, "..");
const designDir = path.join(repoRoot, "design");

const fail = (message) => {
  console.error(message);
  process.exit(2);
};

const parseArgs = (argv) => {
  const args = { tolerance: 12, threshold: 2 };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith("--") || value === undefined)
      fail(`Unexpected argument "${key}".`);
    args[key.slice(2)] = ["tolerance", "threshold"].includes(key.slice(2))
      ? Number(value)
      : value;
  }
  if (!args.feature)
    fail("Missing --feature <slug> (a folder in design/features/).");
  if (![args.tolerance, args.threshold].every(Number.isFinite)) {
    fail("--tolerance and --threshold must be numbers.");
  }
  return args;
};

const loadPlaywright = () => {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    "playwright",
    "playwright-core",
  ];
  for (const name of candidates.filter(Boolean)) {
    try {
      return require(name);
    } catch (error) {
      // Try the next candidate.
    }
  }
  return fail(
    "Playwright was not found. Install it (for example `npm install --no-save playwright && npx playwright install chromium`) or set PLAYWRIGHT_MODULE to its path."
  );
};

// Playwright's own browser when installed; otherwise a Chromium found under
// PLAYWRIGHT_BROWSERS_PATH (what the Claude Code web sandbox provides).
const findChromium = () => {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsers || !fs.existsSync(browsers)) return undefined;
  const folder = fs
    .readdirSync(browsers)
    .find((name) => /^chromium-\d+$/.test(name));
  const executable =
    folder && path.join(browsers, folder, "chrome-linux", "chrome");
  return executable && fs.existsSync(executable) ? executable : undefined;
};

const FREEZE_MOTION =
  "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";

const captureMockup = async (browser, screen) => {
  const context = await browser.newContext({ viewport: screen.viewport });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(designDir, screen.mockupPath)).href);
  await page.addStyleTag({ content: FREEZE_MOTION });
  const png = await page.locator(screen.region.mockup).first().screenshot();
  await context.close();
  return png;
};

const runAction = async (page, action) => {
  if (action.click) await page.click(action.click, { timeout: 10000 });
  if (action.fill)
    await page.fill(action.fill[0], action.fill[1], { timeout: 10000 });
  if (action.wait) await page.waitForTimeout(action.wait);
  // A click leaves its target focused (and styled as focused); blur says the
  // design shows the screen without that leftover focus.
  if (action.blur) await page.evaluate(() => document.activeElement?.blur());
};

const captureApp = async (browser, baseUrl, screen) => {
  const context = await browser.newContext({
    viewport: screen.viewport,
    serviceWorkers: "block",
  });
  // Seed the app's storage before any of its code runs, as fixtures.json says.
  await context.addInitScript((entries) => {
    Object.entries(entries).forEach(([key, value]) =>
      window.localStorage.setItem(key, value)
    );
  }, screen.localStorage);
  const page = await context.newPage();
  await page.goto(baseUrl + screen.route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: FREEZE_MOTION });
  await page
    .locator(screen.region.app)
    .first()
    .waitFor({ state: "visible", timeout: 10000 });
  for (const action of screen.actions) {
    await runAction(page, action);
  }
  // Park the pointer away from the page so a hover left over from an action
  // is not mistaken for part of the design.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const png = await page.locator(screen.region.app).first().screenshot();
  await context.close();
  return png;
};

// Decodes both PNGs in a blank page and diffs them there, on the larger of
// the two sizes (the missing area counts as different, so a size mismatch is
// visible in the diff image).
const comparePngs = (page, mockupPng, appPng, tolerance) =>
  page.evaluate(
    async ({ mockupB64, appB64, tolerance: slack, source }) => {
      // eslint-disable-next-line no-new-func
      const compare = new Function(`return (${source})`)();
      const load = (b64) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = `data:image/png;base64,${b64}`;
        });
      const [mockup, app] = await Promise.all([load(mockupB64), load(appB64)]);
      const width = Math.max(mockup.width, app.width);
      const height = Math.max(mockup.height, app.height);
      const pixels = (image) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, width, height).data;
      };
      const result = compare(pixels(mockup), pixels(app), width, height, slack);
      const out = document.createElement("canvas");
      out.width = width;
      out.height = height;
      out
        .getContext("2d")
        .putImageData(new ImageData(result.diff, width, height), 0, 0);
      return {
        mockupSize: { width: mockup.width, height: mockup.height },
        appSize: { width: app.width, height: app.height },
        differing: result.differing,
        ratio: result.ratio,
        diffB64: out.toDataURL("image/png").split(",")[1],
      };
    },
    {
      mockupB64: mockupPng.toString("base64"),
      appB64: appPng.toString("base64"),
      tolerance,
      source: diffPixels.toString(),
    }
  );

const reviewScreen = async (browser, comparePage, baseUrl, screen, options) => {
  const files = {
    mockup: `${screen.id}.mockup.png`,
    app: `${screen.id}.app.png`,
    diff: `${screen.id}.diff.png`,
  };
  try {
    const mockupPng = await captureMockup(browser, screen);
    const appPng = await captureApp(browser, baseUrl, screen);
    const measured = await comparePngs(
      comparePage,
      mockupPng,
      appPng,
      options.tolerance
    );
    fs.writeFileSync(path.join(options.out, files.mockup), mockupPng);
    fs.writeFileSync(path.join(options.out, files.app), appPng);
    fs.writeFileSync(
      path.join(options.out, files.diff),
      Buffer.from(measured.diffB64, "base64")
    );
    const { diffB64, ...numbers } = measured;
    return {
      id: screen.id,
      ...numbers,
      ...judgeScreen(numbers, options.threshold),
      files,
    };
  } catch (error) {
    // A screen that cannot be captured is a failed screen, not a crashed run.
    return {
      id: screen.id,
      pass: false,
      reason: `could not capture: ${error.message.split("\n")[0]}`,
    };
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const feature = scanFeatures(designDir).find(
    (item) => item.slug === args.feature
  );
  if (!feature)
    fail(`No feature "${args.feature}" with a ui/ folder in design/features/.`);
  if (feature.problems.length > 0)
    fail(["The package has problems:", ...feature.problems].join("\n  - "));

  const fixturesFile = path.join(
    designDir,
    "features",
    feature.slug,
    "ui",
    "fixtures.json"
  );
  if (!fs.existsSync(fixturesFile))
    fail(`${feature.slug} has no ui/fixtures.json.`);
  const { screens, problems } = planReview(
    feature.approved,
    JSON.parse(fs.readFileSync(fixturesFile, "utf8"))
  );
  if (problems.length > 0)
    fail(["fixtures.json problems:", ...problems].join("\n  - "));

  const out = path.resolve(
    args.out || path.join(designDir, ".review", feature.slug)
  );
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const buildDir = path.join(repoRoot, "build");
  if (!args.url && !fs.existsSync(path.join(buildDir, "index.html"))) {
    fail(
      "No build/ found. Run `npm run build` first, or pass --url of a running app."
    );
  }
  const server = args.url ? null : await serveStatic(buildDir);
  const baseUrl = (args.url || server.url).replace(/\/$/, "");

  const browser = await loadPlaywright().chromium.launch({
    executablePath: findChromium(),
  });
  const comparePage = await (await browser.newContext()).newPage();
  const results = [];
  for (const screen of screens) {
    results.push(
      await reviewScreen(browser, comparePage, baseUrl, screen, {
        ...args,
        out,
      })
    );
    const last = results[results.length - 1];
    console.log(`${last.pass ? "✅" : "❌"} ${last.id}: ${last.reason}`);
  }
  await browser.close();
  if (server) await server.close();

  const options = {
    tolerance: args.tolerance,
    thresholdPercent: args.threshold,
  };
  fs.writeFileSync(
    path.join(out, "report.json"),
    `${JSON.stringify(results, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(out, "report.md"),
    buildReportMarkdown(feature.slug, results, options)
  );
  fs.writeFileSync(
    path.join(out, "index.html"),
    buildReportHtml(feature.slug, results, options)
  );
  console.log(
    `\nReport: ${path.relative(repoRoot, path.join(out, "index.html"))}`
  );
  process.exit(results.every((result) => result.pass) ? 0 : 1);
};

main().catch((error) => fail(error.stack || String(error)));
