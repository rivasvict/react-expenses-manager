// Method+path router for the sync server core. `createApp` wires the
// handlers to the RFC §3 routes and exposes a single transport-agnostic
// entry point, so the node:http adapter (server/index.js) and the contract
// tests exercise exactly the same code.
const { createHandlers, ERROR_CODES } = require("./handlers");
const { deriveEncryptionKey } = require("./invitations");

// Matches "/api/party/members/abc/block" against
// "/api/party/members/:userId/block" → { userId: "abc" }, or null.
const matchPath = (pattern, path) => {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    if (patternParts[index].startsWith(":")) {
      try {
        params[patternParts[index].slice(1)] = decodeURIComponent(
          pathParts[index]
        );
      } catch (decodeError) {
        // Malformed percent-encoding is a no-match (→ 404), never a 500.
        return null;
      }
    } else if (patternParts[index] !== pathParts[index]) {
      return null;
    }
  }
  return params;
};

const createApp = ({ storage, tokenSecret, encryptionSecret, now }) => {
  const handlers = createHandlers({
    storage,
    tokenSecret,
    encryptionKey: deriveEncryptionKey(encryptionSecret || "dev-encryption-key"),
    now,
  });

  const routes = [
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

  // request: { method, path, headers, body } → { status, body }
  const handle = async (request) => {
    for (const route of routes) {
      if (route.method !== request.method) continue;
      const params = matchPath(route.path, request.path);
      if (params !== null) return route.handler({ ...request, params });
    }
    return {
      status: 404,
      body: { error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." } },
    };
  };

  return { handle };
};

module.exports = { createApp };
