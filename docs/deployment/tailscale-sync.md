# Serving sync over Tailscale (family testing setup)

This is a family-testing setup, not a production deployment: run the
multi-user sync backend on a home Linux machine, reachable securely from
family iPhones on Safari, working offline when not connected, and syncing
when reachable.

## Why Tailscale

Plain LAN HTTP fails because iOS requires a secure context for
service-worker registration, so offline PWA caching can't work over
`http://<lan-ip>`. Tailscale's free Personal plan supports multiple users
and devices, and `tailscale cert` gets a real Let's Encrypt certificate for
a `*.ts.net` MagicDNS name with zero domain ownership, zero per-device CA
installs, and zero recurring fees.

**Known tradeoff, accepted deliberately:** this drops a strict
"must be physically on the home LAN" requirement — a tailnet is reachable
from anywhere the device has internet, not just at home. A tailnet still
requires each device to be explicitly added by its owner (cryptographic
identity), which is a stronger access boundary than "anyone on the WiFi".

## Target architecture

```
iPhone (Tailscale app, on or off home WiFi)
   │  WireGuard, encrypted, authenticated by tailnet membership
   ▼
Linux box (tailnet member)
   │
   ├─ tailscale serve   → terminates TLS for <hostname>.<tailnet>.ts.net,
   │                       auto-provisions/renews the Let's Encrypt cert
   │
   ├─ /            → serves the CRA build/ output (static, single origin)
   └─ /api/*       → reverse-proxied to 127.0.0.1:4000 (the sync server)
```

Single origin for app + API means no CORS configuration needed, no
mixed-content issues (both are HTTPS), and the existing
`REACT_APP_SYNC_API_HOST` env var (`src/config.js`) just becomes the
`ts.net` URL — no code change needed there.

## Server changes made for this deployment

- `server/index.ts` binds to `127.0.0.1` by default (configurable via the
  `HOST` env var), since `tailscale serve` reverse-proxies to it locally.
  Set `HOST=0.0.0.0` for LAN-reachable local dev if needed.
- `server/index.ts` refuses to start with `NODE_ENV=production` unless
  `TOKEN_SECRET` and `ENCRYPTION_KEY` are set, so it can't silently run on
  dev-only default secrets in a real deployment.

## Step-by-step setup: Linux Mint box + 2 iPhones

1. **Install Tailscale on the Linux box.**
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
   Follow the printed URL to authenticate and join (or create) a tailnet.

2. **Enable HTTPS certificates for the tailnet.** In the
   [Tailscale admin console](https://login.tailscale.com/admin/dns), under
   DNS, enable "HTTPS Certificates".

3. **Build the frontend** with the sync API host set to the tailnet
   origin (pick a machine name when running `tailscale up`, e.g.
   `expenses`; find your tailnet name with `tailscale status`):
   ```bash
   REACT_APP_SYNC_API_HOST=https://expenses.<your-tailnet-name>.ts.net npm run build
   ```

4. **Set real secrets and start the sync server:**
   ```bash
   export NODE_ENV=production
   export TOKEN_SECRET=$(openssl rand -hex 32)
   export ENCRYPTION_KEY=$(openssl rand -hex 32)
   npm run sync-server   # or run via pm2/systemd for persistence
   ```
   `server/index.ts` binds to `127.0.0.1:4000` by default — it is not
   reachable directly over the LAN.

5. **Serve the app and proxy the API through Tailscale** (exact `serve`
   syntax may vary by installed version — check `tailscale serve --help`).
   `tailscale serve` requires root to change the serve config — either
   prefix every call with `sudo`, or run the one-time operator setup so
   you don't have to:
   ```bash
   sudo tailscale set --operator=$USER   # once
   ```
   The static-file target **must be an absolute path** — a relative path
   like `build/` gets parsed as a proxy target instead of a directory and
   fails with `must include a scheme`. `$(pwd)/build` (or `"$PWD/build"`)
   is the reliable way to get one; note `pwd` is a *command*, so
   `${pwd}` (lowercase, no parens) silently expands to nothing rather than
   erroring:
   ```bash
   tailscale serve --bg --set-path=/ "$(pwd)/build"
   tailscale serve --bg --set-path=/api http://127.0.0.1:4000/api
   tailscale serve status   # confirm both routes are registered
   ```
   The `/api` proxy target must include the `/api` path itself
   (`http://127.0.0.1:4000/api`, not just `127.0.0.1:4000`) —
   `tailscale serve` strips the `--set-path` mount prefix before
   forwarding, but the sync server's own routes are registered under
   `/api/...` (see `server/core/router.ts`), so a bare `127.0.0.1:4000`
   target makes every request 404 at the server (it arrives as
   `/auth/signup` instead of `/api/auth/signup`). Sanity check with:
   ```bash
   curl -i -X POST https://<machine-name>.<tailnet-name>.ts.net/api/auth/signup \
     -H "Content-Type: application/json" -d '{}'
   ```
   A `400 VALIDATION_ERROR` response means the path reached the right
   route; a `404 NOT_FOUND` means the prefix is still being stripped —
   double-check the proxy target includes `/api`.

   This provisions/renews the Let's Encrypt cert automatically for
   `<machine-name>.<tailnet-name>.ts.net`.

6. **Install the Tailscale app on both family iPhones** (App Store), and
   sign into the same tailnet — either with the same account, or by
   inviting each phone as its own tailnet member from the admin console
   (Settings → Users → Invite member), whichever fits your device-count
   accounting on the free tier.

7. **Open the app on each iPhone.** In Safari, visit
   `https://<machine-name>.<tailnet-name>.ts.net`. It should load over a
   trusted HTTPS certificate with no manual trust step.

8. **Test the flows:**
   - Join on home Wi-Fi with both phones, confirm sync between them.
   - Switch one phone to cellular only (leave the home network),
     confirm the app is still reachable via Tailscale.
   - Turn off networking entirely (airplane mode) and confirm the app
     shell still opens from the service worker's precache, with entries
     already loaded remaining usable locally.
   - Reconnect and confirm the "Sync with party" Retry flow picks the
     staged decision set back up (`docs/multi-user-sync/DESIGN.md`).

## Open items / not yet decided

- Whether each family member gets their own Tailscale account or shares
  one across devices — affects free-tier device/user accounting.
- No rate limiting on the auth endpoints (signup/login) — acceptable for a
  small family tailnet, would need addressing before wider deployment.
