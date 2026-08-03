// Method+path router for the sync server core. `createApp` wires the
// handlers to the RFC §3 routes and exposes a single transport-agnostic
// entry point, so the node:http adapter (server/index.ts) and the contract
// tests exercise exactly the same code.
import { createHandlers } from "./handlers";
import { AppRequest, AppResponse } from "./handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "./httpConstants";
import { App, CreateAppOptions, Route } from "./router.types";

export type { App, CreateAppOptions, Route } from "./router.types";

export const createApp = ({
  storage,
  tokenSecret,
  now,
}: CreateAppOptions): App => {
  const handlers = createHandlers({ storage, tokenSecret, now });

  const routes: Route[] = [
    { method: "POST", path: "/api/auth/signup", handler: handlers.signup },
    { method: "POST", path: "/api/auth/login", handler: handlers.login },
    { method: "GET", path: "/api/me", handler: handlers.me },
  ];

  // request: { method, path, headers, body } → { status, body }
  const handle = async (request: AppRequest): Promise<AppResponse> => {
    const route = routes.find(
      (candidate) =>
        candidate.method === request.method && candidate.path === request.path
    );
    if (!route)
      return {
        status: HTTP_STATUS.NOT_FOUND,
        body: { error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." } },
      };
    return route.handler(request);
  };

  return { handle };
};
