const REACT_APP_API_HOST =
  process.env.REACT_APP_API_HOST || "http://localhost:9000";

// Multi-user sync backend (docs/multi-user-sync/RFC.md §3). Distinct from
// REACT_APP_API_HOST, which stays owned by the dormant expenses-manager-api.
//
// Development and tests fall back to the local sync server. A production build
// made without an address has no sync server at all ("not configured"), and the
// app hides everything that needs one instead of offering actions that
// cannot work.
const REACT_APP_SYNC_API_HOST =
  process.env.REACT_APP_SYNC_API_HOST ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

export const config = {
  REACT_APP_API_HOST,
  REACT_APP_SYNC_API_HOST,
};

// Read at call time (not captured at import) so a test can change the
// configured address.
export const isSyncConfigured = () => Boolean(config.REACT_APP_SYNC_API_HOST);
