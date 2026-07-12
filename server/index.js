// Local dev sync server (RFC §6, NFR-4): node:http adapter around the
// framework-free core, with CORS for the CRA dev server and on-disk JSON
// storage under server/.data/ (gitignored).
//
// Run with: npm run sync-server   (defaults to port 4000)
const http = require("node:http");
const path = require("node:path");
const { createApp } = require("./core/router");
const { createFsStorage } = require("./storage-fs");

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB (RFC §3)

// Sentinel so the catch-all can tell an oversized body (413, expected with
// real backup envelopes) apart from genuine internal errors (500).
class PayloadTooLargeError extends Error {}

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // Stop buffering but keep draining (discarding) the rest, so the
        // socket stays healthy for writing the 413 response — destroying
        // the request here would reset the connection instead.
        request.removeAllListeners("data");
        request.resume();
        reject(new PayloadTooLargeError("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });

// Exported for the contract tests; `npm run sync-server` runs the listen
// block at the bottom.
const createSyncHttpServer = ({
  storageDir = path.join(__dirname, ".data"),
  corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000",
  // Dev-only default secrets; override in any real deployment (RFC §6).
  tokenSecret = process.env.TOKEN_SECRET || "dev-token-secret",
  encryptionSecret = process.env.ENCRYPTION_KEY || "dev-encryption-key",
} = {}) => {
  const app = createApp({
    storage: createFsStorage({ dir: storageDir }),
    tokenSecret,
    encryptionSecret,
  });

  return http.createServer(async (request, response) => {
    const sendJson = (status, body) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": corsOrigin,
      });
      response.end(JSON.stringify(body));
    };

    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        });
        response.end();
        return;
      }

      const rawBody = await readBody(request);
      let body = null;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch (error) {
          sendJson(400, {
            error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." },
          });
          return;
        }
      }

      const { pathname } = new URL(request.url, "http://localhost");
      const result = await app.handle({
        method: request.method,
        path: pathname,
        headers: request.headers,
        body,
      });
      sendJson(result.status, result.body);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        sendJson(413, {
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "The request body exceeds the 1 MB limit.",
          },
        });
        return;
      }
      // Never log request bodies here — they can contain credentials (AC-1.2).
      console.error("sync-server error:", error.message);
      sendJson(500, {
        error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
      });
    }
  });
};

module.exports = { createSyncHttpServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  createSyncHttpServer().listen(port, () => {
    console.log(`Sync server listening on http://localhost:${port}`);
  });
}
