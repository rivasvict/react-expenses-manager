# Sync server (local)

Dependency-free plain Node implementation of the multi-user sync backend
(RFC: `docs/multi-user-sync/RFC.md`). Written in TypeScript and compiled
ahead of run — there is no runtime dependency on `ts-node` or any npm
package; the compiled output under `server/dist/` is plain CommonJS that
only requires `node:` builtins. PR 1 ships the auth endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/signup` | Create an account → `201 {token, user}` |
| `POST /api/auth/login` | Log in → `200 {token, user}` |
| `GET /api/me` | Current user (Bearer token) → `200 {user, party: null}` |

Passwords are scrypt-hashed (never stored or logged in plaintext); tokens
are compact HMAC-SHA256-signed (`base64url(payload).base64url(sig)`,
30-day expiry).

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

**Requires Node >= 18** — the React app itself is
pinned to Node 16 (`.nvmrc`), so run this script with a newer system Node
(any Node >= 18 works; CI/dev machines here use the system Node 22). The
server runtime code only uses APIs available in Node >= 16.

CRA's jest deliberately does not scan `server/` (it only looks under
`src/`), so these tests only run via `npm run test:server`.

## Layout

- `core/` — framework-free router, crypto (scrypt + HMAC tokens), shared
  status/error-code constants (`httpConstants.ts`), and the storage
  interface (`storage.ts`, with the in-memory reference implementation used
  by tests)
- `core/handlers/` — one module per endpoint (`signup.ts`, `login.ts`,
  `me.ts`) plus the collaborators they share (session minting, response
  shaping, storage keys, field guards); `core/handlers.ts` is just the
  wiring that builds the set
- `*.types.ts` — type declarations extracted from any file that declared
  more than two of them
- `storage-fs.ts` — on-disk JSON adapter (local dev)
- `index.ts` — `node:http` adapter with CORS (local dev entry point).
  Exports `createRequestListener` so the transport can be tested without
  binding a port; it only calls `listen` when run as the entry point.
- `testRunner.ts` — test entry point for `npm run test:server`: discovers
  the compiled `*.test.js` files and runs them
- `*.test.ts` — colocated beside the file each one covers
- `tsconfig.json` — server-only build (CommonJS → `server/dist/`); the
  root `npm run typecheck` covers `src/` and does not read this file
- `dist/` — compiled output (gitignored, rebuilt by the scripts above)
- Cloud deployment (Lambda Function URL + S3 adapter) lands in a later PR
  (RFC §7).
