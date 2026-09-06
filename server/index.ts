// Local dev sync server (RFC §6, NFR-4): node:http adapter around the
// framework-free core, with CORS for the CRA dev server and on-disk JSON
// storage under server/.data/ (gitignored).
//
// Run with: npm run sync-server   (defaults to port 4000)
import http from "node:http";
import path from "node:path";
import { createApp, App } from "./core/router";
import { createFsStorage } from "./storage-fs";
import { ERROR_CODES, HTTP_STATUS } from "./core/httpConstants";
import { createJsonResponder, PayloadTooLargeError, readBody } from "./utils";

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// Dev-only default secrets; override in any real deployment (RFC §6). Left
// unset, ENCRYPTION_KEY falls back to the core's own dev default, so a
// local run works with no environment at all.
const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-token-secret";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB (RFC §3)

// This file runs compiled, from server/dist/, so the data directory is one
// level up — it stays at server/.data/ (gitignored), as documented.
const DATA_DIR = path.join(__dirname, "..", ".data");

export interface RequestListenerOptions {
  app: App;
  corsOrigin?: string;
  maxBodyBytes?: number;
  port?: number;
}

// Exported so the transport layer is testable without binding a well-known
// port: the tests build a listener over an in-memory storage app and drive it
// through a server on an ephemeral port.
export const createRequestListener = ({
  app,
  corsOrigin = CORS_ORIGIN,
  maxBodyBytes = MAX_BODY_BYTES,
  port = PORT,
}: RequestListenerOptions): http.RequestListener =>
  async (request, response) => {
    const sendJson = createJsonResponder(response, corsOrigin);

    try {
      if (request.method === "OPTIONS") {
        response.writeHead(HTTP_STATUS.NO_CONTENT, {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        });
        response.end();
        return;
      }

      const rawBody = await readBody(request, maxBodyBytes);
      let body: unknown = null;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch (error) {
          sendJson(HTTP_STATUS.BAD_REQUEST, {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: "Invalid JSON body.",
            },
          });
          return;
        }
      }

      // `url`/`method` are always set for server-side requests; the fallbacks
      // exist only to satisfy the types and route to the same 404 the core
      // would return anyway.
      const { pathname } = new URL(
        request.url ?? "/",
        `http://localhost:${port}`
      );
      const result = await app.handle({
        method: request.method ?? "",
        path: pathname,
        headers: request.headers,
        body,
      });
      sendJson(result.status, result.body);
    } catch (error) {
      // An oversized body is a client mistake with a specific status, not an
      // unexpected failure — answer 413 rather than the generic 500 below.
      if (error instanceof PayloadTooLargeError) {
        sendJson(HTTP_STATUS.PAYLOAD_TOO_LARGE, {
          error: {
            code: ERROR_CODES.PAYLOAD_TOO_LARGE,
            message: "Request body is too large.",
          },
        });
        return;
      }
      // Never log request bodies here — they can contain credentials (AC-1.2).
      console.error(
        "sync-server error:",
        error instanceof Error ? error.message : error
      );
      sendJson(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "Something went wrong.",
        },
      });
    }
  };

// Only bind a port when this file is the entry point (npm run sync-server).
// Importing it from a test must not start a listener.
if (require.main === module) {
  const server = http.createServer(
    createRequestListener({
      app: createApp({
        storage: createFsStorage({ dir: DATA_DIR }),
        tokenSecret: TOKEN_SECRET,
        encryptionSecret: ENCRYPTION_KEY,
      }),
    })
  );
  server.listen(PORT, () => {
    console.log(`Sync server listening on http://localhost:${PORT}`);
  });
}
