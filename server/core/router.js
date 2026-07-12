// Method+path router for the sync server core. `createApp` wires the
// handlers to the RFC §3 routes and exposes a single transport-agnostic
// entry point, so the node:http adapter (server/index.js) and the contract
// tests exercise exactly the same code.
const { createHandlers, ERROR_CODES } = require("./handlers");
const { deriveEncryptionKey } = require("./invitations");

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
  ];

  // request: { method, path, headers, body } → { status, body }
  const handle = async (request) => {
    const route = routes.find(
      (candidate) =>
        candidate.method === request.method && candidate.path === request.path
    );
    if (!route)
      return {
        status: 404,
        body: { error: { code: ERROR_CODES.NOT_FOUND, message: "Not found." } },
      };
    return route.handler(request);
  };

  return { handle };
};

module.exports = { createApp };
