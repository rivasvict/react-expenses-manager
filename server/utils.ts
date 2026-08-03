// Transport-level helpers for the node:http adapter (server/index.ts).
// Dependency-free, like the rest of server/.
import http from "node:http";

// Buffers a request body into a string, refusing to accumulate more than
// `maxBodyBytes`. Rejects on overflow and on any stream error.
export const readBody = (
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
