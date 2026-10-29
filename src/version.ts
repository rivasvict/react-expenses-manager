/**
 * The app version, taken from `package.json` at build time through the
 * `REACT_APP_VERSION` variable (defined in vite.config.mjs, and in
 * config/jest/env.js for the tests). It is empty if that variable is
 * missing; callers should render nothing then.
 */
export const APP_VERSION = process.env.REACT_APP_VERSION ?? "";
