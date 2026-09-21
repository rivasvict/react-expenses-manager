#!/usr/bin/env bash
#
# One-shot deployment of the frontend + sync server behind Tailscale.
# Implements the manual steps in docs/deployment/tailscale-sync.md:
#
#   1. pick the revision to deploy (latest master, a ref, or what is checked out)
#   2. stop anything already serving (tailscale serve + sync server)
#   3. build the CRA bundle pointed at the tailnet origin, and the server
#   4. start the sync server (detached, with logs)
#   5. publish / and /api through `tailscale serve`
#
# Usage:  ./deploy.sh          (run it from the Linux box that is on the tailnet)
#
# Environment:
#   TOKEN_SECRET     required — token signing secret for the sync server.
#   ENCRYPTION_KEY   required — invitation-record encryption key.
#   SERVER_URL       tailnet origin, e.g.
#                    https://<server-name>.<tailnet-name>.ts.net. Derived from
#                    `tailscale status` when unset.
#   PORT             loopback port for the sync server (default 4000).

set -euo pipefail

readonly REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DEPLOY_DIR="$REPO_DIR/.deploy"
readonly LOG_FILE="$DEPLOY_DIR/sync-server.log"
readonly PID_FILE="$DEPLOY_DIR/sync-server.pid"
readonly TMUX_SESSION="expenses-sync"
readonly SYNC_PORT="${PORT:-4000}"

# --- output helpers ---------------------------------------------------------

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31merror:\033[0m %s\n' "$*" >&2
  exit 1
}

# --- validation -------------------------------------------------------------

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "\`$1\` is required but was not found in PATH. $2"
}

check_prerequisites() {
  require_command git "Install git and re-run."
  require_command npm "Install Node.js (via nvm) and re-run."
  require_command curl "Install curl and re-run."
  require_command tailscale \
    "Install it with: curl -fsSL https://tailscale.com/install.sh | sh"

  tailscale status >/dev/null 2>&1 ||
    die "This machine is not connected to a tailnet. Run \`sudo tailscale up\` first."

  # Changing the serve config always needs root — reading its status can
  # succeed without it, so a status probe is not a usable capability check.
  require_command sudo "Install sudo, or run this script as root."
  info "Changing the tailscale serve config needs root — sudo will ask for your password."
}

