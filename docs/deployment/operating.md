# Operating the box

## Daily use

```bash
# power the box on, then:
sudo deploy-expenses-manager        # deploys the latest release, or starts what is deployed
# ... use the app ...
sudo deploy-expenses-manager stop   # stops the server and unpublishes it
# power the box off
```

`deploy-expenses-manager` re-runs itself with `sudo` if needed. With nothing new
released, the default command just starts the current version.

| Command | What it does |
|---|---|
| `deploy-expenses-manager [latest\|vX.Y.Z] [--force]` | download, verify, back up, switch, restart, publish; `--force` redeploys the current version |
| `deploy-expenses-manager start` | start the service and publish it (no version change) |
| `deploy-expenses-manager stop` | stop the service and remove this app's two `tailscale serve` paths |
| `deploy-expenses-manager status` | current/previous version, service state, health, URL |
| `deploy-expenses-manager rollback` | swap back to the previous release |
| `deploy-expenses-manager list` | releases on disk, marking current and previous |
| `deploy-expenses-manager logs [-f]` | the service's journal |

A deploy takes a data backup, switches, and health-checks the new version
locally and through the tailnet origin. If anything fails after the switch it
**rolls back automatically**, prints the last 30 log lines and exits non-zero.
On success the deployer also updates itself from the release and prunes old
releases (keeping `KEEP_RELEASES`, never `current` or `previous`).

Deploy a specific version: `sudo deploy-expenses-manager v1.24.0`. Roll back by
hand: `sudo deploy-expenses-manager rollback` (check first that nobody is using
the app).

## Where everything lives

```
/opt/expenses-manager/
  bin/deploy-expenses-manager.sh      the deployer (self-updated)
  releases/<version>/                 build/, server/dist/, release.json, deploy/, node -> ../node/<v>
  current -> releases/<version>       what runs
  previous -> releases/<version>      what `rollback` returns to
  node/<node-version>/                official Node tarball, checked against the signed manifest
  downloads/                          scratch, emptied after every run
/usr/local/bin/deploy-expenses-manager -> /opt/expenses-manager/bin/deploy-expenses-manager.sh
/etc/expenses-manager/                root only (0700)
  expenses-manager.env                TOKEN_SECRET, ENCRYPTION_KEY, NODE_ENV, HOST, PORT, CORS_ORIGIN, DATA_DIR
  deploy.conf                         GITHUB_REPO, KEEP_RELEASES, KEEP_BACKUPS, PORT, GITHUB_TOKEN_FILE
  github-token                        only for a private repo
  allowed_signers                     the trusted release-signing public key
/var/lib/expenses-manager/            owned by the service user (0700)
  data/                               the sync server's data (DATA_DIR)
  backups/<UTC time>-before-<version>.tar.gz
/etc/systemd/system/expenses-manager.service    not enabled at boot
```

## Backups and restoring one

Every deploy writes `backups/<UTC time>-before-<version>.tar.gz` (the newest
`KEEP_BACKUPS` are kept). To restore:

```bash
sudo deploy-expenses-manager stop
sudo mv /var/lib/expenses-manager/data /var/lib/expenses-manager/data.broken
sudo mkdir /var/lib/expenses-manager/data
sudo tar -xzf /var/lib/expenses-manager/backups/<file>.tar.gz -C /var/lib/expenses-manager/data
sudo chown -R expenses-manager:expenses-manager /var/lib/expenses-manager/data
sudo chmod 700 /var/lib/expenses-manager/data
sudo deploy-expenses-manager start
```

Delete `data.broken` once you are satisfied.

## Troubleshooting

| You see | Meaning and fix |
|---|---|
| "The signature on SHA256SUMS does not verify" | The release is not signed by the key on the box, the key was rotated, or OpenSSH is older than 8.1. Nothing was changed. Never bypass it. Check `/etc/expenses-manager/allowed_signers` against `deploy/allowed_signers` in the repo; after a rotation, re-run the installer ([server-setup.md](server-setup.md), step 9) |
| "placeholder key" | `allowed_signers` was never set up ([server-setup.md](server-setup.md), step 1) |
| "checksum … does not match" | Corrupt or tampered download; retry, and if it repeats treat the release as suspect |
| GitHub "answered 401/403" | Token missing, expired or without access, or rate limited. Create or renew the fine-grained read-only token ([server-setup.md](server-setup.md), step 4) |
| GitHub "answered 404" | The release does not exist; or the repo is private and no token is configured |
| "did not answer /api/health" or an automatic rollback | The new version crashed or the port is busy. Read the printed log lines; `deploy-expenses-manager logs`; `ss -ltnp \| grep 4000` for a port clash. The previous version is already back |
| "did not answer … /version.json" / `tailscale serve` errors | HTTPS certificates are not enabled for the tailnet, or tailscale is down: `tailscale status`, `tailscale serve status`, admin console → DNS → HTTPS Certificates |
| "serves a different build" | The tailnet origin is serving something else; check `tailscale serve status` for another route on `/` |
| "Unsupported CPU architecture" | Releases ship Node for linux-x64 and linux-arm64 only |
| "Another deploy-expenses-manager is already running" | A concurrent run holds the lock; wait for it |
| "`jq` is required…" and similar | Install the missing prerequisite ([server-setup.md](server-setup.md), step 3) |
