// Generates build/service-worker.js from the finished CRA build/ output.
// Run as a postbuild step (see package.json "postbuild") so it always
// precaches the final, content-hashed filenames.
//
// Deployment context: docs/deployment/tailscale-sync.md — the app is served
// from a single https://<host>.ts.net origin with /api/* reverse-proxied to
// the sync server (server/), so "/api/" below covers all sync traffic.
module.exports = {
  globDirectory: "build",
  globPatterns: ["**/*.{js,css,html,png,svg,ico,json,txt}"],
  // The service worker itself and source maps must never be precached.
  globIgnores: ["service-worker.js", "**/*.map"],
  swDest: "build/service-worker.js",
  // Precached routes fall back to cache-first (Workbox default for the
  // precache) which is correct for hashed static assets. Anything under
  // /api/* is the sync backend (src/services/syncApi) and must always hit
  // the network — never precached, never served stale from a cache.
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
    },
  ],
};
