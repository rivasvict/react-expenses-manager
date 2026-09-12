---
name: e2e-screenshot-testing
description: Visually proves the integration-test coverage added or changed on the current branch by driving the real app in a browser and capturing a screenshot for every state those tests assert. Use when asked to "e2e test", "visually verify", "prove the tests pass with screenshots", or similar, for the current branch's work.
---

# E2E screenshot testing

Drives the real running app (frontend + sync server) through every scenario a
target set of `src/integrationTests/*.test.tsx` files assert, saving one
screenshot per asserted state as visual proof — the same process used to
verify `partyManagement.test.tsx` by hand in an earlier session.

## Scope of what to test

Unless the user names specific test file(s) or scenarios, the scope is:
every file under `src/integrationTests/` that was **added or modified** by
the commits belonging to the branch currently checked out, relative to where
it diverged from the repo's main branch.

```bash
BASE_BRANCH=$(git remote show origin 2>/dev/null | sed -n '/HEAD branch/s/.*: //p')
BASE_BRANCH=${BASE_BRANCH:-master}
MERGE_BASE=$(git merge-base HEAD "origin/$BASE_BRANCH" 2>/dev/null || git merge-base HEAD "$BASE_BRANCH")
git diff --name-only --diff-filter=AM "$MERGE_BASE"...HEAD -- src/integrationTests
```

If that list is empty, ask the user which test(s) to target rather than
guessing.

## Delegate to a subagent

This work is long, tool-call-heavy, and disposable — always run it in a
subagent rather than inline, so the raw screenshot/tool noise doesn't fill
the main conversation.

- Spawn with `Agent` (not `fork` — this needs a clean slate, not the parent's
  history).
- Prefer the **cheapest capable model**: start with `haiku`. If the Haiku
  agent reports it is stuck (can't get a reliable selector, keeps hitting
  the same login race, genuinely ambiguous scenario), re-spawn the same task
  with `sonnet` instead of trying to debug it from the parent — don't spend
  parent-context effort steering a stuck cheap model.
- Give the subagent the full protocol below verbatim plus the concrete diff
  scope (file list) you computed, since a fresh agent has no memory of this
  session.
- The subagent's tool access must include Bash, Read, Grep/Glob, and either
  Playwright's MCP tools or `claude-in-chrome` (see Tool selection below) —
  use `general-purpose` or an agent type with unrestricted tools.

## Tool selection (browser automation)

Try in this order, and use the first one that's actually available —
check, don't assume:

1. **Playwright.** Check with `npx playwright --version` (or look for
   `@playwright/test` / `playwright` in `package.json`/`node_modules`). If
   present but browsers aren't installed, run `npx playwright install
   chromium` before using it. Drive it via a short Node/TS script (or
   `npx playwright` codegen-free scripting) that navigates, fills forms,
   clicks, and calls `page.screenshot({ path })`.
2. **Chrome via the `claude-in-chrome` MCP tools**, if Playwright isn't
   available or its browsers can't be installed in this environment. Load
   the tools via `ToolSearch` first (they're deferred) — see the
   `claude-in-chrome` skill for the loading/usage contract. This was the
   tool used in the session this skill is modeled on.
3. **Neither available:** stop and tell the user exactly what's missing and
   how to fix it for their environment, e.g.:
   - No Playwright and no way to install it: "Run `npm install -D
     @playwright/test && npx playwright install chromium` to enable
     Playwright-based e2e screenshots."
   - No `claude-in-chrome` and no Playwright: "Install the Claude for
     Chrome extension and run `claude --chrome` (see `/chrome`), or install
     Playwright with the command above."
   Do not fall back to static/inline-HTML mockups or skip the screenshots —
   either the browser tooling works or the user is told what to enable.

## Standing up the app

Check both before doing anything else:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/ || echo down
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/api/me || echo down
```

- If the frontend (3000) isn't responding, start it in the background
  (`npm start`, backgrounded, redirect output to a temp log) and poll until
  it answers. Remember that you started it.
