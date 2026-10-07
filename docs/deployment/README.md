# Deployment

The app is built once in CI, shipped as a signed, versioned archive, and pulled
onto the home server by one command. The box never builds anything: it
downloads a GitHub Release, checks an SSH signature against a key it already
trusts, switches an atomic `current` symlink and publishes the result to your
tailnet with `tailscale serve`. Merging a pull request is the only manual step
of a release.

```
 PR ──► Release readiness ──► merge to master ──► release.yml
        (version bumped?                              │ checks, build, package,
         CHANGELOG entry?)                            │ sign SHA256SUMS
                                                      ▼
                                       GitHub Release v<version>
                                       ├─ expenses-manager-<version>.tar.gz
                                       ├─ SHA256SUMS
                                       └─ SHA256SUMS.sig
                                                      │
        on the box:  sudo deploy-expenses-manager     ▼
        download ─► verify signature + checksums ─► unpack ─► back up data
                 ─► switch `current` ─► systemd restart ─► health check
                 ─► tailscale serve  (/ = static app, /api = sync server)
```

## Pages

| Page | Read it when |
|---|---|
| [releases.md](releases.md) | you want to know how a merge becomes a release, or a release failed |
| [server-setup.md](server-setup.md) | setting things up for the first time (signing key, box, installer) |
| [operating.md](operating.md) | day-to-day: start, stop, deploy, roll back, logs, troubleshooting |
| [tailscale-sync.md](tailscale-sync.md) | why Tailscale, and the legacy manual / `deploy.sh` flow |

## Security model

- **The signature is the trust anchor, and it lives on the box.** Releases are
  signed in CI with an SSH key (`ssh-keygen -Y sign`); the box verifies with the
  public key it got from your own git clone at install time
  (`/etc/expenses-manager/allowed_signers`). Nothing fetched at deploy time can
  change who is trusted.
- **Checksums bind the archive to the signature.** The signed `SHA256SUMS`
  covers the tarball, and the signed manifest inside it pins the SHA-256 of the
  Node runtime the box downloads.
- **Least privilege.** The server runs as the `expenses-manager` system user
  with a hardened systemd unit (read-only filesystem except its data
  directory, no new privileges, no capabilities).
- **Secrets stay in root-only files.** `TOKEN_SECRET`, `ENCRYPTION_KEY` and an
  optional GitHub token live in `/etc/expenses-manager/` (`0600`, root). They
  are never in git, in a release, or in a process list.
- **Tailnet-only exposure.** The server binds `127.0.0.1`; `tailscale serve`
  is the only way in, and the service is off until you start it.

## Design decisions worth knowing

- **Host-agnostic bundle.** Releases are built with
  `REACT_APP_SYNC_API_HOST=same-origin`: the app calls `/api` on whichever
  origin serves it, so no tailnet hostname is baked in. (An empty value would
  mean "sync not configured", hence the explicit `same-origin`; see
  `src/config.js`.)
- **Data lives outside releases.** The sync server reads `DATA_DIR`
  (`/var/lib/expenses-manager/data`), so deploying or rolling back never moves
  data; each deploy also takes a backup first.
- **Fix forward.** A bad release is replaced by a new version. Tags and
  releases are never deleted, moved or re-created.
- **Public or private repo, same flow.** Downloads use the GitHub REST API;
  a token is used only if one is configured.
- **Requires systemd** and a handful of standard tools (`curl jq tar gzip
  openssh-client util-linux`); otherwise any Linux distribution works.
- The legacy `deploy.sh` / `stop.sh` remain until
  https://github.com/rivasvict/react-expenses-manager/issues/201 is resolved.
