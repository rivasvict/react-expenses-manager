# Sync server (local)

Dependency-free plain Node implementation of the multi-user sync backend
(RFC: `docs/multi-user-sync/RFC.md`). PR 1 ships the auth endpoints:

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

Runs the contract tests in `server/test/` with the Node built-in test
runner (`node --test`). **Requires Node >= 18** — the React app itself is
pinned to Node 16 (`.nvmrc`), so run this script with a newer system Node
(any Node >= 18 works; CI/dev machines here use the system Node 22). The
server runtime code only uses APIs available in Node >= 16.

CRA's jest deliberately does not scan `server/` (it only looks under
`src/`), so these tests only run via `npm run test:server`.

## Layout

- `core/` — framework-free handlers, router, crypto (scrypt + HMAC
  tokens), and the storage interface (`storage.js`, with the in-memory
  reference implementation used by tests)
- `storage-fs.js` — on-disk JSON adapter (local dev)
- `index.js` — `node:http` adapter with CORS (local dev entry point)
- Cloud deployment (Lambda Function URL + S3 adapter) lands in a later PR
  (RFC §7).
