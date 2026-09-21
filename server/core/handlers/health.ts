// GET /api/health: an unauthenticated liveness probe. It exists so a client
// can answer "is the sync server reachable right now?" with one cheap call
// that reads nothing and writes nothing — the app bar's online/offline ring
// polls it, and a deploy can curl it.
//
// Deliberately outside the endpoint numbering of
// docs/multi-user-sync/RFC.md §3: it carries no user data and is not part of
// the sync contract, so it neither authenticates nor touches storage.
import { Handler } from "../handlers.types";
import { HTTP_STATUS } from "../httpConstants";

export const createHealthHandler =
  (): Handler =>
  async () => ({ status: HTTP_STATUS.OK, body: { status: "ok" as const } });
