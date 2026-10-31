#!/usr/bin/env bash
# Stop: whole-project checks, run once when Claude finishes a turn, and only for
# the areas the working tree actually changed. Exit 2 hands the errors back to
# Claude to fix before it stops.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
. "$CLAUDE_PROJECT_DIR/.claude/hooks/lib.sh"
deps_installed || exit 0

# A previous pass of this hook already asked Claude to continue; do not loop.
[ "$(jq -r '.stop_hook_active // false')" = "true" ] && exit 0

changed="$(git status --porcelain 2>/dev/null | cut -c4-)"
[ -n "$changed" ] || exit 0

problems=""
run() { # run <label> <command...>
  local label="$1"; shift
  local out
  out="$("$@" 2>&1)" || problems+="$label failed:"$'\n'"$(printf '%s\n' "$out" | limit_output 60)"$'\n\n'
}

if grep -qE '^(src/.*\.(ts|tsx|js|jsx|json)|tsconfig.*\.json)$' <<<"$changed"; then
  run "npm run typecheck" npm run --silent typecheck
fi
if grep -q '^design/' <<<"$changed"; then
  run "npm run gallery:build" npm run --silent gallery:build
fi

[ -z "$problems" ] && exit 0
printf '%s' "$problems" >&2
exit 2
