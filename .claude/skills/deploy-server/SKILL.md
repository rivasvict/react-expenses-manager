---
name: deploy-server
description: Deploy, roll back, start, stop or diagnose the expenses-manager server box with the deploy-expenses-manager command, or run its one-time install. Use when running on the server (from the owner's clone there) or when asked to deploy, roll back, check status or troubleshoot the box. For the release pipeline in CI use the release skill.
---

# Deploy server (the box)

This skill only loads when Claude Code runs **inside a clone of this
repository**, which is why the installer tells the owner to keep their clone
on the box. Docs: `docs/deployment/operating.md` (daily use, troubleshooting)
and `docs/deployment/server-setup.md` (one-time setup).

## Commands

| Command | Does |
|---|---|
| `sudo deploy-expenses-manager [latest\|vX.Y.Z] [--force]` | download, verify signature and checksums, back up data, switch, restart, health-check, publish; auto-rolls back on failure |
| `sudo deploy-expenses-manager start` / `stop` | start + publish / stop + unpublish (the box is offline by default) |
| `deploy-expenses-manager status` | current and previous version, service state, health, URL |
| `deploy-expenses-manager list` | releases on disk |
| `deploy-expenses-manager logs [-f]` | service journal |
| `sudo deploy-expenses-manager rollback` | swap back to `previous` |

## Reading the output

- `status`: `current`/`previous` are versions; `service` is the systemd state;
  `health ok` means `/api/health` answers on loopback. Service active but
  health down means the server is crashing: read `logs`.
- A failed deploy prints "rolling back" and the last 30 journal lines; the old
  version is already back. Fix forward with a new release.

## Troubleshooting flow

Mirror `docs/deployment/operating.md`: signature failure (never bypass;
check `/etc/expenses-manager/allowed_signers` against the repo's
`deploy/allowed_signers`) -> 401/403/404 (token missing or expired, or private
repo) -> health timeout / rollback (logs, port 4000 clash) -> tailscale serve or
certificate errors (`tailscale status`, HTTPS certificates in the admin
console) -> unsupported architecture (linux-x64 and linux-arm64 only).

## One-time install

Follow `docs/deployment/server-setup.md` step by step; the installer is
`sudo TOKEN_SECRET=… ENCRYPTION_KEY=… ./deploy/install-expenses-manager.sh`.
The owner supplies the secrets; you do not.

## Hard rules

- **Never generate or rotate `TOKEN_SECRET` or `ENCRYPTION_KEY`.** Rotating them
  invalidates sessions and makes stored invitations unreadable.
- Never edit anything in `/etc/expenses-manager/` or delete
  `/var/lib/expenses-manager` without the owner's explicit OK.
- Never bypass signature verification (no skipping `ssh-keygen -Y verify`, no
  hand-unpacking an unverified archive into `releases/`).
- Never `systemctl enable` the service unless asked; offline-by-default is a
  design decision.
- Confirm with the owner before `rollback` or `stop` if someone may be using
  the app.
- Never delete, retag or edit a published release; a bad version is fixed by
  deploying a newer one or rolling back.
