#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit): generated files change only through their
# build script, never by hand, or the next build silently overwrites the edit.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

file="$(jq -r '.tool_input.file_path // empty')"
[ -n "$file" ] || exit 0
rel="${file#"$PWD"/}"

case "$rel" in
  src/styles/_tokens.scss | design/system/tokens.css)
    echo "Blocked: $rel is generated. Edit src/styles/tokens.json and run 'npm run tokens:build'." >&2
    exit 2 ;;
  design/gallery.html | design/features/*/ui/flow.html)
    echo "Blocked: $rel is generated. Edit the design sources and run 'npm run gallery:build'." >&2
    exit 2 ;;
  server/dist/*)
    echo "Blocked: $rel is compiled output. Edit server/**/*.ts and run 'npm run build:server'." >&2
    exit 2 ;;
esac
exit 0
