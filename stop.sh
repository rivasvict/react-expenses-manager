#!/usr/bin/env bash
#
# Stops everything deploy.sh starts: the published `tailscale serve` routes
# and the detached sync server (tmux session, or its nohup'd PID).
#
# Usage:  ./stop.sh          (run it from the Linux box that is on the tailnet)
#
# deploy.sh sources this file and runs the same stop before redeploying, so
# there is one place that knows how to tear the setup down.

set -euo pipefail

# deploy.sh sources this file with these already set (readonly, in its own
# case) — `:=` only assigns when a variable is unset or empty, so it never
# touches an already-set one and never trips "readonly variable" errors.
: "${REPO_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
: "${DEPLOY_DIR:=$REPO_DIR/.deploy}"
: "${PID_FILE:=$DEPLOY_DIR/sync-server.pid}"
: "${TMUX_SESSION:=expenses-sync}"
: "${SYNC_PORT:=${PORT:-4000}}"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }

stop_running_services() {
  info "Stopping any running tailscale serve config and sync server…"

  sudo tailscale serve reset >/dev/null 2>&1 ||
    warn "Could not reset the tailscale serve config — continuing anyway."

  if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    tmux kill-session -t "$TMUX_SESSION"
  fi

  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi

  # Anything else still holding the port would block a future deploy from
  # binding it, so clear it out too.
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${SYNC_PORT}/tcp" >/dev/null 2>&1 || true
  fi

  info "Done. Nothing should be listening on 127.0.0.1:$SYNC_PORT or published via tailscale serve."
}

# Only run when executed directly — deploy.sh sources this file instead to
# reuse stop_running_services() without spawning a second process.
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  stop_running_services
fi
