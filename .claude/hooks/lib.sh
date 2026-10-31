#!/usr/bin/env bash
# Shared helpers for the Claude Code hooks (see the "Hooks" section of CLAUDE.md).
# Hook scripts are sourced with the project root as the working directory.

# Hooks are no-ops until dependencies are installed (fresh clone, cloud session
# before the setup script ran) so Claude is never blocked by "command not found".
deps_installed() { [ -d "$CLAUDE_PROJECT_DIR/node_modules" ]; }

# Prints at most N lines of stdin so a wall of errors does not flood the context.
limit_output() { head -n "${1:-60}"; }
