// Dev server and production build (`npm start`, `npm run build`).
//
// The app was bootstrapped with Create React App, and this config keeps the
// parts of CRA's behaviour the code relies on:
//   - JSX in plain `.js` files (see jsxInJs below),
//   - `process.env.REACT_APP_*`, `process.env.NODE_ENV` and
//     `process.env.PUBLIC_URL` read at build time (see processEnv below),
//   - output in build/, which workbox-config.js and deploy.sh read,
//   - autoprefixed CSS for the browsers in package.json "browserslist".
import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import packageJson from "./package.json" with { type: "json" };

// Vite only parses JSX in .jsx/.tsx files, while the existing `.js` sources
// keep their extension (CLAUDE.md) and hold JSX. Compile those first, with
// the language forced to JSX, so Vite's own transform sees plain JS.
const jsxInJs = () => ({
  name: "jsx-in-js",
  enforce: "pre",
  transform(code, id) {
    if (!/\/src\/.*\.js$/.test(id)) return null;
    return transformWithOxc(code, id, {
      lang: "jsx",
      jsx: { runtime: "automatic" },
    });
  },
});

export default defineConfig(({ mode }) => {
  // Same lookup as CRA: .env, .env.local, .env.<mode>, .env.<mode>.local and
  // the shell environment (deploy.sh passes REACT_APP_SYNC_API_HOST there),
  // keeping only REACT_APP_* names so no other variable reaches the bundle.
  const processEnv = {
    ...loadEnv(mode, process.cwd(), "REACT_APP_"),
    NODE_ENV: mode === "production" ? "production" : "development",
    PUBLIC_URL: "",
    // Taken from package.json so the UI never drifts from the released
    // version (src/version.ts).
    REACT_APP_VERSION: packageJson.version,
  };

  return {
    plugins: [jsxInJs(), react()],
    // The whole object is defined, as CRA did, so reading a variable that is
    // not set gives undefined instead of failing on a missing `process`.
    define: { "process.env": JSON.stringify(processEnv) },
    css: {
      postcss: { plugins: [autoprefixer()] },
      // Every stylesheet pulls in src/variables.scss through @import, which
      // Dart Sass now flags on each use. Moving to @use is a separate change.
      preprocessorOptions: { scss: { silenceDeprecations: ["import"] } },
    },
    // The dev server's dependency scan parses the sources on its own, outside
    // the plugin pipeline above, and would otherwise crawl every mockup page
    // under design/ too.
    optimizeDeps: {
      entries: ["index.html"],
      rolldownOptions: { plugins: [jsxInJs()] },
    },
    build: { outDir: "build", sourcemap: true },
    server: { port: 3000 },
    preview: { port: 3000 },
  };
});
