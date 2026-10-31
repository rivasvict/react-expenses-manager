#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): fast, per-file checks right after an edit.
# Slow whole-project checks (typecheck, gallery) run once in stop-checks.sh.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
. "$CLAUDE_PROJECT_DIR/.claude/hooks/lib.sh"
deps_installed || exit 0

file="$(jq -r '.tool_input.file_path // empty')"
[ -n "$file" ] || exit 0
rel="${file#"$PWD"/}"

fail() { echo "$1" >&2; printf '%s\n' "$2" | limit_output >&2; exit 2; }

case "$rel" in
  src/styles/tokens.json)
    out="$(npm run --silent tokens:build 2>&1)" || fail "tokens:build failed after editing $rel:" "$out"
    ;;
  src/*.ts | src/*.tsx | src/*.js | src/*.jsx)
    [ -f "$rel" ] || exit 0
    out="$(npx --no-install eslint -c .eslintrc.json "$rel" 2>&1)" || fail "ESLint failed for $rel:" "$out"
    ;;
  src/*.scss)
    [ -f "$rel" ] || exit 0
    out="$(npx --no-install stylelint "$rel" 2>&1)" || fail "Stylelint failed for $rel:" "$out"
    ;;
esac
exit 0
