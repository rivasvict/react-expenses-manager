#!/usr/bin/env bash
#
# One-time, idempotent bootstrap of the release-based deployment on the
# server box (docs/deployment/server-setup.md, step 5). Run it as root from
# your existing git clone, which is the bootstrap trust anchor: the signing
# public key and the deployer come from the clone you already trust, not from
# the network.
#
#   git pull && sudo TOKEN_SECRET=… ENCRYPTION_KEY=… ./deploy/install-expenses-manager.sh
#
# Options:
#   --migrate-from <clone>      clone holding the legacy deploy.sh data
#                               (server/.data); default: the clone this script
#                               runs from
#   --github-token-file <file>  private repo: copy this file (a fine-grained,
#                               read-only token) to /etc/expenses-manager/github-token
#                               and have the deployer use it
#   -h, --help
#
# Environment:
#   TOKEN_SECRET, ENCRYPTION_KEY  existing secrets to store; prompted for
#                                 (hidden input) when absent and the env file
#                                 does not exist yet
#   SERVER_URL                    tailnet origin; derived from `tailscale status`
#                                 when unset
#   PORT                          sync server loopback port (default 4000)
#
# Re-running changes nothing that already exists, except it refreshes the
# deployer, the unit file, the /usr/local/bin link and allowed_signers (so a
# rotated signing key reaches the box) and says so.
#
# Test seams: EM_PREFIX, EM_SYSTEMCTL, EM_TAILSCALE, EM_SKIP_ROOT_CHECK (skips
# the root, systemd and user/ownership steps, which a test cannot perform).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly CLONE_DIR="$SCRIPT_DIR/.."

EM_PREFIX="${EM_PREFIX:-}"
readonly OPT_DIR="$EM_PREFIX/opt/expenses-manager"
readonly ETC_DIR="$EM_PREFIX/etc/expenses-manager"
readonly VAR_DIR="$EM_PREFIX/var/lib/expenses-manager"
readonly BIN_LINK="$EM_PREFIX/usr/local/bin/deploy-expenses-manager"
readonly UNIT_FILE="$EM_PREFIX/etc/systemd/system/expenses-manager.service"
readonly SYSTEMCTL="${EM_SYSTEMCTL:-systemctl}"
readonly TAILSCALE="${EM_TAILSCALE:-tailscale}"
readonly SERVICE_USER="expenses-manager"
readonly DEFAULT_REPO="rivasvict/react-expenses-manager"
readonly DOCS_SETUP="docs/deployment/server-setup.md"
readonly PORT_VALUE="${PORT:-4000}"

MIGRATE_FROM="$CLONE_DIR"
TOKEN_SOURCE=""
PRIVATE_REPO=""

# --- output helpers ---------------------------------------------------------

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31merror:\033[0m %s\n' "$*" >&2
  exit 1
}

# --- helpers ----------------------------------------------------------------

skip_system_steps() { [ -n "${EM_SKIP_ROOT_CHECK:-}" ]; }

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "\`$1\` is required but was not found in PATH. $2"
}

# owner:group and mode for a path; ownership is skipped where the system
# steps are (a test cannot chown).
secure() {
  local mode="$1" owner="$2" path="$3"
  chmod "$mode" "$path"
  if ! skip_system_steps; then chown "$owner" "$path"; fi
}

make_dir() {
  mkdir -p "$3"
  secure "$1" "$2" "$3"
}

# Replaces $2 with $1 only when they differ, reporting what happened.
refresh_file() {
  local source="$1" dest="$2" mode="$3" label="$4"
  if [ -f "$dest" ] && cmp -s "$source" "$dest"; then
    info "$label is up to date."
    return
  fi
  local state="Installed"
  if [ -f "$dest" ]; then state="Refreshed"; fi
  install -m "$mode" "$source" "$dest.new"
  mv -f "$dest.new" "$dest"
  info "$state $label."
}

has_real_signers() {
  [ -s "$1" ] && ! grep -v '^[[:space:]]*#' "$1" | grep -q PLACEHOLDER
}

