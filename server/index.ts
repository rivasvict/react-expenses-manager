// Local dev sync server (RFC §6, NFR-4): node:http adapter around the
// framework-free core, with CORS for the CRA dev server and on-disk JSON
// storage under server/.data/ (gitignored).
//
// Run with: npm run sync-server   (defaults to port 4000)
import http from "node:http";
import path from "node:path";
import { createApp, App } from "./core/router";
import { createFsStorage } from "./storage-fs";

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// Dev-only default secret; override in any real deployment (RFC §6).
const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-token-secret";
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

const readBody = (
  request: http.IncomingMessage,
  maxBodyBytes: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Payload too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });

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
    const sendJson = (status: number, body: unknown): void => {
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

      const rawBody = await readBody(request, maxBodyBytes);
      let body: unknown = null;
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
      // Never log request bodies here — they can contain credentials (AC-1.2).
      console.error(
        "sync-server error:",
        error instanceof Error ? error.message : error
      );
      sendJson(500, {
        error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
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
      }),
    })
  );
  server.listen(PORT, () => {
    console.log(`Sync server listening on http://localhost:${PORT}`);
  });
}
