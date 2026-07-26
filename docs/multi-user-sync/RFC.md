# RFC: Multi-User Sync — Architecture

Status: Proposed
Author: Tech Lead
Inputs: `feature-brief.md` (binding), `PRD.md` (AC/EC numbering used below),
`DESIGN.md` (approved UX), `CLAUDE.md` (repo rules).
Companion: `TASKS.md` (PR breakdown).

## 1. System overview

Three pieces, deliberately few:

1. **Frontend (this repo).** `localStorage` stays the runtime source of
   truth and `STORAGE_TYPES.LOCAL` stays the app-data storage. Sync is a
   new, additive path: a small typed HTTP client (`src/services/syncApi/`),
   a new Redux slice (`src/redux/syncManager/`), the DESIGN.md screens, and
   a pure merge engine (`src/helpers/syncMergeHelper/`).
2. **Sync backend: one small HTTP service.** ~10 JSON endpoints (auth,
   party, invitations, backup GET/PUT with compare-and-swap). The handler
   core is framework-free plain Node (`server/core/`) with a pluggable
   storage interface, wrapped by two adapters:
   - `server/index.js` — local dev server (`node:http`, on-disk JSON under
     `server/.data/`, gitignored). Zero runtime dependencies. This is the
     mandatory local implementation (NFR-4).
   - `server/lambda.js` — AWS Lambda Function URL adapter with S3 storage
     (written when we deploy; same core, same contract).
3. **Production infra: 1 Lambda + 1 S3 bucket. No database.**

### Why this infra (cost notes)

- The brief suggests Lambda + S3 + MongoDB. The only thing the DB would
  hold is a handful of user/party/invitation records for one family. S3
  stores small JSON objects perfectly well, and since S3 now supports
  conditional writes (`If-Match`/`If-None-Match` on PUT) it also gives us
  the compare-and-swap we need for EC-2 — the DB adds a third moving part,
  a connection secret, and (Atlas) an external vendor, for zero benefit at
  this scale. **Rejected.**
- Lambda **Function URL** instead of API Gateway: Function URLs are free,
  support CORS natively, and we need no throttling/custom domains.
- Expected cost at family scale (≤10 users, manual syncs): a few hundred
  Lambda invocations and a few MB of S3 per month — effectively **$0**
  (well inside the always-free tiers; worst case pennies).
- Everything the cloud does, the local server does with the same core code
  and an on-disk storage adapter, so dev/test/CI never touch AWS.

### Dormant auth code: build new, leave it alone

`RemoteStorage`, `AuthenticatedApp`, `PrivateRoute`, `Lobby`, and the
`userManager` action creators all target the defunct `expenses-manager-api`
(cookie sessions, `sessionStorage`, app-gating). Our auth is optional and
additive (AC-1.7), token-based, and must not gate anything. Reusing that
code means fighting its assumptions; we reuse only what DESIGN.md already
chose: `SignIn`/`SignUp`'s `FormValidation`/`FormModel` logic and the
`Forms.js` inputs. The dormant files are **not modified and not deleted**
(their GitHub issues still track them). New Redux state goes in a new
`syncManager` slice, not `userManager`.

## 2. Data model

### 2.1 Server-side (S3 objects in prod / JSON files under `server/.data/`)

```
users/{sha256(lowercased email)}.json
  { id, email, firstName, lastName,
    password: { algo: "scrypt", N, r, p, saltB64, hashB64 },
    partyId: string | null, createdAt }

parties/{partyId}.json
  { id, name,                       // "{organizer first name}'s Party"
    organizerId,
    members: [ { id, firstName, lastName, email, blocked: boolean } ],
    canceled: boolean,
    invitations: { [sha256(code)]: <AES-256-GCM ciphertext, base64> },
    createdAt }

parties/{partyId}.backup.json
  { uploadedBy, uploadedAt, envelope }   // envelope: see 2.3
```

- An invitation plaintext record (never stored unencrypted):
  `{ password: {scrypt fields}, used: boolean, createdBy, createdAt }`.
  Lookup is by hash of the code; the record itself is encrypted (AC-2.4).
- **Version for CAS:** every read of `*.backup.json` returns an opaque
  `version` string — the S3 ETag in prod, a monotonically increasing
  integer serialized as a string in the local server. `parties/{id}.json`
  updates (join/block/cancel/invite/redeem) use the same CAS internally
  with one retry; collisions are ~impossible at family scale.