- If the sync server (4000) isn't responding, build and start it
  (`npm run sync-server`, backgrounded) and poll until it answers 401/200
  rather than connection-refused. Remember that you started it.
- **Only kill what you started.** If a server was already up before you
  began, leave it running when you finish — it may be the user's own dev
  session. Kill your own backgrounded processes only after screenshots are
  captured and the report is written (success or failure).

## Reproducing the test scenarios live

Read each target `*.test.tsx` file and enumerate every distinct state it
asserts (e.g. "dismissed confirm leaves X unchanged", "row shows Blocked",
"member sees no admin controls") — each becomes one screenshot. Then:

1. **Seed data via the API, not the UI**, wherever the test file's own
   helpers seed data that way (e.g. a `fakeSyncServer`/`seedUser`-style
   helper talking to `POST /api/auth/signup`, `POST /api/party`,
   `POST /api/party/invitations`, `POST /api/party/join`, etc. against the
   real sync server on :4000). Reserve the browser for the states you
   actually need to *see* — signing in as each persona and observing the
   resulting page. This is faster and far more reliable than driving every
   form field through the browser.
2. **Confirm dialogs.** Where the app under test uses `window.confirm` (or
   any native dialog), never let the real dialog fire — it blocks further
   browser automation. Stub it before the click that triggers it:
   - Playwright: `page.on('dialog', d => d.accept())` (or `.dismiss()` for
     the "cancelled" scenario), registered before the click.
   - Chrome MCP (`javascript_tool`): `window.confirm = () => true;` (or
     `=> false`) evaluated in-page before the click, and re-armed after
     every full page navigation/reload (a reload resets `window`).
3. **Multiple personas share one browser origin.** `localStorage` (and
   hence the app's session) is shared across tabs on the same origin —
   signing in as persona B in one tab silently logs out persona A's tab on
   its next reload/action. So: act as one persona at a time, and
   immediately before any authenticated action, (re-)sign in as that exact
   persona in that tab and **positively confirm** the sign-in landed (check
   the header/account name in a screenshot or the DOM) before proceeding —
   don't chain a navigate immediately after a login click without
   confirming it first, or the action may silently run as the wrong user.
4. **Verify form input actually landed** before submitting — a click
   immediately following a page navigation can miss because the page
   hasn't settled yet. Read the input's `.value` back (via the browser's JS
   evaluation) after typing, or take a screenshot, before clicking submit.
5. Capture one screenshot per asserted state, in the order the test file
   presents them, right after the state is reached (not before, not several
   actions later).

## Also run the real test suite

Alongside (or before) the visual walkthrough, run the actual tests so the
report can state both facts independently:

```bash
npm test -- --testPathPattern="<name-fragment>" --watchAll=false
```

## Where screenshots go

Save every screenshot under:

```
src/.e2e-screenshots/<feature-purpose>/
```

`<feature-purpose>` is a descriptive, dashed, **at most 5 words** slug for
what the tests cover (e.g. `party-block-and-cancel`, `bucket-limits`,
`csv-import-export`) — not the test file's literal name. Name each file so
its place in the scenario order and what it proves are both obvious, e.g.:

```
src/.e2e-screenshots/party-block-and-cancel/
  01-no-party-yet.jpg
  02-party-created-organizer-alone.jpg
  ...
  06-block-confirmed-row-shows-blocked.jpg
```

This directory is gitignored (`/src/.e2e-screenshots`) — it is scratch
proof for the user to review, not a repo artifact. **Never delete it
yourself** once written; it stays until the user explicitly asks for it to
be removed (in this session or a later one). Do not clean it up as part of
"finishing" the task — only the servers you started get torn down.

## Final report

Report back (from the subagent, then relayed by the parent to the user):

- The list of test files covered and the scope (diff range) used.
- Whether `npm test` passed for those files.
- The screenshot directory path and a short list mapping each file to the
  scenario it proves.
- Any scenario that could **not** be reproduced live (e.g. a test that
  relies on injecting a synthetic server error only the fake test server
  can produce) — name it and say why, rather than silently skipping it.
- Which servers (if any) you started and then stopped, vs. ones that were
  already running and left alone.
