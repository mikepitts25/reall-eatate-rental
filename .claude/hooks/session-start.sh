#!/bin/bash
# LeaseFlip — SessionStart hook
# Installs npm dependencies so tests, linters, typecheck, and builds work in
# Claude Code on the web sessions.
set -euo pipefail

# Only run in the remote (web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies. `npm install` (not `ci`) so the cached container state
# can be reused across sessions and it stays idempotent.
npm install --no-audit --no-fund
