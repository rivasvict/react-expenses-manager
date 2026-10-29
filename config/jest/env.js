// Build-time variables the app reads (vite.config.mjs defines the same ones
// for the browser bundle).
process.env.REACT_APP_VERSION = require("../../package.json").version;
process.env.PUBLIC_URL = "";
