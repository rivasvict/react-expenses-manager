# Multi-User Sync — Deployment Guide

How to run the sync backend, locally and in the real cloud (RFC §6–§7).
The same framework-free core (`server/core/`) powers both — only the
transport and storage adapters differ:

| Piece | Local dev | AWS |
|---|---|---|
| Transport | `server/index.js` (`node:http`) | `server/lambda.js` (Lambda Function URL adapter) |
| Storage | `server/storage-fs.js` (JSON files under `server/.data/`) | `server/storage-s3.js` (S3 REST API, SigV4, conditional writes) |
| Handlers/routes/crypto | `server/core/` — identical in both | same |

Both adapters are dependency-free plain Node. The cloud adapters are
unit-tested (`server/test/cloudAdapters.test.js`) with in-memory storage
and an injected `fetch`; **CI never talks to AWS** (RFC §1 — dev/test/CI
stay fully local), so treat the first real deployment as needing one
manual smoke test (steps below).

---

## 1. Local development (NFR-4)

```
Terminal 1:  npm run sync-server     # http://localhost:4000
Terminal 2:  npm start               # CRA dev server, http://localhost:3000
```

- The frontend reads the backend URL from `REACT_APP_SYNC_API_HOST`
  (`.env`), defaulting to `http://localhost:4000` (`src/config.js`).
- Data lives as JSON files under `server/.data/` (gitignored). **Reset
  the world:** delete `server/.data/`.
- Dev-only default secrets apply locally; override with `TOKEN_SECRET`
  and `ENCRYPTION_KEY` env vars if desired. `PORT` and `CORS_ORIGIN` are
  also overridable.
- Multi-user testing: two browser profiles (or one normal + one private
  window) against the same server.
- Tests: `npm run test:server` (Node >= 18; the app itself is pinned to
  Node 16 via `.nvmrc`).

## 2. AWS deployment (RFC §7): 1 Lambda + 1 S3 bucket, no database

### 2.1 Generate secrets

Two independent secrets, 32 random bytes each:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ENCRYPTION_KEY
```

- `TOKEN_SECRET` signs the HMAC auth tokens. Rotating it signs everyone
  out (they log in again — no other loss).
- `ENCRYPTION_KEY` encrypts invitation records (AES-256-GCM) and keys the
  invitation-code lookup hash. Rotating it invalidates **unredeemed**
  invitations (organizers simply generate new ones); accounts, parties
  and backups are unaffected.

### 2.2 S3 bucket

1. Create a bucket (e.g. `my-family-sync-data`), **private** (Block Public
   Access: on), default (SSE-S3) encryption on.
2. Enable **bucket versioning** — a free safety net for the backup
   objects (any overwritten party backup remains recoverable).
3. No CORS configuration needed on the bucket — the browser never talks
   to S3, only the Lambda does.

The adapter relies on **S3 conditional writes** (`If-Match` /
`If-None-Match: *` on PUT — generally available since late 2024) for the
compare-and-swap that makes concurrent syncs safe (EC-2). No bucket
setting is needed; it works on any current S3 bucket.

### 2.3 Lambda

1. Create a function: **Node.js 20.x**, architecture of your choice,
   memory 256 MB, timeout 10 s.
2. Package and upload the `server/` directory (it is self-contained —
   no `node_modules`):
   ```
   cd server && zip -r ../sync-server.zip core *.js && cd ..
   ```
   Set the handler to **`lambda.handler`**.
3. Environment variables:
   | Name | Value |
   |---|---|
   | `BUCKET` | the bucket name from 2.2 |
   | `TOKEN_SECRET` | from 2.1 |
   | `ENCRYPTION_KEY` | from 2.1 |
   | `CORS_ORIGIN` | your app origin, e.g. `https://expenses.example.com` |

   (`AWS_REGION` and the Lambda role credentials are provided by the
   runtime; `storage-s3.js` picks them up automatically, including the
   session token.)
4. Execution role (IAM): the basic Lambda logging policy plus, scoped to
   your bucket:
   ```json
   {
     "Effect": "Allow",
     "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
     "Resource": [
       "arn:aws:s3:::my-family-sync-data",
       "arn:aws:s3:::my-family-sync-data/*"
     ]
   }
   ```
5. Enable a **Function URL**, auth type **NONE** (the app does its own
   token auth), and configure its CORS: allow origin = your app origin,
   allow methods `GET, POST, PUT, OPTIONS`, allow headers
   `content-type, authorization`. (The adapter also answers preflights
   itself as a safety net.)

### 2.4 Frontend

Build with the Function URL as the sync host and deploy the static build
as today:

```
REACT_APP_SYNC_API_HOST=https://xxxxxxxx.lambda-url.eu-west-1.on.aws npm run build
```

No other infrastructure. The old `REACT_APP_API_HOST` stays owned by the
dormant `expenses-manager-api` and is unrelated.

### 2.5 Smoke test

```
H=https://xxxxxxxx.lambda-url.<region>.on.aws
curl -s -X POST $H/api/auth/signup -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"pick-one","firstName":"You","lastName":"There"}'
# expect: 201 {token, user}. Then GET $H/api/me with the Bearer token.
```

## 3. Security notes

- **TLS / encryption in transit (AC-2.4, NFR-2):** Lambda Function URLs
  are HTTPS-only, so every credential, invitation secret and backup is
  TLS-protected in production. Local dev uses plain `http://localhost`
  loopback — the accepted stand-in per the RFC.
- **At rest:** passwords are scrypt records; invitation codes exist only
  as keyed (HMAC-SHA256) lookup hashes plus AES-256-GCM-encrypted
  records; S3 default encryption covers the objects themselves. An
  automated sweep asserts no plaintext secret is ever stored or logged
  (`server/test/secretsSweep.test.js`).
- Tokens expire after 30 days; logout is client-side (tokens are
  stateless, and party state is re-checked server-side on every
  data-bearing request — a blocked member or canceled party is rejected
  regardless of token validity).

## 4. Operational semantics worth knowing

- **Re-inviting a blocked member un-blocks them** (Tech Lead ruling,
  PR 3): blocking has no un-block button by design — the recovery path
  is a fresh invitation. When a previously blocked member redeems a new
  code for the same party, their existing member record is reactivated
  (`blocked: false`), not duplicated. Blocking is never retroactive:
  entries the member already synced stay in the party's backup history
  (AC-2.9).
- **Blocked members and members of canceled parties can create/join a
  new party.** Their old member record stays behind for attribution.
- **"Clear all data" also signs the user out and forgets sync state**
  (rejection memory included) — it clears all of `localStorage`,
  consistent with its danger-zone contract (RFC §2.2).

## 5. Cost expectations (RFC §1)

At family scale (≤10 users, manual syncs): a few hundred Lambda
invocations and a few MB of S3 storage/requests per month — inside the
AWS always-free tiers, i.e. effectively **$0**; worst case pennies.
There is no database, no API Gateway, no third service.