# The sync server refuses to start under NODE_ENV=production without these
# (server/index.ts), so fail here with a clearer message than a dead process.
check_secrets() {
  local missing=()
  [ -n "${TOKEN_SECRET:-}" ] || missing+=("TOKEN_SECRET")
  [ -n "${ENCRYPTION_KEY:-}" ] || missing+=("ENCRYPTION_KEY")

  [ ${#missing[@]} -eq 0 ] ||
    die "Missing required environment variable(s): ${missing[*]}. Export them (from wherever you keep the deployment secrets) before running this script — do not generate new ones, since rotating TOKEN_SECRET invalidates every issued session token and rotating ENCRYPTION_KEY makes stored invitation records undecryptable."

  export TOKEN_SECRET ENCRYPTION_KEY
}

# nvm is a shell function, so it has to be sourced rather than found in PATH.
load_nvm() {
  local nvm_script="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  [ -s "$nvm_script" ] ||
    die "nvm was not found at $nvm_script. Install nvm (https://github.com/nvm-sh/nvm) or set NVM_DIR."
  # shellcheck disable=SC1090
  . "$nvm_script"
}

# Runs a command under the Node version pinned by the .nvmrc in $1. The switch
# stays in effect afterwards, so every caller states the directory it wants
# rather than relying on whatever ran last.
run_with_node_from() {
  local nvmrc_dir="$1"
  shift
  local version
  version="$(tr -d '[:space:]' <"$nvmrc_dir/.nvmrc")"
  [ -n "$version" ] || die "$nvmrc_dir/.nvmrc is empty — cannot pick a Node version."

  nvm use "$version" >/dev/null 2>&1 ||
    die "Node $version (pinned by $nvmrc_dir/.nvmrc) is not installed. Run: nvm install $version"

  "$@"
}

# --- revision selection -----------------------------------------------------

ensure_clean_worktree() {
  git -C "$REPO_DIR" diff --quiet && git -C "$REPO_DIR" diff --cached --quiet ||
    die "The working tree has uncommitted changes. Commit or stash them before switching revisions."
}

select_revision() {
  local answer ref
  read -r -p "Deploy the latest version from master? [y/N] " answer || answer=""

  if [[ "$answer" =~ ^[Yy]$ ]]; then
    ensure_clean_worktree
    info "Fetching origin/master…"
    git -C "$REPO_DIR" fetch origin master ||
      die "Could not fetch origin/master. Check the network and the \`origin\` remote."
    git -C "$REPO_DIR" checkout master ||
      die "Could not check out master."
    git -C "$REPO_DIR" merge --ff-only origin/master ||
      die "master cannot be fast-forwarded onto origin/master. Reconcile it manually and re-run."
    return
  fi

  read -r -p "Branch or commit to deploy (empty = current checkout): " ref || ref=""
  if [ -z "$ref" ]; then
    info "Deploying the current checkout — nothing is fetched or updated."
    return
  fi

  ensure_clean_worktree
  info "Fetching refs from origin…"
  git -C "$REPO_DIR" fetch --all --tags --prune ||
    die "Could not fetch from origin. Check the network and the \`origin\` remote."
  git -C "$REPO_DIR" rev-parse --verify --quiet "${ref}^{commit}" >/dev/null ||
    die "\`$ref\` is not a known branch, tag or commit in this repository."
  git -C "$REPO_DIR" checkout "$ref" ||
    die "Could not check out \`$ref\`."
  # A branch checkout should track its remote tip; a tag/commit is detached
  # and has nothing to fast-forward to.
  if git -C "$REPO_DIR" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git -C "$REPO_DIR" merge --ff-only '@{u}' ||
      die "\`$ref\` cannot be fast-forwarded onto its upstream. Reconcile it manually and re-run."
  fi
}

# --- tailnet origin ---------------------------------------------------------

resolve_server_url() {
  if [ -n "${SERVER_URL:-}" ]; then
    info "Using SERVER_URL from the environment: $SERVER_URL"
  else
    # `tailscale status --json` puts this machine's Self block first, so the
    # first DNSName in the output is ours — read it with grep/sed rather than
    # taking on a jq dependency.
    local dns_name
    dns_name="$(tailscale status --json | grep -m1 '"DNSName"' |
      sed -E 's/.*"DNSName":[[:space:]]*"([^"]+)".*/\1/')"
    dns_name="${dns_name%.}"
    [ -n "$dns_name" ] ||
      die "Could not determine this machine's MagicDNS name. Set SERVER_URL explicitly, e.g. SERVER_URL=https://<server-name>.<tailnet-name>.ts.net ./deploy.sh"
    SERVER_URL="https://$dns_name"
    info "Derived the tailnet origin from tailscale: $SERVER_URL"
  fi

  [[ "$SERVER_URL" == https://* ]] ||
    die "SERVER_URL must be an https:// origin (got: $SERVER_URL). iOS needs a secure context for the service worker."
  SERVER_URL="${SERVER_URL%/}"
  export SERVER_URL
}

# --- stop whatever is already running ---------------------------------------

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

  # Anything else still holding the port would make the new server exit with
  # EADDRINUSE, so clear it out too.
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${SYNC_PORT}/tcp" >/dev/null 2>&1 || true
  fi
}

# --- build ------------------------------------------------------------------

install_dependencies() {
  if [ ! -d "$REPO_DIR/node_modules" ]; then
    info "Installing npm dependencies…"
    (cd "$REPO_DIR" && npm install --no-audit --no-fund) ||
      die "npm install failed."
  fi
}

build_frontend() {
  info "Building the frontend against $SERVER_URL…"
  (cd "$REPO_DIR" && REACT_APP_SYNC_API_HOST="$SERVER_URL" npm run build) ||
    die "The frontend build failed — see the output above."
  [ -f "$REPO_DIR/build/index.html" ] ||
    die "The build finished but $REPO_DIR/build/index.html is missing."
}

build_server() {
  info "Compiling the sync server…"
  (cd "$REPO_DIR" && npm run build:server) ||
    die "The server build failed — see the output above."
  [ -f "$REPO_DIR/server/dist/index.js" ] ||
    die "The server build finished but server/dist/index.js is missing."
}

# --- run --------------------------------------------------------------------

start_sync_server() {
  info "Starting the sync server on 127.0.0.1:$SYNC_PORT…"
  : >"$LOG_FILE"

  # The caller has already selected server/.nvmrc's Node version, so resolve
  # its binary by absolute path: the detached shell below does not inherit
  # nvm, and `npm run sync-server` would recompile the server under this
  # version instead of keeping the build made above.
  local node_bin
  node_bin="$(command -v node)"
  local run_cmd="cd $(printf '%q' "$REPO_DIR") && $(printf '%q' "$node_bin") server/dist/index.js"

  if command -v tmux >/dev/null 2>&1; then
    tmux new-session -d -s "$TMUX_SESSION" \
      "$run_cmd 2>&1 | tee -a $(printf '%q' "$LOG_FILE")" ||
      die "Could not start the sync server in tmux."
    ATTACH_COMMAND="tmux attach -t $TMUX_SESSION"
  else
    warn "tmux is not installed — starting the server detached with nohup instead."
    nohup bash -c "$run_cmd" >>"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
    ATTACH_COMMAND="tail -f $LOG_FILE"
  fi
}

wait_for_sync_server() {
  local attempt
  for attempt in $(seq 1 60); do
    # Any HTTP status means the listener is up; 000 means nothing answered.
    if [ "$(curl -s -o /dev/null -w '%{http_code}' \
      "http://127.0.0.1:$SYNC_PORT/api/me")" != "000" ]; then
      info "Sync server is answering on 127.0.0.1:$SYNC_PORT."
      return
    fi
    sleep 1
  done

  die "The sync server did not start within 60s. Last log lines:
$(tail -n 20 "$LOG_FILE" 2>/dev/null)"
}

publish_through_tailscale() {
  info "Publishing the app and API through tailscale serve…"
  # The static target must be an absolute path, and the /api proxy target must
  # keep the /api prefix (docs/deployment/tailscale-sync.md, step 5).
  sudo tailscale serve --bg --set-path=/ "$REPO_DIR/build" ||
    die "\`tailscale serve\` could not publish $REPO_DIR/build."
  sudo tailscale serve --bg --set-path=/api "http://127.0.0.1:$SYNC_PORT/api" ||
    die "\`tailscale serve\` could not publish the /api proxy."
}

verify_deployment() {
  info "Verifying $SERVER_URL/api/auth/signup routes to the sync server…"
  local status
  status="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    "$SERVER_URL/api/auth/signup" -H "Content-Type: application/json" -d '{}' || echo 000)"

  case "$status" in
  400) : ;; # VALIDATION_ERROR — the request reached the right route
  404) die "$SERVER_URL/api/auth/signup returned 404: the /api proxy target is losing the /api prefix." ;;
  000) die "Could not reach $SERVER_URL. Check \`sudo tailscale serve status\` and that HTTPS certificates are enabled in the admin console." ;;
  *) die "Unexpected HTTP $status from $SERVER_URL/api/auth/signup. Last log lines:
