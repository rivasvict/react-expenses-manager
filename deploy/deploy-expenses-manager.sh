#!/usr/bin/env bash
#
# deploy-expenses-manager: pulls a signed release from GitHub, verifies it,
# switches the box to it and publishes it through Tailscale. Installed by
# deploy/install-expenses-manager.sh at
# /usr/local/bin/deploy-expenses-manager and updated by every successful deploy.
#
#   deploy-expenses-manager [latest|vX.Y.Z] [--force]  deploy (default: latest)
#   deploy-expenses-manager start       start the service and publish it
#   deploy-expenses-manager stop        stop the service and unpublish it
#   deploy-expenses-manager status      versions, service state, health, URL
#   deploy-expenses-manager rollback    switch back to the previous release
#   deploy-expenses-manager list        releases on disk
#   deploy-expenses-manager logs [-f]   journalctl for the service
#   deploy-expenses-manager help
#
# Why it is built this way, and every command's output, is documented in
# docs/deployment/operating.md. The trust model (an SSH signature checked
# against a key installed on this box) is in docs/deployment/README.md.
#
# Test seams, used by deploy/deploy-expenses-manager.test.mjs and left out of
# the user docs on purpose:
#   EM_PREFIX, EM_GITHUB_API, EM_NODE_DIST, EM_SYSTEMCTL, EM_TAILSCALE,
#   EM_JOURNALCTL, EM_CURL_BASE, EM_UNAME_M, EM_HEALTH_TIMEOUT,
#   EM_SKIP_ROOT_CHECK.

set -euo pipefail

# --- locations --------------------------------------------------------------

EM_PREFIX="${EM_PREFIX:-}"
readonly OPT_DIR="$EM_PREFIX/opt/expenses-manager"
readonly ETC_DIR="$EM_PREFIX/etc/expenses-manager"
readonly VAR_DIR="$EM_PREFIX/var/lib/expenses-manager"
readonly RELEASES_DIR="$OPT_DIR/releases"
readonly NODE_DIR="$OPT_DIR/node"
readonly DOWNLOADS_DIR="$OPT_DIR/downloads"
readonly DATA_DIR="$VAR_DIR/data"
readonly BACKUPS_DIR="$VAR_DIR/backups"
readonly CONF_FILE="$ETC_DIR/deploy.conf"
readonly ENV_FILE="$ETC_DIR/expenses-manager.env"
readonly SIGNERS_FILE="$ETC_DIR/allowed_signers"
readonly SERVICE="expenses-manager"
readonly SIGNING_IDENTITY="expenses-manager-release"
readonly SIGNING_NAMESPACE="expenses-manager-release"
readonly GITHUB_API="${EM_GITHUB_API:-https://api.github.com}"
readonly NODE_DIST="${EM_NODE_DIST:-https://nodejs.org/dist}"
readonly SYSTEMCTL="${EM_SYSTEMCTL:-systemctl}"
readonly TAILSCALE="${EM_TAILSCALE:-tailscale}"
readonly JOURNALCTL="${EM_JOURNALCTL:-journalctl}"
readonly HEALTH_TIMEOUT="${EM_HEALTH_TIMEOUT:-60}"
readonly DOCS_SETUP="docs/deployment/server-setup.md"

# Filled in by load_config / the deploy flow.
GITHUB_REPO="" GITHUB_TOKEN_FILE="" KEEP_RELEASES=5 KEEP_BACKUPS=10 PORT=4000
WORK_DIR=""
TAG="" VERSION=""
AUTH_ARGS=()

# --- output helpers ---------------------------------------------------------

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
# err reports without exiting, for the paths that must clean up or roll back.
err() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; }
die() {
  err "$@"
  exit 1
}

# --- validation -------------------------------------------------------------

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "\`$1\` is required but was not found in PATH. $2"
}

check_prerequisites() {
  require_command curl "Install it with your package manager (apt/dnf/pacman install curl)."
  require_command jq "Install it with your package manager (apt/dnf/pacman install jq)."
  require_command tar "Install it with your package manager (apt/dnf/pacman install tar)."
  require_command gzip "Install it with your package manager (apt/dnf/pacman install gzip)."
  require_command sha256sum "It ships with coreutils."
  require_command ssh-keygen "Install OpenSSH 8.1 or newer (apt install openssh-client; dnf install openssh-clients)."
  require_command flock "It ships with util-linux (apt/dnf/pacman install util-linux)."
  require_command "$SYSTEMCTL" "systemd is required ($DOCS_SETUP)."
  require_command "$TAILSCALE" "Install it with: curl -fsSL https://tailscale.com/install.sh | sh"
}

