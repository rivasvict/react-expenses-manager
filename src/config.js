const REACT_APP_API_HOST =
  process.env.REACT_APP_API_HOST || "http://localhost:9000";

// Multi-user sync backend (docs/multi-user-sync/RFC.md §3). Distinct from
// REACT_APP_API_HOST, which stays owned by the dormant expenses-manager-api.
//
// Development and tests fall back to the local sync server. A production build
// made without an address has no sync server at all ("not configured"), and the
// app hides everything that needs one instead of offering actions that
// cannot work.
//
// A release bundle is host-agnostic (docs/deployment/README.md): it is built
// once and served from whichever origin hosts it, with the sync server behind
// the same origin's /api. An empty address already means "not configured", so
// that case is opted into explicitly with this value instead.
export const SYNC_API_SAME_ORIGIN = "same-origin";

const configuredSyncHost = process.env.REACT_APP_SYNC_API_HOST;
const syncIsSameOrigin = configuredSyncHost === SYNC_API_SAME_ORIGIN;

const REACT_APP_SYNC_API_HOST = syncIsSameOrigin
  ? ""
  : configuredSyncHost ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

export const config = {
  REACT_APP_API_HOST,
  REACT_APP_SYNC_API_HOST,
  // Tracked apart from the base string because same-origin has an empty base
  // (requests become relative `/api/...`) yet is a configured server.
  REACT_APP_SYNC_SAME_ORIGIN: syncIsSameOrigin,
};

// Read at call time (not captured at import) so a test can change the
// configured address.
export const isSyncConfigured = () =>
  Boolean(config.REACT_APP_SYNC_API_HOST) || config.REACT_APP_SYNC_SAME_ORIGIN;
