// Method+path router for the sync server core. `createApp` wires the
// handlers to the RFC §3 routes (docs/multi-user-sync/RFC.md) and exposes a
// single transport-agnostic entry point, so the node:http adapter
// (server/index.ts) and the contract tests exercise exactly the same code.
import { createHandlers } from "./handlers";
import { AppRequest, AppResponse } from "./handlers.types";
import { ERROR_CODES, HTTP_STATUS } from "./httpConstants";
import { App, CreateAppOptions, Route } from "./router.types";

export type { App, CreateAppOptions, Route } from "./router.types";

// Segments starting with a colon are parameters; everything else must match
// literally. Matching is by whole segments, so a parameter never swallows a
// slash and a pattern with a different number of segments never matches.
const PARAMETER_PREFIX = ":";

// Matches a request path against a route pattern such as
// "/api/party/members/:userId/block", returning the captured parameters
// ({ userId: "abc" }) or null when the path does not fit the pattern. A
// pattern with no parameters is an exact string comparison, so the static
// routes keep the behaviour they had before parameters existed.
//
// Captured values are percent-decoded, because the client encodes a user id
// it puts in a path (encodeURIComponent) and a handler wants the id back.
// Malformed encoding is a non-match rather than an exception: decoding
// throws a URIError, and a bad path should read as 404, not as a 500.
export const matchPath = (
  pattern: string,
  path: string
): Record<string, string> | null => {
  const patternSegments = pattern.split("/");
  const pathSegments = path.split("/");
  if (patternSegments.length !== pathSegments.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const actual = pathSegments[index];
    if (expected.startsWith(PARAMETER_PREFIX)) {
      // An empty segment ("/members//block") is not a value for the
      // parameter; the route does not match at all.
      if (actual === "") return null;
      try {
        params[expected.slice(PARAMETER_PREFIX.length)] =
          decodeURIComponent(actual);
      } catch (decodeError) {
        return null;
      }
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
};

export const createApp = ({
  storage,
  tokenSecret,
  encryptionSecret,
  now,
}: CreateAppOptions): App => {
  const handlers = createHandlers({
    storage,
    tokenSecret,
    encryptionSecret,
    now,
  });

  const routes: Route[] = [
    { method: "POST", path: "/api/auth/signup", handler: handlers.signup },
    { method: "POST", path: "/api/auth/login", handler: handlers.login },
    { method: "GET", path: "/api/me", handler: handlers.me },
    { method: "POST", path: "/api/party", handler: handlers.createParty },
    {
      method: "POST",
      path: "/api/party/invitations",
      handler: handlers.createInvitation,
    },
    { method: "POST", path: "/api/party/join", handler: handlers.joinParty },
    {
      method: "POST",
      path: "/api/party/members/:userId/block",
      handler: handlers.blockMember,
    },
    { method: "POST", path: "/api/party/cancel", handler: handlers.cancelParty },
    { method: "GET", path: "/api/party/backup", handler: handlers.getBackup },
    { method: "PUT", path: "/api/party/backup", handler: handlers.putBackup },
  ];

  // request: { method, path, headers, body } → { status, body }. The first
  // route whose method and pattern both fit wins, and the handler receives
  // the request with the pattern's captured parameters attached.
  const handle = async (request: AppRequest): Promise<AppResponse> => {
    for (const route of routes) {
      if (route.method !== request.method) continue;
      const params = matchPath(route.path, request.path);
      if (params !== null) return route.handler({ ...request, params });
    }
    return {
      status: HTTP_STATUS.NOT_FOUND,
      body: { error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." } },
    };
  };

  return { handle };
};
