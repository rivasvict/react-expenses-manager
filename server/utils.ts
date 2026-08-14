// Transport-level helpers for the node:http adapter (server/index.ts).
// Dependency-free, like the rest of server/.
import http from "node:http";

// Sends one JSON reply. Bound to a single response, so the adapter can hand
// it a status and a body without repeating the wire details.
export type SendJson = (status: number, body: unknown) => void;

// Builds the JSON responder for one request/response pair. Every JSON reply
// the adapter sends goes through it, so the content type and the CORS header
// are written in exactly one place instead of at each `writeHead` call.
export const createJsonResponder = (
  response: http.ServerResponse,
  corsOrigin: string
): SendJson => (status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
  });
  response.end(JSON.stringify(body));
};

// Raised when a request body exceeds the configured cap, so the adapter can
// answer 413 instead of falling through to a generic 500.
export class PayloadTooLargeError extends Error {
  constructor(maxBodyBytes: number) {
    super(`Request body exceeds the ${maxBodyBytes} byte limit.`);
    this.name = "PayloadTooLargeError";
  }
}

// Buffers a request body into a string, refusing to accumulate more than
// `maxBodyBytes`. Rejects with PayloadTooLargeError on overflow and with the
// underlying error on any stream failure.
export const readBody = (
  request: http.IncomingMessage,
  maxBodyBytes: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let overflowed = false;

    request.on("data", (chunk: Buffer) => {
      if (overflowed) return;
      size += chunk.length;
      if (size > maxBodyBytes) {
        overflowed = true;
        // Release what was buffered, then drain the rest into the void.
        //
        // Destroying the socket here instead — as this used to — races the
        // error response: the connection dies before the 413 is flushed and
        // the client sees ECONNRESET rather than the status we meant to
        // send. Resuming keeps memory bounded (nothing further is retained)
        // while letting the client finish writing and then read the reply.
        chunks.length = 0;
        request.resume();
        reject(new PayloadTooLargeError(maxBodyBytes));
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (!overflowed) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", reject);
  });