ensure_root() {
  [ -n "${EM_SKIP_ROOT_CHECK:-}" ] && return 0
  [ "$(id -u)" -eq 0 ] && return 0
  command -v sudo >/dev/null 2>&1 ||
    die "This command must run as root and \`sudo\` was not found."
  exec sudo -- "$0" "$@"
}

# --- configuration ----------------------------------------------------------

# Reads KEY=value from a root-owned file without executing it. Surrounding
# double quotes are stripped.
read_setting() {
  local file="$1" key="$2" line value
  [ -f "$file" ] || return 0
  line="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  value="${line#"${key}"=}"
  value="${value%\"}"
  value="${value#\"}"
  printf '%s' "$value"
}

load_config() {
  [ -f "$CONF_FILE" ] ||
    die "$CONF_FILE not found. Run deploy/install-expenses-manager.sh once first ($DOCS_SETUP)."

  local value
  GITHUB_REPO="$(read_setting "$CONF_FILE" GITHUB_REPO)"
  GITHUB_TOKEN_FILE="$(read_setting "$CONF_FILE" GITHUB_TOKEN_FILE)"
  value="$(read_setting "$CONF_FILE" KEEP_RELEASES)"
  KEEP_RELEASES="${value:-5}"
  value="$(read_setting "$CONF_FILE" KEEP_BACKUPS)"
  KEEP_BACKUPS="${value:-10}"
  value="$(read_setting "$CONF_FILE" PORT)"
  PORT="${value:-4000}"

  [[ "$GITHUB_REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] ||
    die "GITHUB_REPO in $CONF_FILE must look like owner/repo."
  { [[ "$KEEP_RELEASES" =~ ^[0-9]+$ ]] && [ "$KEEP_RELEASES" -ge 2 ]; } ||
    die "KEEP_RELEASES in $CONF_FILE must be a number of at least 2."
  [[ "$KEEP_BACKUPS" =~ ^[0-9]+$ ]] ||
    die "KEEP_BACKUPS in $CONF_FILE must be a number."
  [[ "$PORT" =~ ^[0-9]+$ ]] || die "PORT in $CONF_FILE must be a number."
}

# Prepares curl's auth header. A token is used only when one is configured
# (a public repo needs none) and goes in through a 0600 header file so it never
# shows up in the process list.
prepare_auth() {
  AUTH_ARGS=()
  [ -n "$GITHUB_TOKEN_FILE" ] || return 0
  local token_file="$EM_PREFIX$GITHUB_TOKEN_FILE"
  [ -r "$token_file" ] ||
    die "GITHUB_TOKEN_FILE is set to $GITHUB_TOKEN_FILE but that file is missing. Create it as described in $DOCS_SETUP (private repo step)."
  local header_file="$WORK_DIR/auth-header"
  (
    umask 077
    printf 'Authorization: Bearer %s\n' "$(tr -d '[:space:]' <"$token_file")" >"$header_file"
  )
  AUTH_ARGS=(-H "@$header_file")
}

setup_work_dir() {
  mkdir -p "$DOWNLOADS_DIR"
  WORK_DIR="$(mktemp -d "$DOWNLOADS_DIR/run.XXXXXX")"
  # Expanded now, so the trap does not depend on the variable later.
  # shellcheck disable=SC2064
  trap "rm -rf '${WORK_DIR:?}'" EXIT
}

# Version directories under releases/ (a half-extracted .tmp is not one),
# newest first. Backups likewise, newest first: their names start with a UTC
# timestamp.
list_release_versions() {
  local path
  for path in "$RELEASES_DIR"/[0-9]*; do
    if [ -d "$path" ] && [[ "$path" != *.tmp ]]; then basename "$path"; fi
  done | sort -rV
}

list_backups() {
  local path
  for path in "$BACKUPS_DIR"/*.tar.gz; do
    if [ -f "$path" ]; then basename "$path"; fi
  done | sort -r
}

# --- release symlinks -------------------------------------------------------

link_version() {
  local target
  target="$(readlink "$OPT_DIR/$1" 2>/dev/null || true)"
  if [ -n "$target" ]; then basename "$target"; fi
  return 0
}

# ln then rename: rename(2) over a symlink is atomic, so there is never a
# moment with no `current`.
point_link() {
  local name="$1" version="$2"
  ln -sfn "releases/$version" "$OPT_DIR/.$name.new"
  mv -T "$OPT_DIR/.$name.new" "$OPT_DIR/$name"
}

# --- GitHub -----------------------------------------------------------------

# Resolves "latest" or a vX.Y.Z tag into $WORK_DIR/release.json and sets
# TAG and VERSION.
resolve_release() {
  local target="$1" url code
  if [ "$target" = "latest" ]; then
    url="$GITHUB_API/repos/$GITHUB_REPO/releases/latest"
  else
    url="$GITHUB_API/repos/$GITHUB_REPO/releases/tags/$target"
  fi

  info "Looking up $target in $GITHUB_REPO…"
  code="$(curl -sS -o "$WORK_DIR/release.json" -w '%{http_code}' \
    -H 'Accept: application/vnd.github+json' "${AUTH_ARGS[@]}" "$url" || true)"

  case "$code" in
  200) ;;
  401 | 403)
    die "GitHub answered $code. The token in ${GITHUB_TOKEN_FILE:-(none configured)} is missing, expired or lacks access (or the API rate limit was hit). Create or renew a fine-grained token with read-only Contents access to $GITHUB_REPO — see the private repo step in $DOCS_SETUP."
    ;;
  404)
    if [ -z "$GITHUB_TOKEN_FILE" ]; then
      die "GitHub answered 404 for $target. Either that release does not exist, or $GITHUB_REPO is private and no token is configured — a private repo needs one ($DOCS_SETUP, private repo step)."
    fi
    die "GitHub answered 404 for $target. That release does not exist, or the configured token cannot see $GITHUB_REPO."
    ;;
  000) die "Could not reach $GITHUB_API. Check the box's internet connection." ;;
  *) die "Unexpected HTTP $code from $url." ;;
  esac

  TAG="$(jq -r '.tag_name // empty' "$WORK_DIR/release.json")"
  # The tag becomes a directory name, so only a plain version is accepted.
  [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] ||
    die "The release has an unusable tag name \"$TAG\"."
  VERSION="${TAG#v}"
}

# Downloads release asset $1 into $2. Going through the API (not
# browser_download_url) works the same for public and private repos.
download_asset() {
  local name="$1" dest="$2" id code
  id="$(jq -r --arg name "$name" '[.assets[] | select(.name == $name)][0].id // empty' \
    "$WORK_DIR/release.json")"
  [ -n "$id" ] ||
    die "Release $TAG has no asset named $name. The release workflow may have failed half way; deploy another version."
  code="$(curl -sS -L -o "$dest" -w '%{http_code}' \
    -H 'Accept: application/octet-stream' "${AUTH_ARGS[@]}" \
    "$GITHUB_API/repos/$GITHUB_REPO/releases/assets/$id" || true)"
  [ "$code" = "200" ] || die "Downloading $name failed (HTTP $code)."
}

# --- verification -----------------------------------------------------------

# The signature is checked against the key installed on this box at bootstrap,
# never against anything downloaded, and before the tarball is read at all.
verify_download() {
  local dir="$1" tarball="$2"
  info "Verifying the signature and checksum…"

  [ -s "$SIGNERS_FILE" ] || die "$SIGNERS_FILE is missing. Re-run the installer ($DOCS_SETUP)."
  if grep -v '^[[:space:]]*#' "$SIGNERS_FILE" | grep -q PLACEHOLDER; then
    die "$SIGNERS_FILE still holds the placeholder key. Replace it as described in $DOCS_SETUP."
  fi

  ssh-keygen -Y verify -f "$SIGNERS_FILE" -I "$SIGNING_IDENTITY" \
    -n "$SIGNING_NAMESPACE" -s "$dir/SHA256SUMS.sig" <"$dir/SHA256SUMS" >/dev/null 2>&1 ||
    die "The signature on SHA256SUMS does not verify against $SIGNERS_FILE. Nothing was changed. Do NOT bypass this: either the release is not from the owner, the signing key was rotated (see the rotation step in $DOCS_SETUP), or ssh-keygen is older than OpenSSH 8.1."

  # sha256sum -c would happily check some other file named in the list, so
  # insist the signed list covers exactly the tarball we are about to open.
  { [ "$(wc -l <"$dir/SHA256SUMS")" -eq 1 ] && grep -qE "^[0-9a-f]{64}  $tarball\$" "$dir/SHA256SUMS"; } ||
    die "SHA256SUMS does not list exactly $tarball. Nothing was changed."
  (cd "$dir" && sha256sum -c --quiet SHA256SUMS >/dev/null 2>&1) ||
    die "The checksum of $tarball does not match SHA256SUMS. Nothing was changed."
}

# Refuses anything but plain files and directories under the expected top
# directory. Links are rejected outright: the release has none, and a link is
# the usual way an archive writes outside where it was extracted.
inspect_tarball() {
  local tarball="$1" top="$2" name
  while IFS= read -r name; do
    case "$name" in
    "$top" | "$top"/*) ;;
    *) die "The archive contains \"$name\", outside $top/. Rejected; nothing was changed." ;;
    esac
    case "/$name/" in
    */../*) die "The archive contains a path with \"..\" (\"$name\"). Rejected; nothing was changed." ;;
    esac
  done < <(tar -tzf "$tarball")

  if tar -tvzf "$tarball" | grep -qvE '^[-d]'; then
    die "The archive contains links or special files. Rejected; nothing was changed."
  fi
}

# Extracts into releases/<version>.tmp (printed on stdout) and checks the
# files the deployer relies on.
extract_release() {
  local tarball="$1" version="$2" needed
  local tmp="$RELEASES_DIR/$version.tmp"
  rm -rf "${tmp:?}"
  mkdir -p "$tmp"
  tar -xzf "$tarball" -C "$tmp" --strip-components=1 --no-same-owner --no-same-permissions
  for needed in build/index.html build/version.json server/dist/index.js release.json deploy/deploy-expenses-manager.sh; do
    if [ ! -f "$tmp/$needed" ]; then
      rm -rf "${tmp:?}"
      die "The archive is missing $needed. Nothing was changed."
    fi
  done
  if [ "$(jq -r .version "$tmp/release.json")" != "$version" ]; then
    rm -rf "${tmp:?}"
    die "release.json inside the archive does not say version $version. Nothing was changed."
  fi
  echo "$tmp"
}

# --- Node runtime -----------------------------------------------------------

node_platform() {
  local machine="${EM_UNAME_M:-$(uname -m)}"
  case "$machine" in
  x86_64 | amd64) echo linux-x64 ;;
  aarch64 | arm64) echo linux-arm64 ;;
  *) die "Unsupported CPU architecture \"$machine\": releases ship Node for linux-x64 and linux-arm64 only." ;;
  esac
}

# Installs the Node version pinned in the signed manifest, if it is not
# already there, and links it into the release directory.
ensure_node() {
  local release_dir="$1" manifest="$1/release.json"
  local platform version file sha
  platform="$(node_platform)"
  version="$(jq -r '.node.version' "$manifest")"
  file="$(jq -r --arg p "$platform" '.node[$p].file // empty' "$manifest")"
  sha="$(jq -r --arg p "$platform" '.node[$p].sha256 // empty' "$manifest")"
  { [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && [ -n "$file" ] && [[ "$sha" =~ ^[0-9a-f]{64}$ ]]; } ||
    die "release.json has no usable Node entry for $platform."

  if [ ! -x "$NODE_DIR/$version/bin/node" ]; then
    info "Installing Node $version ($platform)…"
    local archive="$WORK_DIR/$file" code staging="$NODE_DIR/${version:?}.tmp"
    code="$(curl -sS -L -o "$archive" -w '%{http_code}' "$NODE_DIST/v$version/$file" || true)"
    [ "$code" = "200" ] || die "Downloading Node $version failed (HTTP $code)."
    [ "$(sha256sum "$archive" | cut -d' ' -f1)" = "$sha" ] ||
      die "The Node download does not match the checksum in the signed manifest. Nothing was changed."
    mkdir -p "$NODE_DIR"
    rm -rf "${staging:?}"
    mkdir "$staging"
    tar -xzf "$archive" -C "$staging" --strip-components=1 --no-same-owner
    rm -rf "${NODE_DIR:?}/${version:?}"
    mv "$staging" "$NODE_DIR/$version"
    chmod -R go-w "$NODE_DIR/$version"
  fi

  [ "$("$NODE_DIR/$version/bin/node" --version)" = "v$version" ] ||
    die "The installed Node does not report v$version."
  ln -sfn "$NODE_DIR/$version" "$release_dir/node"
}

# --- data backup ------------------------------------------------------------

backup_data() {
  local version="$1" file backup count=0
  mkdir -p "$BACKUPS_DIR"
  if [ -d "$DATA_DIR" ] && [ -n "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
    file="$BACKUPS_DIR/$(date -u +%Y%m%dT%H%M%SZ)-before-$version.tar.gz"
    info "Backing up the data to $file…"
    tar -czf "$file" -C "$DATA_DIR" .
    chmod 600 "$file"
  else
    info "No data yet, so no backup."
  fi

  while IFS= read -r backup; do
    count=$((count + 1))
    if [ "$count" -gt "$KEEP_BACKUPS" ]; then rm -f "${BACKUPS_DIR:?}/$backup"; fi
  done < <(list_backups)
}

# --- tailscale and health ---------------------------------------------------

health_ok() {
  [ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" || true)" = "200" ]
}

wait_healthy() {
  local waited=0
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    if health_ok; then return 0; fi
    sleep 1
    waited=$((waited + 1))
  done
  health_ok
}

# The static root is the resolved real path rather than the `current` symlink,
# so tailscaled is never trusted to follow it later. It is re-published on
# every deploy, start and rollback, so it never goes stale.
publish() {
  local build_dir
  build_dir="$(readlink -f "$OPT_DIR/current/build")"
  info "Publishing through tailscale serve…"
  "$TAILSCALE" serve --bg --set-path=/ "$build_dir" >/dev/null || {
    err "tailscale serve could not publish $build_dir. Are HTTPS certificates enabled for the tailnet ($DOCS_SETUP)?"
    return 1
  }
  "$TAILSCALE" serve --bg --set-path=/api "http://127.0.0.1:$PORT/api" >/dev/null || {
    err "tailscale serve could not publish the /api proxy."
    return 1
  }
}

# Only this app's two paths are removed, so anything else the box serves keeps
# working. `reset` is the fallback for a tailscale without per-path removal.
unpublish() {
  if "$TAILSCALE" serve --set-path=/ off >/dev/null 2>&1 &&
    "$TAILSCALE" serve --set-path=/api off >/dev/null 2>&1; then
    return 0
  fi
  warn "This tailscale cannot remove a single serve path; resetting its whole serve config instead."
  "$TAILSCALE" serve reset >/dev/null 2>&1 || warn "tailscale serve reset failed; check \`tailscale serve status\`."
}

# What a phone would see: the health endpoint and the bundle's version.json,
# fetched through the published origin.
verify_public() {
  local version="$1" commit="$2" origin waited=0 served=""
  origin="${EM_CURL_BASE:-$(read_setting "$ENV_FILE" CORS_ORIGIN)}"
  if [ -z "$origin" ]; then
    err "CORS_ORIGIN is missing from $ENV_FILE, so the public address is unknown."
    return 1
  fi
  origin="${origin%/}"

  while [ "$waited" -lt 15 ]; do
    if [ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$origin/api/health" || true)" = "200" ]; then
      served="$(curl -fsS -m 5 "$origin/version.json" 2>/dev/null || true)"
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
  if [ -z "$served" ]; then
    err "$origin did not answer /api/health and /version.json. Check \`tailscale serve status\` and that HTTPS certificates are enabled."
    return 1
  fi
  if [ "$(jq -r '.version // empty' <<<"$served" 2>/dev/null)" != "$version" ] ||
    [ "$(jq -r '.commit // empty' <<<"$served" 2>/dev/null)" != "$commit" ]; then
    err "$origin serves a different build than $version ($commit): $served"
    return 1
  fi
}

# Restart, wait for health, publish, verify. Returns non-zero (never exits) so
# the caller can roll back.
start_and_publish() {
  local version commit
  version="$(link_version current)"
  commit="$(jq -r .commit "$OPT_DIR/current/release.json")"
  "$SYSTEMCTL" restart "$SERVICE" || {
    err "systemctl could not restart $SERVICE."
    return 1
  }
  wait_healthy || {
    err "The service did not answer /api/health within ${HEALTH_TIMEOUT}s (port $PORT busy, or it crashed on start)."
    return 1
  }
  publish || return 1
  verify_public "$version" "$commit" || return 1
}

recent_logs() {
  "$JOURNALCTL" -u "$SERVICE" -n 30 --no-pager 2>&1 || true
}

# --- housekeeping -----------------------------------------------------------

prune_releases() {
  local current previous version count=0 node_version release in_use
  current="$(link_version current)"
  previous="$(link_version previous)"
  rm -rf "${RELEASES_DIR:?}"/*.tmp
  while IFS= read -r version; do
    count=$((count + 1))
    if [ "$count" -le "$KEEP_RELEASES" ]; then continue; fi
    if [ "$version" = "$current" ] || [ "$version" = "$previous" ]; then continue; fi
    info "Removing old release $version…"
    rm -rf "${RELEASES_DIR:?}/${version:?}"
  done < <(list_release_versions)

  # A Node runtime no remaining release links to is dead weight.
  for node_version in "$NODE_DIR"/*/; do
    [ -d "$node_version" ] || continue
    node_version="$(basename "$node_version")"
    in_use=""
    for release in "$RELEASES_DIR"/*/; do
      if [ "$(readlink "$release/node" 2>/dev/null || true)" = "$NODE_DIR/$node_version" ]; then in_use=1; fi
    done
    if [ -z "$in_use" ]; then rm -rf "${NODE_DIR:?}/${node_version:?}"; fi
  done
}

# The deployer updates itself from the release it just verified. Written to a
# temp file and renamed so the running copy is never modified in place.
self_update() {
  local new="$OPT_DIR/current/deploy/deploy-expenses-manager.sh"
  local installed="$OPT_DIR/bin/deploy-expenses-manager.sh"
  [ -f "$new" ] || return 0
  if cmp -s "$new" "$installed"; then return 0; fi
  info "Updating the deploy command itself…"
  install -m 0755 "$new" "$installed.new"
  mv -f "$installed.new" "$installed"
}

# --- commands ---------------------------------------------------------------

print_summary() {
  local version="$1" origin
  origin="${EM_CURL_BASE:-$(read_setting "$ENV_FILE" CORS_ORIGIN)}"
  printf '\n\033[1;32mDone.\033[0m\n\n'
  printf '  App URL    %s\n' "$origin"
  printf '  Version    v%s (%s)\n' "$version" "$(jq -r '.commit[0:7]' "$OPT_DIR/current/release.json")"
  printf '  Logs       deploy-expenses-manager logs -f\n'
  printf '  Stop       deploy-expenses-manager stop\n'
  printf '  Roll back  deploy-expenses-manager rollback\n\n'
}

# Downloads, verifies and unpacks $VERSION into releases/. Everything before
# the final rename can fail without changing anything on the box.
fetch_release() {
  local dir="$WORK_DIR/$VERSION" tarball="expenses-manager-$VERSION.tar.gz" staged
  mkdir -p "$dir"
  info "Downloading $TAG…"
  download_asset "$tarball" "$dir/$tarball"
  download_asset SHA256SUMS "$dir/SHA256SUMS"
  download_asset SHA256SUMS.sig "$dir/SHA256SUMS.sig"
  verify_download "$dir" "$tarball"
  inspect_tarball "$dir/$tarball" "expenses-manager-$VERSION"

  mkdir -p "$RELEASES_DIR"
  staged="$(extract_release "$dir/$tarball" "$VERSION")"
  ensure_node "$staged"
  chown -R root:root "$staged" 2>/dev/null || true
  chmod -R go-w "$staged"
  rm -rf "${RELEASES_DIR:?}/${VERSION:?}"
  mv "$staged" "$RELEASES_DIR/$VERSION"
}

cmd_deploy() {
  local target="latest" force="" old
  while [ $# -gt 0 ]; do
    case "$1" in
    --force) force=1 ;;
    latest | v[0-9]*) target="$1" ;;
    *) die "Unknown argument \"$1\". See: deploy-expenses-manager help" ;;
    esac
    shift
  done

  resolve_release "$target"
  old="$(link_version current)"

  if [ "$old" = "$VERSION" ] && [ -z "$force" ]; then
    if health_ok; then
      info "$TAG is already deployed and healthy. Nothing to do (use --force to redeploy)."
      return 0
    fi
    info "$TAG is already deployed but not running — starting it."
    cmd_start
    return 0
  fi

  if [ -f "$RELEASES_DIR/$VERSION/release.json" ]; then
    info "$TAG is already on disk — reusing it."
  else
    fetch_release
  fi

  backup_data "$VERSION"

  info "Switching to $TAG…"
  if [ -n "$old" ] && [ "$old" != "$VERSION" ]; then point_link previous "$old"; fi
  point_link current "$VERSION"

  if ! start_and_publish; then
    err "Deploying $TAG failed; rolling back."
    if [ -n "$old" ]; then
      point_link current "$old"
      if start_and_publish; then
        info "Rolled back to v$old."
      else
        err "The rollback to v$old did not come up cleanly either."
      fi
    else
      rm -f "${OPT_DIR:?}/current"
      "$SYSTEMCTL" stop "$SERVICE" || true
      err "There was no earlier release to go back to; the service is stopped."
    fi
    printf '%s\n' "--- last 30 log lines ---" "$(recent_logs)" >&2
    exit 1
  fi

  self_update
  prune_releases
  print_summary "$VERSION"
}

cmd_start() {
  [ -L "$OPT_DIR/current" ] || die "Nothing is deployed yet. Run: deploy-expenses-manager latest"
  info "Starting v$(link_version current)…"
  if ! start_and_publish; then
    err "Starting failed. Last log lines:"
    recent_logs >&2
    exit 1
  fi
  print_summary "$(link_version current)"
}

cmd_stop() {
  info "Stopping the service and unpublishing…"
  "$SYSTEMCTL" stop "$SERVICE" || warn "systemctl stop reported a problem."
  unpublish
  info "Stopped. Nothing is served from this box."
}

cmd_rollback() {
  local current previous
  current="$(link_version current)"
  previous="$(link_version previous)"
  { [ -n "$previous" ] && [ -d "$RELEASES_DIR/$previous" ]; } ||
    die "There is no previous release to roll back to."
  info "Rolling back from v$current to v$previous…"
  point_link current "$previous"
  point_link previous "$current"
  if ! start_and_publish; then
    err "The rolled-back release did not come up cleanly. Last log lines:"
    recent_logs >&2
    exit 1
  fi
  print_summary "$previous"
}

cmd_status() {
  local current previous state health="down"
  current="$(link_version current)"
  previous="$(link_version previous)"
  state="$("$SYSTEMCTL" is-active "$SERVICE" 2>/dev/null || true)"
  if health_ok; then health="ok"; fi
  printf 'current   %s\n' "${current:-none}"
  printf 'previous  %s\n' "${previous:-none}"
  printf 'service   %s\n' "${state:-unknown}"
  printf 'health    %s\n' "$health"
  printf 'url       %s\n' "$(read_setting "$ENV_FILE" CORS_ORIGIN)"
}

cmd_list() {
  local current previous version marks
  current="$(link_version current)"
  previous="$(link_version previous)"
  while IFS= read -r version; do
    marks=""
    if [ "$version" = "$current" ]; then marks=" (current)"; fi
    if [ "$version" = "$previous" ]; then marks=" (previous)"; fi
    printf '%s%s\n' "$version" "$marks"
  done < <(list_release_versions)
}

usage() {
  cat <<'USAGE'
Usage: deploy-expenses-manager [command]

  [latest|vX.Y.Z] [--force]  deploy a release (default: latest)
  start                      start the service and publish it
  stop                       stop the service and unpublish it
  status                     versions, service state, health, URL
  rollback                   switch back to the previous release
  list                       releases on disk
  logs [-f]                  service logs (journalctl)
  help                       this text

Docs: docs/deployment/operating.md in the repository.
USAGE
}

main() {
  local command="${1:-latest}"
  case "$command" in
  help | -h | --help)
    usage
    return 0
    ;;
  latest | v[0-9]* | --force | start | stop | status | rollback | list | logs) ;;
  *)
    usage >&2
    die "Unknown command \"$command\"."
    ;;
  esac

  ensure_root "$@"
  check_prerequisites
  load_config

  case "$command" in
  logs)
    shift
    exec "$JOURNALCTL" -u "$SERVICE" "$@"
    ;;
  list) cmd_list ;;
  status) cmd_status ;;
  *)
    # One mutating command at a time; the lock is held for the whole run.
    mkdir -p "$OPT_DIR"
    exec 9>"$OPT_DIR/.lock"
    flock -n 9 || die "Another deploy-expenses-manager is already running."
    setup_work_dir
    prepare_auth
    case "$command" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    rollback) cmd_rollback ;;
    *) cmd_deploy "$@" ;;
    esac
    ;;
  esac
}

main "$@"
