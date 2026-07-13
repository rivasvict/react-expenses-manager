// AWS Lambda Function URL adapter (RFC §7): maps Function URL (payload
// v2.0) events onto the same framework-free core the local server uses,
// with S3 storage. Dependency-free.
//
// Deployment steps live in docs/multi-user-sync/DEPLOYMENT.md. NOT
// exercised by CI against real AWS; the event mapping is unit-tested in
// server/test/cloudAdapters.test.js with in-memory storage.
const { createApp } = require("./core/router");
const { createS3Storage } = require("./storage-s3");

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB (RFC §3)

// Transport-agnostic core in, Function URL response out.
const createLambdaHandler = ({ app, corsOrigin = "*" }) => {
  const baseHeaders = {
    "content-type": "application/json",
    "access-control-allow-origin": corsOrigin,
  };
  const jsonResponse = (statusCode, body) => ({
    statusCode,
    headers: baseHeaders,
    body: JSON.stringify(body),
  });

  return async (event) => {
    const method =
      (event.requestContext &&
        event.requestContext.http &&
        event.requestContext.http.method) ||
      "GET";

    // Function URL CORS config normally answers preflights; this is the
    // safety net when it isn't configured.
    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "access-control-allow-origin": corsOrigin,
          "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization",
        },
        body: "",
      };
    }

    let body = null;
    if (event.body) {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
        return jsonResponse(413, {
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "The request body exceeds the 1 MB limit.",
          },
        });
      }
      try {
        body = JSON.parse(raw);
      } catch (parseError) {
        return jsonResponse(400, {
          error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." },
        });
      }
    }

    // Function URL events deliver headers lowercased already; normalize
    // defensively so `authorization` lookups always hit.
    const headers = {};
    Object.keys(event.headers || {}).forEach((name) => {
      headers[name.toLowerCase()] = event.headers[name];
    });

    const result = await app.handle({
      method,
      path: event.rawPath || "/",
      headers,
      body,
    });
    return jsonResponse(result.status, result.body);
  };
};

// The Lambda entry point (handler: "lambda.handler"), configured entirely
// through environment variables — see DEPLOYMENT.md.
let defaultHandler = null;
const handler = (event) => {
  if (!defaultHandler) {
    defaultHandler = createLambdaHandler({
      app: createApp({
        storage: createS3Storage({ bucket: process.env.BUCKET }),
        tokenSecret: process.env.TOKEN_SECRET,
        encryptionSecret: process.env.ENCRYPTION_KEY,
      }),
      corsOrigin: process.env.CORS_ORIGIN || "*",
    });
  }
  return defaultHandler(event);
};

module.exports = { createLambdaHandler, handler };
