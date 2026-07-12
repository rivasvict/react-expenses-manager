const REACT_APP_API_HOST =
  process.env.REACT_APP_API_HOST || "http://localhost:9000";

// Multi-user sync backend (docs/multi-user-sync/RFC.md §3). Distinct from
// REACT_APP_API_HOST, which stays owned by the dormant expenses-manager-api.
const REACT_APP_SYNC_API_HOST =
  process.env.REACT_APP_SYNC_API_HOST || "http://localhost:4000";

export const config = {
  REACT_APP_API_HOST,
  REACT_APP_SYNC_API_HOST,
};
