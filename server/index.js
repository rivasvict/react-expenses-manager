// Local dev sync server (RFC §6, NFR-4): node:http adapter around the
// framework-free core, with CORS for the CRA dev server and on-disk JSON
// storage under server/.data/ (gitignored).
//
// Run with: npm run sync-server   (defaults to port 4000)
const http = require("node:http");
const path = require("node:path");
const { createApp } = require("./core/router");
const { createFsStorage } = require("./storage-fs");

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// Dev-only default secrets; override in any real deployment (RFC §6).
const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-token-secret";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "dev-encryption-key";
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB (RFC §3)

const app = createApp({
  storage: createFsStorage({ dir: path.join(__dirname, ".data") }),
  tokenSecret: TOKEN_SECRET,
  encryptionSecret: ENCRYPTION_KEY,
});

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Payload too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });

const server = http.createServer(async (request, response) => {
  const sendJson = (status, body) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": CORS_ORIGIN,
    });
    response.end(JSON.stringify(body));
  };

  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": CORS_ORIGIN,
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

    const { pathname } = new URL(request.url, `http://localhost:${PORT}`);
    const result = await app.handle({
      method: request.method,
      path: pathname,
      headers: request.headers,
      body,
    });
    sendJson(result.status, result.body);
  } catch (error) {
    // Never log request bodies here — they can contain credentials (AC-1.2).
    console.error("sync-server error:", error.message);
    sendJson(500, {
      error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
    });
  }
});

server.listen(PORT, () => {
  console.log(`Sync server listening on http://localhost:${PORT}`);
});
