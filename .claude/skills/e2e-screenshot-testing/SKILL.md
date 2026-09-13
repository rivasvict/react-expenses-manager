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
git fetch origin "$BASE_BRANCH"
MERGE_BASE=$(git merge-base HEAD "origin/$BASE_BRANCH")
git diff --name-only --diff-filter=AM "$MERGE_BASE"...HEAD -- src/integrationTests
```

**Always fetch the base branch from origin first** (`git fetch origin
"$BASE_BRANCH"`) and diff against `origin/$BASE_BRANCH`, never a possibly
stale local `master`/main branch ref. A stale local base branch makes files
that were already merged upstream (via another PR) look like they belong
to the current branch, inflating the scope with cases that don't belong to
it. Confirm the base branch's local ref is updated too (e.g.
`git fetch origin "$BASE_BRANCH":"$BASE_BRANCH"` if safe to fast-forward,
or just rely on `origin/$BASE_BRANCH` throughout) before computing the
diff.

If that list is empty, ask the user which test(s) to target rather than
guessing.

## Get user approval before running

Before starting the app or spawning the subagent: read each target test
file, enumerate every distinct state/scenario it asserts, and present the
user a concise list of the cases you intend to capture (grouped by test
file). Ask them to confirm this matches what actually changed on the
branch, or tell you to add/drop cases. Only proceed to standing up the app
and spawning the subagent after they approve the list.

## Sample data fixture

`src/integrationTests/fixtures/expenses-backup.sample.json` holds a
ready-made set of expense/income entries. Use it, when a scenario in scope
for this run actually needs existing/non-empty data to look realistic,
instead of hand-typing entries in the browser — seed it via the same API
path used for other test data (e.g. restore/import it against the running
app or sync server). Only reach for it if the approved case list has such
a scenario; don't seed it by default.

## Delegate to a subagent

This work is long, tool-call-heavy, and disposable — always run it in a
subagent rather than inline, so the raw screenshot/tool noise doesn't fill
the main conversation.

- Spawn with `Agent` (not `fork` — this needs a clean slate, not the parent's
  history).
- **Evaluate model capability before picking, don't default to the cheapest
  tier blind.** Before spawning, look at what the approved case list
  actually demands, on this specific run — don't assume any fixed sequence
  of steps is required regardless of what the tests cover. As a rough
  guide, cases needing multi-step API sequencing across several dependent
  calls, fixture-data seeding, persona-switching across tabs, or recovering
  from ambiguous DOM state require sustained multi-step judgment, not just
  single-shot tool calls (e.g., a case list involving chaining several
  setup calls together to reach a state, is a heavier case than one that's
  just "sign in, load a page, screenshot it"). If most of the approved
  cases skew toward the heavier end, spawn directly on a capable model
  (`sonnet`) — do not start on `haiku` "to save cost" when the case list
  already tells you it will get stuck. Reserve `haiku` for genuinely
  mechanical runs with no real state seeding. This kind of case has been
  tried on this codebase before and Haiku gave up on the seeding-heavy
  cases each time — treat that as evidence, not a one-off, when judging
  future case lists here.
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

## Every approved case must be captured — no silent downgrade

Once the user has approved a case list, **capturing a screenshot for every
case is a hard requirement, not a best-effort target.** "The test suite
passes" is never a substitute for a screenshot and must never be reported
as if it closes out a case — the whole point of this skill is a *visual*
proof the automated suite cannot provide on its own.

If a case seems hard to reproduce live (state seeding, injected server
errors, a multi-step flow), that is expected — work through it via the API
seeding approach above rather than concluding it "requires the fake test
server" or "requires database access." Whatever a test file's fake-server
helper does to reach a state, the real server it's faking almost always
supports the same operation for real — e.g. a race/conflict a test injects
via the fake server can usually be reproduced with two real overlapping API
calls instead of something only a mock can produce. Check what the fake
helper actually does before deciding a state is unreachable live.

**The fake test server is not off-limits, but it is a last resort, not a
shortcut.** Using it to seed or drive a state for the live walkthrough is
only acceptable when the live app plus its real backend genuinely has no
way to reach that state (e.g. a fault the real server structurally cannot
be made to produce). It must never be reached for merely because seeding
the state via real API calls is more steps or more effort — that is exactly
the case the previous paragraph exists to rule out. If you do fall back to
it, say so explicitly in `CASES.md` next to that case, with the reason the
live path was not possible.

If, after real attempts, a specific case truly cannot be reproduced against
the live app (rather than merely being effortful), the subagent must **stop
and escalate to the parent** rather than write it into `CASES.md` as "not
captured" and move on. Report exactly which case, what was tried, and why
it's blocked, so the parent can decide whether to hand the same run to a
more capable model or adjust scope — a finished run with unexplained gaps
quietly marked "proven by tests only" is a failed run, not a partial
success.

## Suspected bugs block the case, not the run

If a case cannot be captured because the live app appears to behave
incorrectly — not a selector/automation problem, but the app doing
something the test/spec says it shouldn't (wrong copy, wrong state, an
error where none is expected, a control that should be disabled but isn't,
etc.) — do not silently work around it, do not "fix" it yourself, and do
not mark the case as captured against the buggy behavior. Stop on that
case, capture whatever evidence you have (screenshot, console/network
output, the exact steps that produced it), and report it back to the
parent as a suspected bug rather than a blocked case. Wait for instructions
on whether to fix it before continuing — do not decide unilaterally to
patch the app mid-run just to get a screenshot. Other, independent cases in
the same run may continue while awaiting that decision.

## Also run the real test suite

Alongside (or before) the visual walkthrough, run the actual tests so the
report can state both facts independently:

```bash
npm test -- --testPathPattern="<name-fragment>" --watchAll=false
```

## Where screenshots go

One flat folder **per branch** — never per test file, per feature, or
nested subdirectories:

```
src/.e2e-screenshots/<branch-name>/
```

`<branch-name>` is the current git branch name with `/` replaced by `-`
(e.g. `sync-stack/5-sync-engine` → `sync-stack-5-sync-engine`). All
screenshots for the run live directly inside this one folder — no
per-test-file or per-feature subdirectories. Name each file so its place in
the overall scenario order and what it proves are both obvious, prefixed by
which test file it belongs to:

```
src/.e2e-screenshots/sync-stack-5-sync-engine/
  01-accounts-logged-out.jpg
  02-accounts-signup-form.jpg
  03-party-created-organizer-alone.jpg
  ...
  12-partyManagement-block-confirmed-row-shows-blocked.jpg