usage() {
  sed -n '3,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

# --- steps ------------------------------------------------------------------

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
    --migrate-from)
      [ $# -ge 2 ] || die "--migrate-from needs a path."
      MIGRATE_FROM="$2"
      shift
      ;;
    --github-token-file)
      [ $# -ge 2 ] || die "--github-token-file needs a path."
      TOKEN_SOURCE="$2"
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) die "Unknown argument \"$1\" (see --help)." ;;
    esac
    shift
  done
}

check_prerequisites() {
  if ! skip_system_steps; then
    [ "$(id -u)" -eq 0 ] ||
      die "Run this as root, passing the secrets through sudo: sudo TOKEN_SECRET=… ENCRYPTION_KEY=… $0"
    [ -d /run/systemd/system ] ||
      die "systemd is not the init system here, and it is required ($DOCS_SETUP, prerequisites)."
  fi

  local tool
  for tool in curl jq tar gzip sha256sum ssh-keygen flock install; do
    require_command "$tool" "Install it with your package manager; see the prerequisites in $DOCS_SETUP."
  done
  if ! skip_system_steps; then
    require_command useradd "Install shadow-utils / passwd."
    require_command groupadd "Install shadow-utils / passwd."
  fi
  require_command "$SYSTEMCTL" "systemd is required."
  require_command "$TAILSCALE" "Install it with: curl -fsSL https://tailscale.com/install.sh | sh"

  "$TAILSCALE" status >/dev/null 2>&1 ||
    die "This machine is not connected to a tailnet. Run \`sudo tailscale up\` first."

  [ -f "$CLONE_DIR/deploy/deploy-expenses-manager.sh" ] ||
    die "Run this script from a full clone of the repository."
  has_real_signers "$CLONE_DIR/deploy/allowed_signers" ||
    die "deploy/allowed_signers still holds the placeholder key. Put the real release-signing public key in it (and merge that) before installing; see $DOCS_SETUP, step 1."
}

create_user() {
  skip_system_steps && return
  if ! getent group "$SERVICE_USER" >/dev/null; then
    groupadd --system "$SERVICE_USER"
    info "Created group $SERVICE_USER."
  fi
  if id -u "$SERVICE_USER" >/dev/null 2>&1; then
    info "User $SERVICE_USER already exists."
    return
  fi
  local nologin
  nologin="$(command -v nologin || echo /usr/sbin/nologin)"
  useradd --system --gid "$SERVICE_USER" --home-dir /var/lib/expenses-manager \
    --no-create-home --shell "$nologin" "$SERVICE_USER"
  info "Created user $SERVICE_USER (no login shell)."
}

create_directories() {
  make_dir 0755 root:root "$OPT_DIR"
  local sub
  for sub in bin releases node downloads; do
    make_dir 0755 root:root "$OPT_DIR/$sub"
  done
  make_dir 0700 root:root "$ETC_DIR"
  make_dir 0700 "$SERVICE_USER:$SERVICE_USER" "$VAR_DIR"
  make_dir 0700 "$SERVICE_USER:$SERVICE_USER" "$VAR_DIR/data"
  make_dir 0700 "$SERVICE_USER:$SERVICE_USER" "$VAR_DIR/backups"
  mkdir -p "$(dirname "$UNIT_FILE")" "$(dirname "$BIN_LINK")"
}

install_files() {
  refresh_file "$CLONE_DIR/deploy/allowed_signers" "$ETC_DIR/allowed_signers" 0644 "the release-signing key"
  refresh_file "$CLONE_DIR/deploy/expenses-manager.service" "$UNIT_FILE" 0644 "the systemd unit"
  refresh_file "$CLONE_DIR/deploy/deploy-expenses-manager.sh" "$OPT_DIR/bin/deploy-expenses-manager.sh" 0755 "the deploy command"
  ln -sfn "/opt/expenses-manager/bin/deploy-expenses-manager.sh" "$BIN_LINK"
  # Pointing at the unprefixed path is right on a real box; under EM_PREFIX the
  # link dangles, which is fine because tests call the script directly.
  "$SYSTEMCTL" daemon-reload
  # Not enabled on purpose: the server is offline until someone starts it.
}

