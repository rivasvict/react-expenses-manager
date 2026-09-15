# Sync server (local)

Dependency-free plain Node implementation of the multi-user sync backend
(RFC: `docs/multi-user-sync/RFC.md`). Written in TypeScript and compiled
ahead of run — there is no runtime dependency on `ts-node` or any npm
package; the compiled output under `server/dist/` is plain CommonJS that
only requires `node:` builtins.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/signup` | Create an account → `201 {token, user}` |
| `POST /api/auth/login` | Log in → `200 {token, user}` |
| `GET /api/me` | Current user + party, if any (Bearer token) → `200 {user, party}` |
| `POST /api/party` | Create a party; caller becomes organizer → `201 {party}` |
| `POST /api/party/invitations` | Organizer generates a one-time invite code → `201 {code}` |
| `POST /api/party/join` | Redeem an invite code + password → `200 {party}` |

Passwords are scrypt-hashed (never stored or logged in plaintext); tokens
are compact HMAC-SHA256-signed (`base64url(payload).base64url(sig)`,
30-day expiry). Invitation codes exist at rest only as a keyed HMAC lookup
hash; invitation records (the invite password and its `used` flag) are
AES-256-GCM-encrypted — neither the code nor the password is ever stored
in plaintext (RFC §5).

## Run locally

```
Terminal 1:  npm run sync-server     # http://localhost:4000
Terminal 2:  npm start               # CRA dev server, http://localhost:3000
```

`npm run sync-server` compiles first, then runs the output. To build
without running, use `npm run build:server` (`tsc -p server/tsconfig.json`,
output in `server/dist/`, gitignored).

- Data is stored as JSON files under `server/.data/` (gitignored).
  **Reset the world:** delete `server/.data/`.
- CORS is enabled for `http://localhost:3000` (override with `CORS_ORIGIN`).
- Environment variables (all optional locally):
  - `PORT` — defaults to `4000`
  - `TOKEN_SECRET` — token signing secret; defaults to a dev-only value.
    Override for anything beyond local development.
  - `ENCRYPTION_KEY` — stretched (via sha256) to the 32 bytes AES-256-GCM
    needs for invitation records; any string works locally, defaults to a
    dev-only value. Override for anything beyond local development.
  - `CORS_ORIGIN` — allowed browser origin
- The frontend reads the server URL from `REACT_APP_SYNC_API_HOST`
  (defaults to `http://localhost:4000`, see `.env.template`).
- Multi-user testing: use two browser profiles (or one normal + one
  private window) against the same server.

## Tests

```
npm run test:server
```

Compiles, then runs the tests with the Node built-in test runner
(`node --test`, against the compiled output in `server/dist/`).

Tests are colocated with the code they cover — `core/crypto.ts` is tested
by `core/crypto.test.ts`, and so on — so every `.ts` source file here has a
matching `.test.ts` beside it.

Discovery is automatic. `testRunner.ts` walks `server/dist/` for
`*.test.js` and hands `node --test` the explicit file paths, so a test file
in a new directory is picked up with no script to update. It prints how many
files it found, and **exits non-zero if it finds none** rather than
reporting a vacuous pass.

The walk exists because `node --test` cannot be pointed at this tree
portably: Node 18 expands a directory argument recursively but rejects
globs, while Node 20+ treats positionals as globs and fails on a bare
directory. Explicit file paths work on every supported version.

### Node version

**Requires Node >= 18** (for the built-in test runner). There are two
`.nvmrc` files in this repo, deliberately:

| File | Pins | Applies to |
|---|---|---|
| `.nvmrc` (repo root) | `16.13.1` | the React app — `npm start`, `npm test`, `npm run build` |
| `server/.nvmrc` | `18` | this server — `npm run sync-server`, `npm run test:server` |

The React app's toolchain is pinned to Node 16 and the server's test runner
needs 18+, so a single version cannot serve both. Run `nvm use` from
`server/` before working here, and from the repo root when working on the
app.

`18` is the supported floor, not a ceiling — anything newer works (local dev
here runs Node 22). CI pins `18.x` explicitly in
`.github/workflows/server-tests.yml` rather than reading this file, so the
floor is what actually gets exercised on every push; keep the two in step.
The server runtime code itself only uses APIs available in Node >= 16 — it
is the test runner that sets the floor.

CRA's jest deliberately does not scan `server/` (it only looks under
`src/`), so these tests only run via `npm run test:server`.

## Layout

- `core/` — framework-free router, crypto (scrypt + HMAC tokens),
  invitation crypto (`invitations.ts` — code generation/normalization,
  keyed lookup hashing, AES-256-GCM record encryption), shared
  status/error-code constants (`httpConstants.ts`), and the storage
  interface (`storage.ts`, with the in-memory reference implementation used
  by tests) — including the compare-and-swap `readJsonVersioned`/
  `writeJsonVersioned` pair parties are mutated through
- `core/handlers/` — one module per endpoint (`signup.ts`, `login.ts`,
  `me.ts`, `createParty.ts`, `createInvitation.ts`, `joinParty.ts`,
  `blockMember.ts`, `cancelParty.ts`, and the `getBackup.ts`/`putBackup.ts`
  placeholders) plus the collaborators they share (session minting,
  response shaping, storage keys, party mutation/CAS retry, party access —
  the blocked/canceled gate — and field guards); `core/handlers.ts` is just
  the wiring that builds the set
- `*.types.ts` — type declarations extracted from any file that declared
  more than two of them
- `storage-fs.ts` — on-disk JSON adapter (local dev)
- `index.ts` — `node:http` adapter with CORS (local dev entry point).
  Exports `createRequestListener` so the transport can be tested without
  binding a port; it only calls `listen` when run as the entry point.
- `utils.ts` — transport helpers for the http adapter (request body reading)
- `testRunner.ts` — test entry point for `npm run test:server`: discovers
  the compiled `*.test.js` files and runs them
- `*.test.ts` — colocated beside the file each one covers
- `tsconfig.json` — server-only build (CommonJS → `server/dist/`); the
  root `npm run typecheck` covers `src/` and does not read this file
- `dist/` — compiled output (gitignored, rebuilt by the scripts above)
- Cloud deployment (Lambda Function URL + S3 adapter) lands in a later PR
  (RFC §7).
