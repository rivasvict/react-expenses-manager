/**
 * The app version, taken from `package.json` at build time through the
 * `REACT_APP_VERSION` variable that the committed `.env.*` files expand from
 * `$npm_package_version`. It is empty when the app is launched without npm
 * (e.g. `npx react-scripts` directly); callers should render nothing then.
 */
export const APP_VERSION = process.env.REACT_APP_VERSION ?? "";