# Hidden prompt for a secret; falls back to failing clearly when there is no
# terminal to ask on.
prompt_secret() {
  local name="$1" value
  [ -t 0 ] ||
    die "$name is not set and there is no terminal to ask on. Re-run with sudo $name=… (use the value your current deployment already uses)."
  read -rs -p "$name (input hidden): " value
  echo >&2
  [ -n "$value" ] || die "$name must not be empty."
  printf '%s' "$value"
}

random_hex() {
  od -An -tx1 -N32 /dev/urandom | tr -d ' \n'
}

legacy_data_dir() {
  local dir="$MIGRATE_FROM/server/.data"
  if [ -d "$dir" ] && [ -n "$(ls -A "$dir" 2>/dev/null)" ]; then echo "$dir"; fi
}

derive_origin() {
  if [ -n "${SERVER_URL:-}" ]; then
    printf '%s' "${SERVER_URL%/}"
    return
  fi
  local dns_name
  dns_name="$("$TAILSCALE" status --json | jq -r '.Self.DNSName // empty')"
  dns_name="${dns_name%.}"
  [ -n "$dns_name" ] ||
    die "Could not determine this machine's MagicDNS name. Set SERVER_URL=https://<server-name>.<tailnet-name>.ts.net and re-run."
  printf 'https://%s' "$dns_name"
}

# Quotes a value for systemd's EnvironmentFile (double quotes, \ and " escaped).
env_quote() {
  local value="$1"
  case "$value" in
  *$'\n'*) die "A secret must not contain a newline." ;;
  esac
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

