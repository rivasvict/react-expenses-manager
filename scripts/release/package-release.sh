#!/usr/bin/env bash
#
# Assembles the release archive from a checkout where `npm run build` and
# `npm run build:server` have already run, then writes SHA256SUMS next to it.
# Signing happens afterwards, in the publish job (docs/deployment/releases.md):
# this script never sees the signing key.
#
# Usage:  scripts/release/package-release.sh <version> <commit-sha> <out-dir>
#
# Output (in <out-dir>):
#   expenses-manager-<version>.tar.gz   build/, server/dist/, deploy/, release.json
#   SHA256SUMS                          checksum of the tarball
#
# Environment (all optional):
#   REPO_ROOT              checkout to package (default: two levels above this file)
#   SOURCE_DATE_EPOCH      timestamp stamped on every archive entry (default:
#                          the commit's timestamp), so the same commit always
#                          packages to the same bytes
#   EM_NODE_DIST           Node download base URL (default https://nodejs.org/dist)
#   EM_NODE_INDEX_FILE     read the Node release index from this file instead of
#   EM_NODE_SHASUMS_FILE   the network (SHASUMS256.txt likewise); used by tests

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${REPO_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
readonly SCRIPT_DIR REPO_ROOT
readonly NODE_DIST="${EM_NODE_DIST:-https://nodejs.org/dist}"
readonly NODE_PLATFORMS=(linux-x64 linux-arm64)

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() {
  printf '\033[1;31merror:\033[0m %s\n' "$*" >&2
  exit 1
}

usage() {
  die "Usage: $0 <version> <commit-sha> <out-dir>"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "\`$1\` is required but was not found in PATH."
}

# Prints the file named by $1 (an env override used by tests) or downloads $2.
fetch() {
  local override="$1" url="$2"
  if [ -n "$override" ]; then
    cat "$override"
  else
    curl -fsSL --retry 3 "$url"
  fi
}

# server/.nvmrc may pin a whole version ("18.20.8") or only a major ("18").
# Resolve it to the newest published release matching that prefix.
resolve_node_version() {
  local pin
  pin="$(tr -d '[:space:]' <"$REPO_ROOT/server/.nvmrc")"
  pin="${pin#v}"
  [ -n "$pin" ] || die "server/.nvmrc is empty."

  if [[ "$pin" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "$pin"
    return
  fi

  local resolved
  resolved="$(fetch "${EM_NODE_INDEX_FILE:-}" "$NODE_DIST/index.json" |
    jq -r --arg prefix "v${pin}." \
      '[.[] | select(.version | startswith($prefix))][0].version // empty')"
  [ -n "$resolved" ] || die "No Node release matches server/.nvmrc ($pin)."
  echo "${resolved#v}"
}

# Writes release.json: the version, commit and the Node runtime the box has to
# download, with the sha256 of each platform's tarball taken from nodejs.org's
# own SHASUMS256.txt. The file is inside the signed archive, so the box trusts
# those hashes exactly as much as it trusts the release.
write_manifest() {
  local manifest="$1" version="$2" commit="$3" node_version="$4" built_at="$5"
  local shasums platform file sha
  shasums="$(fetch "${EM_NODE_SHASUMS_FILE:-}" "$NODE_DIST/v${node_version}/SHASUMS256.txt")"

  local node_json
  node_json="$(jq -n --arg version "$node_version" '{version: $version}')"
  for platform in "${NODE_PLATFORMS[@]}"; do
    file="node-v${node_version}-${platform}.tar.gz"
    sha="$(awk -v f="$file" '$2 == f { print $1 }' <<<"$shasums")"
    [[ "$sha" =~ ^[0-9a-f]{64}$ ]] ||
      die "SHASUMS256.txt has no valid checksum for $file."
    node_json="$(jq --arg platform "$platform" --arg file "$file" --arg sha "$sha" \
      '.[$platform] = {file: $file, sha256: $sha}' <<<"$node_json")"
  done

  jq -n --arg version "$version" --arg commit "$commit" --arg builtAt "$built_at" \
    --argjson node "$node_json" \
    '{name: "expenses-manager", version: $version, commit: $commit, builtAt: $builtAt, node: $node}' \
    >"$manifest"
}

main() {
  [ $# -eq 3 ] || usage
  local version="$1" commit="$2" out_dir="$3"

  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] ||
    die "Version \"$version\" is not MAJOR.MINOR.PATCH."
  [[ "$commit" =~ ^[0-9a-f]{40}$ ]] ||
    die "Commit \"$commit\" is not a full 40-character SHA."

  local tool
  for tool in tar gzip sha256sum jq find; do require_command "$tool"; done
  [ -f "$REPO_ROOT/build/index.html" ] ||
    die "$REPO_ROOT/build/index.html is missing — run \`npm run build\` first."
  [ -f "$REPO_ROOT/server/dist/index.js" ] ||
    die "$REPO_ROOT/server/dist/index.js is missing — run \`npm run build:server\` first."
  [ -d "$REPO_ROOT/deploy" ] || die "$REPO_ROOT/deploy is missing."

  local epoch="${SOURCE_DATE_EPOCH:-}"
  if [ -z "$epoch" ]; then
    epoch="$(git -C "$REPO_ROOT" show -s --format=%ct "$commit")" ||
      die "Cannot read the timestamp of $commit; set SOURCE_DATE_EPOCH."
  fi
  local built_at
  built_at="$(date -u -d "@$epoch" +%Y-%m-%dT%H:%M:%SZ)"

  mkdir -p "$out_dir"
  out_dir="$(cd "$out_dir" && pwd)"
  local name="expenses-manager-$version"
  local work stage
  work="$(mktemp -d)"
  # Expanded now: `work` is local, and gone by the time the trap runs.
  # shellcheck disable=SC2064
  trap "rm -rf '$work'" EXIT
  stage="$work/$name"

  info "Staging $name…"
  mkdir -p "$stage/server"
  cp -R "$REPO_ROOT/build" "$stage/build"
  cp -R "$REPO_ROOT/server/dist" "$stage/server/dist"
  cp "$REPO_ROOT/server/.nvmrc" "$stage/server/.nvmrc"
  cp -R "$REPO_ROOT/deploy" "$stage/deploy"
  # The compiled tests are not needed to run the server.
  find "$stage/server/dist" -name '*.test.js' -delete
  # Pins the module system: with no package.json above it Node would use the
  # nearest one it finds on the box, which is not ours to depend on.
  printf '{ "type": "commonjs" }\n' >"$stage/server/package.json"
  printf '{ "version": "%s", "commit": "%s" }\n' "$version" "$commit" \
    >"$stage/build/version.json"

  local node_version
  node_version="$(resolve_node_version)"
  info "Pinning Node $node_version…"
  write_manifest "$stage/release.json" "$version" "$commit" "$node_version" "$built_at"

  # Modes depend on the builder's umask; fix them so the bytes do not.
  find "$stage" -type d -exec chmod 755 {} +
  find "$stage" -type f -exec chmod 644 {} +
  find "$stage" -type f -name '*.sh' -exec chmod 755 {} +

  info "Creating $name.tar.gz…"
  (
    cd "$work"
    tar --sort=name --format=gnu --mtime="@$epoch" \
      --owner=0 --group=0 --numeric-owner -cf - "$name" |
      gzip -n -9 >"$out_dir/$name.tar.gz"
  )
  (cd "$out_dir" && sha256sum "$name.tar.gz" >SHA256SUMS)

  info "Done: $out_dir/$name.tar.gz"
}

main "$@"
