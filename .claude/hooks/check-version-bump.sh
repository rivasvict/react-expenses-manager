#!/usr/bin/env bash
# PreToolUse (Bash `git push`, and the GitHub MCP create_pull_request tool):
# every change outside design/ must bump the app version and add a changelog
# entry. A change touching only design/ is exempt (CLAUDE.md, "General
# guidelines for development").
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

input="$(cat)"
tool="$(jq -r '.tool_name // empty' <<<"$input")"
if [ "$tool" = "Bash" ]; then
  cmd="$(jq -r '.tool_input.command // empty' <<<"$input")"
  grep -qE '(^|[;&|[:space:]])git( +-C +[^ ]+)? +push( |$)' <<<"$cmd" || exit 0
fi

base="origin/master"
git rev-parse --verify -q "$base" >/dev/null || git fetch -q origin master 2>/dev/null
git rev-parse --verify -q "$base" >/dev/null || exit 0   # no baseline to compare with

changed="$(git diff --name-only "$base"...HEAD 2>/dev/null)"
[ -n "$changed" ] || exit 0
grep -qv '^design/' <<<"$changed" || exit 0   # design-only: exempt

missing=""
grep -qx 'CHANGELOG.md' <<<"$changed" || missing+=" CHANGELOG.md has no new entry."
old="$(git show "$base:package.json" 2>/dev/null | jq -r .version 2>/dev/null)"
new="$(jq -r .version package.json)"
[ "$old" != "$new" ] || missing+=" package.json version is still $new."
git diff --quiet "$base"...HEAD -- package-lock.json 2>/dev/null && missing+=" package-lock.json was not updated."

[ -z "$missing" ] && exit 0
echo "Blocked: this branch changes files outside design/, so it needs a version bump:$missing" >&2
echo "Bump \"version\" in package.json and package-lock.json and add a Keep a Changelog entry, then commit and retry." >&2
exit 2
