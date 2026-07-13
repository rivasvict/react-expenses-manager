// S3 storage adapter for the Lambda deployment (RFC §7): implements the
// same interface as storage-fs.js over the S3 REST API with SigV4 request
// signing — dependency-free (node:crypto + global fetch, available on the
// Lambda Node 20 runtime). Compare-and-swap uses S3 conditional writes:
// ETags as versions, `If-Match` / `If-None-Match: *` on PUT.
//
// NOT exercised by CI against real AWS (deliberately — dev/test/CI never
// touch the cloud, RFC §1); the signing and request mapping are
// unit-tested with an injected fetch in server/test/cloudAdapters.test.js,
// and docs/multi-user-sync/DEPLOYMENT.md documents the deployment.
const crypto = require("node:crypto");

const hmac = (key, data) =>
  crypto.createHmac("sha256", key).update(data).digest();
const sha256Hex = (data) =>
  crypto.createHash("sha256").update(data).digest("hex");

// AWS SigV4 (service "s3"). Returns the headers to send.
const signRequest = ({
  method,
  host,
  path,
  body,
  extraHeaders,
  credentials,
  region,
  date,
}) => {
  const amzDate = date.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body || "");

  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...(credentials.sessionToken
      ? { "x-amz-security-token": credentials.sessionToken }
      : {}),
    ...extraHeaders,
  };

  const signedHeaderNames = Object.keys(headers)
    .map((name) => name.toLowerCase())
    .sort();
  const canonicalHeaders = signedHeaderNames
    .map((name) => `${name}:${String(headers[name]).trim()}\n`)
    .join("");
  const signedHeaders = signedHeaderNames.join(";");

  const canonicalRequest = [
    method,
    path,
    "", // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${credentials.secretAccessKey}`, dateStamp), region),
      "s3"
    ),
    "aws4_request"
  );
  const signature = hmac(signingKey, stringToSign).toString("hex");

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
};

const createS3Storage = ({
  bucket,
  region = process.env.AWS_REGION || "us-east-1",
  credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
  // Injectable for unit tests; the Lambda runtime provides global fetch.
  fetchImpl = fetch,
  now = () => new Date(),
}) => {
  const host = `${bucket}.s3.${region}.amazonaws.com`;

  const request = async ({ method, key, body, extraHeaders = {} }) => {
    const path = `/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}.json`;
    const headers = signRequest({
      method,
      host,
      path,
      body,
      extraHeaders,
      credentials,
      region,
      date: now(),
    });
    return fetchImpl(`https://${host}${path}`, { method, headers, body });
  };

  const throwOnUnexpected = async (response, operation) => {
    // Bodies here are S3 XML error documents — no user secrets.
    throw new Error(
      `S3 ${operation} failed: ${response.status} ${await response.text()}`
    );
  };

  return {
    readJson: async (key) => {
      const response = await request({ method: "GET", key });
      if (response.status === 404) return null;
      if (!response.ok) await throwOnUnexpected(response, `GET ${key}`);
      return JSON.parse(await response.text());
    },
    writeJson: async (key, value) => {
      const response = await request({
        method: "PUT",
        key,
        body: JSON.stringify(value),
      });
      if (!response.ok) await throwOnUnexpected(response, `PUT ${key}`);
    },
    readJsonVersioned: async (key) => {
      const response = await request({ method: "GET", key });
      if (response.status === 404) return null;
      if (!response.ok) await throwOnUnexpected(response, `GET ${key}`);
      return {
        value: JSON.parse(await response.text()),
        // The ETag is the opaque version string (RFC §2.1).
        version: response.headers.get("etag"),
      };
    },
    writeJsonVersioned: async (key, value, { expectedVersion }) => {
      const response = await request({
        method: "PUT",
        key,
        body: JSON.stringify(value),
        extraHeaders:
          expectedVersion === null
            ? { "if-none-match": "*" } // create only (EC-1)
            : { "if-match": expectedVersion },
      });
      // 412 PreconditionFailed = CAS miss; 409 ConditionalRequestConflict
      // = a concurrent conditional write won the race. Both mean "the
      // expectation failed" to the caller.
      if (response.status === 412 || response.status === 409) return null;
      if (!response.ok) await throwOnUnexpected(response, `PUT ${key}`);
      return response.headers.get("etag");
    },
  };
};

module.exports = { createS3Storage, signRequest };
