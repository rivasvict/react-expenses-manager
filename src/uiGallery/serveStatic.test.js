import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { resolveFile, serveStatic } from "./serveStatic";

const fetchText = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            type: response.headers["content-type"],
            body,
          })
        );
      })
      .on("error", reject);
  });

describe("serveStatic", () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "serve-static-"));
    fs.writeFileSync(path.join(root, "index.html"), "<p>app</p>");
    fs.mkdirSync(path.join(root, "static"));
    fs.writeFileSync(path.join(root, "static", "app.js"), "console.log(1)");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("resolveFile", () => {
    it("returns a real file as is, ignoring the query string", () => {
      expect(resolveFile(root, "/static/app.js?v=1")).toBe(
        path.join(root, "static", "app.js")
      );
    });

    it("falls back to index.html for client-side routes and missing files", () => {
      expect(resolveFile(root, "/buckets")).toBe(path.join(root, "index.html"));
      expect(resolveFile(root, "/static/missing.js")).toBe(
        path.join(root, "index.html")
      );
    });

    it("never leaves the root", () => {
      expect(resolveFile(root, "/../../etc/passwd")).toBe(
        path.join(root, "index.html")
      );
    });
  });

  it("serves files with their content type and routes to index.html", async () => {
    const server = await serveStatic(root);
    try {
      const script = await fetchText(`${server.url}/static/app.js`);
      expect(script).toMatchObject({ status: 200, body: "console.log(1)" });
      expect(script.type).toContain("text/javascript");

      const route = await fetchText(`${server.url}/add-bucket`);
      expect(route).toMatchObject({ status: 200, body: "<p>app</p>" });
      expect(route.type).toContain("text/html");
    } finally {
      await server.close();
    }
  });
});