### 2.2 Client-side (new localStorage keys, prefixed to avoid collisions)

```
sync.session  { token, user: { id, email, firstName, lastName } }
sync.state    { partyId, lastSyncedVersion: string | null,
                lastSyncedAt: number | null,
                rejections: { [itemKey]: string[] /* content hashes */ } }
```

- `sync.session` present ⇔ logged in (AC-1.3: survives reload/restart;
  cleared on logout, AC-1.4). Party membership/blocked/canceled state is
  **not** cached as authoritative — `GET /me` refreshes it on app load and
  after every sync-related server rejection (DESIGN 4.2 stale-state rule).
- `rejections` is the permanent AC-3.9 memory (see §4). It only grows when
  an upload **completes** (PM handoff: abandoned reviews leave no trace).
- Known, accepted consequence: "Clear all data" calls `localStorage.clear()`
  and therefore also signs the user out and forgets rejections. That is
  consistent with its "danger zone" contract; documented, not special-cased.

### 2.3 Backup envelope & attribution

Sync reuses the exact `buildBackupEnvelope` shape
(`{app, schemaVersion, exportedAt, data: {balance, buckets, categories,
fixedEntries}}`) and validates downloads with the existing
`parseBackupEnvelope` (which preserves unknown fields inside the arrays).
One additive, optional field appears on syncable items, stamped **at
creation time when a session exists** (AC-1.6):

- balance entry: `{ id, amount, description, type, date, categories_path,
  addedBy?: { id, name } }`
- fixed-entry history state: `{ from, ..., addedBy? }`
- bucket history state: `{ from, limit, addedBy? }`