CASES.md
```

**Isolate runs:** before capturing anything, delete and recreate this
branch's folder (`rm -rf src/.e2e-screenshots/<branch-name>` then
`mkdir -p`) so a re-run never mixes stale screenshots from a previous
attempt with the current one.

**`CASES.md`:** alongside the screenshots (same folder, not a
subdirectory), write a plain list of every test case covered in this run —
one line per case, grouped by source test file, each naming the screenshot
file(s) that prove it. This is the same list the user approved before the
run started; update it to reflect what was actually captured (including
any scenario marked as not reproducible, and why).

This directory is gitignored (`/src/.e2e-screenshots`) — it is scratch
proof for the user to review, not a repo artifact. **Never delete it
yourself** once written (other than the pre-run cleanup of the same
branch's folder above); it stays until the user explicitly asks for it to
be removed. Do not clean it up as part of "finishing" the task — only the
servers you started get torn down.

## Final report

Report back (from the subagent, then relayed by the parent to the user):

- The list of test files covered and the scope (diff range) used.
- Whether `npm test` passed for those files.
- The absolute screenshot directory path, given as a plain path the user
  can copy-paste straight into their file explorer (no markdown link
  wrapping, no backticks that would need stripping).
- The full list of test cases covered, i.e. the contents of `CASES.md` —
  every approved case must appear with a captured screenshot (see "Every
  approved case must be captured" above). A report listing cases as "not
  captured, proven by test suite only" is not a completed run; if that
  happened, say so explicitly as a failure/escalation, not as a finished
  deliverable.
- Which servers (if any) you started and then stopped, vs. ones that were
  already running and left alone.
- Any suspected bug hit along the way (see "Suspected bugs block the case,
  not the run" above), called out on its own — not folded into the case
  list — with the evidence gathered and awaiting the user's decision on
  whether to fix it.