$(tail -n 20 "$LOG_FILE" 2>/dev/null)" ;;
  esac
}

print_summary() {
  printf '\n\033[1;32mDeployment complete.\033[0m\n\n'
  printf '  App URL            %s\n' "$SERVER_URL"
  printf '  Sync server logs   %s\n' "$ATTACH_COMMAND"
  printf '  Log file           %s\n' "$LOG_FILE"
  printf '  Deployed revision  %s (%s)\n' \
    "$(git -C "$REPO_DIR" rev-parse --short HEAD)" \
    "$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)"
  printf '\n'
}

main() {
  cd "$REPO_DIR"
  mkdir -p "$DEPLOY_DIR"

  # Secrets first: failing on a missing env var should not cost a sudo prompt.
  check_secrets
  check_prerequisites
  load_nvm
  select_revision
  resolve_server_url
  stop_running_services

  # Builds run under the repo-root .nvmrc; the server process runs under
  # server/.nvmrc (server/README.md explains why the two differ).
  run_with_node_from "$REPO_DIR" install_dependencies
  run_with_node_from "$REPO_DIR" build_frontend
  run_with_node_from "$REPO_DIR" build_server

  export NODE_ENV=production
  export HOST=127.0.0.1
  export PORT="$SYNC_PORT"
  export CORS_ORIGIN="$SERVER_URL"
  run_with_node_from "$REPO_DIR/server" start_sync_server
  wait_for_sync_server

  publish_through_tailscale
  verify_deployment
  print_summary
}

main "$@"