`name` is the first name, denormalized so the wizard renders "Added by
Tom" with no lookup. Stamping happens in the **action creators** (via a
tiny `src/services/session.ts` reader) — `LocalStorage` stays a dumb store
and simply persists whatever fields the entry carries. Legacy/unattributed
items (including everything uploaded by EC-1's first sync) show
**"Added anonymously"** in the wizard. We record creator only — the wizard
copy is "Added by", per DESIGN 4.3.1; a `modifiedBy` audit trail is
over-engineering for a family app (see §9).

## 3. HTTP API contract

Shared verbatim by the local server and the future Lambda. JSON bodies;
base URL from `REACT_APP_SYNC_API_HOST` (default `http://localhost:4000`;
new var — the old `REACT_APP_API_HOST` stays owned by the dormant API).
Auth: `Authorization: Bearer <token>` on everything except signup/login.
Errors: `{ "error": { "code": "<CODE>", "message": "<human text>" } }`.

| # | Endpoint | Auth | Request → Success | Errors |
|---|---|---|---|---|
| 1 | `POST /api/auth/signup` | – | `{email, password, firstName, lastName}` → `201 {token, user}` | 400 `VALIDATION_ERROR`; 409 `EMAIL_TAKEN` |
| 2 | `POST /api/auth/login` | – | `{email, password}` → `200 {token, user}` | 401 `INVALID_CREDENTIALS` (same body whether email exists or not, AC-1.5) |
| 3 | `GET /api/me` | ✓ | → `200 {user, party}` where `party` = `null` or `{id, name, organizerId, canceled, youAreBlocked, members: [{id, firstName, lastName, email, blocked}]}` | 401 `UNAUTHORIZED` |
| 4 | `POST /api/party` | ✓ | `{}` → `201 {party}` (name auto: "{firstName}'s Party") | 409 `ALREADY_IN_PARTY` |
| 5 | `POST /api/party/invitations` | ✓ org | `{password}` → `201 {code}` (e.g. `K7X9-QP2M`; returned once, never again) | 403 `NOT_ORGANIZER`; 404 `NO_PARTY`; 410 `PARTY_CANCELED` |
| 6 | `POST /api/party/join` | ✓ | `{code, password}` → `200 {party}` | 404 `INVITATION_NOT_FOUND`; 401 `INVITATION_WRONG_PASSWORD` (EC-7, not consumed); 410 `INVITATION_USED` (EC-8) or `PARTY_CANCELED`; 409 `ALREADY_IN_PARTY` (EC-6, not consumed) |
| 7 | `POST /api/party/members/{userId}/block` | ✓ org | `{}` → `200 {party}` | 403 `NOT_ORGANIZER`; 404 `NO_PARTY` |
| 8 | `POST /api/party/cancel` | ✓ org | `{}` → `200 {party}` | 403 `NOT_ORGANIZER`; 404 `NO_PARTY` |
| 9 | `GET /api/party/backup` | ✓ | → `200 {version, envelope}` | 404 `NO_BACKUP` (EC-1) or `NO_PARTY`; 403 `BLOCKED` (EC-9); 410 `PARTY_CANCELED` |
| 10 | `PUT /api/party/backup` | ✓ | `{baseVersion, envelope}` → `200 {version}` | 409 `VERSION_CONFLICT` (EC-2); 403 `BLOCKED`; 410 `PARTY_CANCELED`; 404 `NO_PARTY`; 400 `VALIDATION_ERROR` (bad/oversized envelope, limit 1 MB) |

Notes:
- `PUT` with `baseVersion: null` means "create only" (EC-1) — rejected with
  `VERSION_CONFLICT` if a backup already exists. Otherwise the server
  compares `baseVersion` to the current version (S3 `If-Match`/
  `If-None-Match: *` in prod; integer compare locally) and swaps atomically.
- Blocked/canceled are enforced **server-side on every backup call** (a
  stale client can never download or upload, EC-9/AC-2.10); endpoints 9–10
  are also what re-surface these states to the client mid-review.
- Logout is client-side only (delete `sync.session`); tokens are stateless.
  Server-side revocation isn't needed: the damaging capabilities (sync)
  are re-checked against party state per request.
- The server treats `envelope` as an opaque blob apart from size/JSON/app-id
  checks — all merge intelligence lives in the client.

## 4. Merge & idempotency algorithm (the heart)

All pure functions in `src/helpers/syncMergeHelper/` (TS, fully
unit-testable, no I/O).

### 4.1 Item identity and change detection

Every syncable unit gets an **itemKey** and a **contentHash**:

| Kind | itemKey | Payload hashed |
|---|---|---|
| Entry | `entry:{id}` | whole entry minus `id` |
| Fixed-entry history state | `fixed:{id}:{from}` | that history state minus `from` |
| Bucket history state | `bucket:{lowercased name}:{from}` | that state minus `from` |

`contentHash` = FNV-1a over a canonical JSON serialization (recursively
sorted keys). It detects change, it is not security — no crypto needed, so
it runs identically in jsdom.

- Fixed entries and buckets are diffed **per history state** (their arrays
  are already append-mostly, keyed by `from`), so "Tom raised the Groceries
  bucket for August" is one reviewable item. Removal tombstones
  (`{from, removed: true}`) are states like any other and sync the same way.
- A brand-new fixed entry / bucket arrives as its full set of states but is
  presented as **one wizard card** (its resolved current state); its
  decision applies to all its pending states.
- An **edit** to an existing entry by another member = same itemKey,
  different contentHash → presented as a "changed" item; Accept replaces
  the local value. Because rejections are remembered per
  `(itemKey, contentHash)`, rejecting one edit does not suppress a *later,
  different* edit — and EC-5's modified value (new hash) is seen as current
  by the next syncer.

### 4.2 Diff (on download)

```
incoming = []
for each remote item (entry / fixed state / bucket state):
  key, hash = identity(item)
  if local has key with equal hash        → skip  (already applied / own)
  if sync.state.rejections[key] ∋ hash    → skip  (AC-3.9 / EC-4)
  else → incoming += { key, hash, item, isChange: local has key }
```

Diffing is **additive-only**: a remote backup *lacking* a local item never
deletes anything locally (deletion sync is out of scope, per PRD §6; a
locally deleted entry that still exists remotely will re-appear as
incoming once — rejecting it then suppresses it permanently).

### 4.3 Sync flow (state machine)

1. `GET /api/party/backup`.
   - `403/410` → DESIGN 4.2 blocked/canceled banners, refresh `/me`, stop.
   - Network failure → "Couldn't reach your party…", stop (AC-3.11).
   - `404 NO_BACKUP` (EC-1) → `PUT` local snapshot with `baseVersion: null`
     → first-sync confirmation. Wizard skipped. Never an error.
2. Validate with `parseBackupEnvelope`; run the diff (4.2).
3. `incoming` empty:
   - local snapshot content-equals `envelope.data` → **"You're up to
     date."** No upload (AC-3.3).
   - otherwise (local-only additions) → skip wizard, `PUT` merged local
     snapshot with `baseVersion = downloaded version`, then "You're up to
     date." On 409 → restart from step 1.
4. `incoming` non-empty → route to `/sync-review`. **All decisions are
   staged in wizard component state only** (DESIGN 4.3 staging model);
   nothing touches `localStorage` yet. Abandonment (cancel, navigation,
   crash) therefore discards everything, including rejections
   (PM handoff on AC-3.9).
5. Review completes → build `merged` **in memory**: local snapshot + each
   accepted item applied (entries appended/replaced by id; fixed/bucket
   states upserted by `from`, histories re-sorted; modified items use the
   edited values, EC-5). Rejected items are simply not applied — and hence
   absent from the uploaded snapshot; the contributor keeps them locally
   (additive diffing) so nothing is silently lost.
6. `PUT {baseVersion: downloaded version, envelope: wrap(merged)}`.
   - `200 {version}` → **commit**: write `merged` to `localStorage`,
     record rejections `(key, hash)` into `sync.state.rejections`, set
     `lastSyncedVersion/At`, re-dispatch `getBalance`/buckets/fixed
     loaders, show success screen.
   - `409 VERSION_CONFLICT` (EC-2) → staged decisions **discarded**, offer
     "Sync again" (fresh download → fresh wizard), per DESIGN 4.3.4. No
     replay of stale decisions: they may reference items another member
     just modified.
   - `403/410` → discard, return to `/data-management`, DESIGN 4.2 banner.
   - Network failure → stay on summary with Retry, same staged set,
     local data untouched (AC-3.11/EC-3 — nothing was committed).

The commit in step 6 is the **only** write to app `localStorage` in the
whole flow, which makes AC-3.11, mid-wizard cancel, and EC-2 the same
one-line guarantee.

## 5. Security design

- **Passwords (AC-1.2):** hashed with Node's built-in `crypto.scrypt`
  (N=16384, r=8, p=1, 16-byte random salt), compared with
  `crypto.timingSafeEqual`. Plaintext exists only inside the TLS request
  body; never logged, never in URLs.
- **Login errors (AC-1.5):** identical 401 body for unknown email and
  wrong password.
- **Invitations (AC-2.4/NFR-2):** the code is 8 random base32 chars
  (crypto RNG, shown once, `XXXX-XXXX`); stored only as `sha256(code)`
  lookup key plus an AES-256-GCM-encrypted record (random 12-byte IV per
  record, server `ENCRYPTION_KEY`, 32 bytes) containing the scrypt-hashed
  invite password and the `used` flag. Wrong password ≠ consumed (EC-7);
  redemption flips `used` under CAS so it is single-use even under a race
  (EC-8). Code and password travel only in POST bodies over TLS.
- **API auth tokens:** compact HMAC-SHA256-signed token (JWT-style:
  `base64url(payload).base64url(sig)`, payload `{sub, iat, exp}`), signed
  with server `TOKEN_SECRET`, 30-day expiry (AC-1.3; on 401 the client
  clears the session and shows logged-out state). No refresh rotation, no
  MFA, no OAuth — deliberately (AC-1.1).
- Token lives in `localStorage` (needed for AC-1.3 persistence). XSS is the
  accepted residual risk — same trust level as the financial data already
  in `localStorage`; the token grants nothing beyond that same party data.
- Transport: prod = HTTPS (Function URLs are TLS-only). Local dev =
  `http://localhost`, loopback-only; acceptable stand-in for "in transit"
  in a dev environment.
- Non-goals (documented, not accidental): rate limiting, account lockout,
  email verification, server-side token revocation — wrong cost/benefit
  for a family app; invitation security already stacks two secrets.

## 6. Local dev story (NFR-4)

```
Terminal 1:  npm run sync-server     # node server/index.js  → :4000
Terminal 2:  npm start               # CRA dev server        → :3000
```

- `server/` is plain Node (no deps, no build step): `core/` (handlers,
  crypto, storage interface), `storage-fs.js` (JSON files in
  `server/.data/`, gitignored), `index.js` (`node:http` adapter, CORS for
  localhost:3000).
- `.env.template` gains `REACT_APP_SYNC_API_HOST=` (defaults to
  `http://localhost:4000` in `src/config.js`).
- Secrets default to dev values in local mode (`TOKEN_SECRET`,
  `ENCRYPTION_KEY` env vars override).
- Reset the world: delete `server/.data/`. Multi-user testing: two browser
  profiles (or one normal + one private window) against the same server.
- Server tests: `npm run test:server` → `node --test server/` (built-in
  runner; CRA's jest doesn't scan outside `src/`, and we don't fight it).
- `server/README.md` documents all of the above plus the cloud steps (§7).

## 7. Real-cloud deployment (outline; full steps in `server/README.md`)

1. Create S3 bucket (private, default encryption; enable bucket versioning
   as a free safety net for backup objects).
2. Create Lambda (Node 20), upload `server/` with `lambda.js` as handler
   (Function-URL event ↔ core adapter; `storage-s3.js` implements the same
   storage interface via `GetObject`/`PutObject` with
   `If-Match`/`If-None-Match` for CAS).
3. IAM role: `s3:GetObject/PutObject/ListBucket` scoped to the bucket.
4. Env vars: `BUCKET`, `TOKEN_SECRET`, `ENCRYPTION_KEY` (32 random bytes).
5. Enable Function URL, auth type NONE, CORS restricted to the app origin.
6. Build the frontend with `REACT_APP_SYNC_API_HOST=<function URL>`; host
   statically as today. No other infra.

## 8. Testing strategy

- **Merge engine:** exhaustive jest unit tests on the pure functions
  (identity, hashing, diff, apply, rejection memory) — this is where EC
  combinatorics are cheap.
- **Frontend integration tests (NFR-5, network-free):** new helper
  `src/integrationTests/helpers/fakeSyncServer.ts` — an in-memory
  implementation of the §3 contract installed as a `window.fetch` stub for
  the `REACT_APP_SYNC_API_HOST` base URL. It exposes test seams:
  `seedUser`, `seedPartyWithMembers`, `seedRemoteBackup(envelope)`,
  `loginAs(email)` (pre-writes `sync.session`), `failNext("GET /api/party/backup")`,
  `getUploadedBackups()`. Tests drive everything through the UI
  (`screen.findByText`, roles) per repo rules; the fake lets one test act
  as two family members (seed a remote backup "uploaded by Tom", then sync
  as Jane). Contract drift between fake and `server/core` is bounded by
  both being generated from §3 and by shared error-code constants
  (`src/services/syncApi/contract.ts`; the dep-free server duplicates the
  ~20 lines deliberately — RFC §3 is the source of truth).
- **Server:** `node --test` contract tests against `core/` with in-memory
  storage (signup/login, invitation lifecycle EC-6/7/8, CAS conflict,
  blocked/canceled enforcement).
- **Regression:** existing integration tests run untouched on every PR
  (NFR-3); `npm run typecheck` and `npm run lint` gate every PR.

## 9. Rejected alternatives

- **Lambda + S3 + MongoDB (brief's suggestion):** the DB would hold ~10 tiny
  records; S3 conditional writes already give CAS. Third service, connection
  secrets, no benefit.
- **DynamoDB for users/invitations:** still a second service and a second
  local stand-in to maintain; S3 JSON objects with CAS suffice at this scale.
- **Firebase/Supabase/Amplify:** vendor lock-in and much harder "full local
  implementation" story than 300 lines of plain Node.
- **Append-only backup history reconciled on download (EC-2 option B):**
  more storage, unbounded growth, complex replay logic; CAS + "sync again"
  re-review is simpler and the discarded work is seconds at family scale.
- **Reusing `RemoteStorage`/`AuthenticatedApp`/`userManager`:** built for a
  defunct cookie-session API that gates the whole app; contradicts AC-1.7.
  Reused instead: form-validation logic and form components (per DESIGN).
- **Carrying staged decisions across an EC-2 conflict:** could silently
  accept values a member just changed — the exact loss EC-2 forbids
  (rationale in DESIGN 4.3.4).
- **Cookie sessions:** cross-origin (Function URL ≠ app origin) means
  SameSite/CSRF machinery; a bearer token is simpler and sufficient.
- **`modifiedBy` audit trail / per-field merge:** wizard only needs "added
  by" (AC-3.4, DESIGN); anything more is over-engineering.
- **Client-side end-to-end encryption of backups:** would hide data from
  the server but breaks nothing we need; key distribution inside a family
  via invitation flow would dwarf the feature. Out of scope.