write_env_file() {
  local env_file="$ETC_DIR/expenses-manager.env"
  if [ -f "$env_file" ]; then
    info "Kept the existing $env_file (secrets are never regenerated)."
    return
  fi

  local token_secret="${TOKEN_SECRET:-}" encryption_key="${ENCRYPTION_KEY:-}"
  if [ -z "$token_secret" ] || [ -z "$encryption_key" ]; then
    cat >&2 <<'WARNING'
TOKEN_SECRET / ENCRYPTION_KEY are not both set. Use the values your current
deployment already uses: rotating TOKEN_SECRET invalidates every issued
session token, and rotating ENCRYPTION_KEY makes stored invitation records
undecryptable.
WARNING
    local answer=""
    if [ -t 0 ] && [ -z "$(legacy_data_dir)" ]; then
      read -r -p "Is this a brand-new install with no existing data, so new secrets may be generated? [y/N] " answer || answer=""
    fi
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      [ -n "$token_secret" ] || token_secret="$(random_hex)"
      [ -n "$encryption_key" ] || encryption_key="$(random_hex)"
      info "Generated new secrets for a brand-new install."
    else
      [ -n "$token_secret" ] || token_secret="$(prompt_secret TOKEN_SECRET)"
      [ -n "$encryption_key" ] || encryption_key="$(prompt_secret ENCRYPTION_KEY)"
    fi
  fi

  local origin
  origin="$(derive_origin)"
  [[ "$origin" == https://* ]] ||
    die "SERVER_URL must be an https:// origin (got: $origin)."

  (
    umask 077
    {
      printf 'NODE_ENV=production\n'
      printf 'HOST=127.0.0.1\n'
      printf 'PORT=%s\n' "$PORT_VALUE"
      printf 'DATA_DIR=/var/lib/expenses-manager/data\n'
      printf 'CORS_ORIGIN=%s\n' "$origin"
      printf 'TOKEN_SECRET=%s\n' "$(env_quote "$token_secret")"
      printf 'ENCRYPTION_KEY=%s\n' "$(env_quote "$encryption_key")"
    } >"$env_file"
  )
  secure 0600 root:root "$env_file"
  info "Wrote $env_file (origin $origin)."
}

write_conf_file() {
  local conf_file="$ETC_DIR/deploy.conf"
  if [ -f "$conf_file" ]; then
    info "Kept the existing $conf_file."
  else
    if [ -z "$TOKEN_SOURCE" ] && [ -t 0 ]; then
      local answer=""
      read -r -p "Is the GitHub repository private? [y/N] " answer || answer=""
      if [[ "$answer" =~ ^[Yy]$ ]]; then PRIVATE_REPO=1; fi
    fi
    (
      umask 077
      {
        printf 'GITHUB_REPO=%s\n' "$DEFAULT_REPO"
        printf 'KEEP_RELEASES=5\n'
        printf 'KEEP_BACKUPS=10\n'
        printf 'PORT=%s\n' "$PORT_VALUE"
        if [ -n "$TOKEN_SOURCE" ] || [ -n "$PRIVATE_REPO" ]; then
          printf 'GITHUB_TOKEN_FILE=/etc/expenses-manager/github-token\n'
        fi
      } >"$conf_file"
    )
    secure 0600 root:root "$conf_file"
    info "Wrote $conf_file."
  fi

  if [ -n "$TOKEN_SOURCE" ]; then
    [ -f "$TOKEN_SOURCE" ] || die "--github-token-file: $TOKEN_SOURCE does not exist."
    local token_file="$ETC_DIR/github-token"
    (
      umask 077
      tr -d '[:space:]' <"$TOKEN_SOURCE" >"$token_file"
    )
    secure 0600 root:root "$token_file"
    grep -q '^GITHUB_TOKEN_FILE=' "$conf_file" ||
      printf 'GITHUB_TOKEN_FILE=/etc/expenses-manager/github-token\n' >>"$conf_file"
    info "Stored the GitHub token in $token_file."
  elif [ -n "$PRIVATE_REPO" ]; then
    warn "Create /etc/expenses-manager/github-token (0600) with a read-only token before the first deploy ($DOCS_SETUP, private repo step)."
  fi
}

# Copies (never moves) the legacy deploy.sh data into an empty target, after
# stopping the legacy deployment so nothing writes while it is copied.
migrate_data() {
  local legacy target="$VAR_DIR/data"
  legacy="$(legacy_data_dir)"
  if [ -z "$legacy" ]; then
    info "No legacy data found in $MIGRATE_FROM/server/.data; nothing to migrate."
    return
  fi
  if [ -n "$(ls -A "$target" 2>/dev/null)" ]; then
    warn "$target already has data, so the legacy data in $legacy was NOT copied. Nothing was overwritten."
    return
  fi

  info "Migrating the legacy data from $legacy…"
  if [ -f "$MIGRATE_FROM/stop.sh" ]; then
    (
      # stop.sh is sourced for its stop_running_services; it expects to run
      # as the clone's owner with sudo, so under root the wrappers below make
      # `sudo tailscale …` just run the command.
      # shellcheck disable=SC2034 # read by stop.sh
      REPO_DIR="$(cd "$MIGRATE_FROM" && pwd)"
      # shellcheck disable=SC2034 # read by stop.sh
      SYNC_PORT="$PORT_VALUE"
      # shellcheck disable=SC2317 # called by stop.sh
      sudo() { "$@"; }
      # `command` skips this function, so the default name cannot recurse.
      # shellcheck disable=SC2317 # called by stop.sh
      tailscale() { command "$TAILSCALE" "$@"; }
      # shellcheck disable=SC1091
      . "$MIGRATE_FROM/stop.sh"
      stop_running_services
    ) || warn "Stopping the legacy deployment reported a problem; continuing."
  fi

  cp -a "$legacy/." "$target/"
  if ! skip_system_steps; then chown -R "$SERVICE_USER:$SERVICE_USER" "$target"; fi
  chmod 0700 "$target"
  info "Copied the data to $target. The old copy in $legacy is kept; delete it once the new deployment has proven itself."
}

print_next_steps() {
  cat <<EOF

Installed. Next:

  sudo deploy-expenses-manager latest

Keep this clone (${CLONE_DIR}): Claude Code's deploy-server skill only loads
when it runs inside a clone of the repository. The service is not enabled at
boot: start it with \`sudo deploy-expenses-manager\` and stop it with
\`sudo deploy-expenses-manager stop\`.
EOF
}

main() {
  parse_args "$@"
  check_prerequisites
  create_user
  create_directories
  install_files
  write_env_file
  write_conf_file
  migrate_data
  print_next_steps
}

main "$@"
