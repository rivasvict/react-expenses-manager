// Serves a built single-page app (the `build/` folder) over HTTP on a free
// local port, falling back to index.html for client-side routes, so
// scripts/designReview.js can drive the real app without a dev server.
// CommonJS for the same reason as scanFeatures.js.

const fs = require("fs");
const http = require("http");
const path = require("path");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

const isInside = (root, target) =>
  target === root || target.startsWith(root + path.sep);

// Resolves a request path to a file inside `root`, or to index.html for
// anything that is not a real file (a client-side route).
const resolveFile = (root, urlPath) => {
  const requested = path.join(root, decodeURIComponent(urlPath.split("?")[0]));
  const candidate = isInside(root, requested) ? requested : root;
  const isFile = fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  return isFile ? candidate : path.join(root, "index.html");
};

// Resolves to { url, close }.
const serveStatic = (root) =>
  new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const file = resolveFile(root, request.url);
      response.writeHead(200, {
        "Content-Type":
          CONTENT_TYPES[path.extname(file)] || "application/octet-stream",
      });
      fs.createReadStream(file).pipe(response);
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(done)),
      })
    );
  });

module.exports = { resolveFile, serveStatic };
