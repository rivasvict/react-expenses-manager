# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.6.3] - 2026-07-13

### Fixed
- Multi-user sync QA round 2 (D5): rejecting another member's item no
  longer deletes it from the shared party backup or triggers an endless
  upload ping-pong (AC-3.9, EC-2, AC-3.3/3.8). Both upload paths — the
  silent local-only upload and the reviewed merge — now build the uploaded
  snapshot as the union of the downloaded remote snapshot and the local
  data (plus accepted/modified items), via a new `mergeSnapshotForUpload`
  helper keyed by the merge engine's itemKeys. A remote item absent
  locally (one this member rejected, now or in a prior sync) is retained
  in the backup at its remote value, mirroring what `mergeCategories`
  already did for categories; accepted-and-modified items still win over
  the remote value (EC-5). The rejected item is never merged into the
  rejecting member's own data, and the silent path now uploads only when
  the union would actually change the backup, so a rejecting member
  converges to "You're up to date." instead of re-uploading forever.
  Consistent with the additive-only design, sync still carries no
  deletions in either direction.

## [1.6.2] - 2026-07-13

### Fixed
- Multi-user sync QA round 1: user-created categories now travel through
  sync (AC-3.10). Both upload paths — the silent local-only upload and
  the reviewed merge — write an additive, case-insensitive union of the
  local and remote category lists (excluding names already promoted to
  buckets), so a member's custom category is never dropped from the party
  backup and reaches every member. `snapshotsContentEqual` compares
  categories case-insensitively so two members with different casings
  converge to "You're up to date." instead of re-uploading forever
- Review wizard: a brand-new fixed entry or bucket arriving with several
  pending history states now shows ONE card per definition (RFC §4.1),
  fronted by the resolved current state; one decision applies to every
  pending state and a rejection records a per-state `(key, hash)` entry
  for the whole group
- Review wizard: navigating away mid-review now clears the staged review,
  so a later direct visit to `/sync-review` finds nothing to review
  (DESIGN §4.3) — internal phase changes and the already-cleared
  cancel/success/declined flows stay unaffected
- Review wizard: action button aria-labels keep the contributor's name
  casing ("…added by Tom", not "…added by tom")
- Data Management sync card no longer updates its state after navigating
  to the review wizard, removing an act()/unmounted-update warning

## [1.6.1] - 2026-07-13

### Added
- Cloud deployment (multi-user sync, PR 6): `server/lambda.js` (Lambda
  Function URL adapter) and `server/storage-s3.js` (dependency-free S3
  adapter with SigV4 signing and conditional-write compare-and-swap),
  unit-tested with injected doubles — CI never talks to AWS; full
  step-by-step guide in `docs/multi-user-sync/DEPLOYMENT.md` (bucket,
  Lambda, IAM, env vars, CORS, secrets generation, cost notes)
- Automated NFR-2 sweep: a server test runs the full account/party/
  invitation/backup lifecycle on the real fs storage and asserts no
  plaintext password, invitation code or invitation password appears at
  rest or in logs
- DoD audit (`docs/multi-user-sync/DOD-AUDIT.md`) mapping every PRD
  Definition-of-Done item and QA-flagged gap to its covering test, plus
  gap-closing tests: dead-token fallback to logged-out, blocking is not
  retroactive to already-synced entries, and zero sync requests without
  explicit user action

### Fixed
- Review wizard: a failed "Sync again" after a version conflict now
  returns to Data Management with the connection banner instead of
  landing silently on an idle card
- Review wizard: opening the wizard now focuses the "Review changes"
  heading (screen readers announce the screen); advancing between items
  keeps moving focus to the new card

## [1.6.0] - 2026-07-13

### Added
- Review wizard (multi-user sync, PR 5): incoming changes are reviewed
  one item per screen — kind badge, amount/description/category/date (or
  the fixed-entry/bucket equivalents), and attribution ("Added by {name}"
  or "Added anonymously" for legacy items) — with Accept, Modify (inline
  edit before accepting; the edited value is what gets merged and
  uploaded) and Reject
- Accept all / Reject all shortcuts acting on the remaining unreviewed
  items behind a confirmation
- Decisions are staged in memory only: nothing touches this device until
  the final upload succeeds, so canceling or navigating away mid-review
  is always safe and the next sync re-presents everything
- On upload success the merged data is applied locally, rejected items
  are permanently remembered (a re-edited version still re-prompts), and
  "Last synced" updates; a version conflict mid-review discards the
  staged decisions with a "Sync again" restart; a network failure keeps
  them with a Retry; being blocked (or the party canceled) mid-review
  returns to Data Management with the matching declined banner
- Sync card: a failed party check now says so instead of showing
  "Checking your party…" forever

## [1.5.0] - 2026-07-12

### Added
- Sync engine + Data Management sync card (multi-user sync, PR 4): a
  manual "Sync with party" button — never automatic — that downloads the
  party backup, diffs it against local data and handles every no-review
  path end to end
- First sync (no remote backup yet) uploads local data as the party's
  starting point with a distinct confirmation; identical states show
  "You're up to date."; local-only additions upload silently
- Explanatory captions under the button for every disabled state (logged
  out, no party, blocked, canceled) plus a "Last synced" caption;
  download failures, stale blocked/canceled rejections and repeated
  version conflicts each get their own alert, leaving local data
  untouched
- Incoming changes route to a minimal "Review changes" screen offering
  only Cancel review (nothing is ever applied unreviewed); the full
  review wizard arrives next
- Pure merge engine (`syncMergeHelper`): canonical hashing, item
  identity, additive-only diff with permanent per-item rejection memory,
  and merge application incl. fixed-entry tombstones and
  case-insensitive bucket keys
- Server: real backup upload with baseVersion compare-and-swap (409
  VERSION_CONFLICT on mismatch, create-only for the first sync);
  oversized bodies now return 413 PAYLOAD_TOO_LARGE; malformed
  percent-encoding in paths returns 404 instead of 500
- Existing Download/Restore/Clear cards are byte-identical and untouched

## [1.4.0] - 2026-07-12

### Added
- Party management (multi-user sync, PR 3): the organizer can block a
  member (confirm dialog; the member keeps their record and their
  already-contributed entries, but immediately loses sync access) and
  cancel the party (confirm dialog; nobody's local data is touched)
- Blocked members and members of a canceled party see dedicated `/party`
  views explaining what happened, and are free to create or join another
  party
- Server: block/cancel endpoints plus a shared party-access enforcement
  layer — blocked members get 403 BLOCKED and canceled parties 410
  PARTY_CANCELED on the backup endpoints, so the upcoming sync
  implementation inherits the enforcement unchanged
- Organizer-only visibility for Block/Cancel controls; members see a
  read-only list

## [1.3.0] - 2026-07-12

### Added
- Parties (multi-user sync, PR 2): a logged-in user can create one party
  and becomes its organizer; the party is auto-named "{first name}'s
  Party"
- Invitations: the organizer generates a one-time code plus an
  organizer-chosen password from `/party/invite` (code shown exactly
  once, copy buttons with a transient "Copied" confirmation); invitations
  are stored only as a sha256 lookup key plus an AES-256-GCM-encrypted
  record — never in plaintext
- Joining: `/party/join` redeems a code + password; a wrong password
  never consumes the invitation, a redeemed invitation is permanently
  invalid, and a user already in a party is rejected without consuming it
- Party hub `/party` (reached from Account): no-party, organizer and
  member views; organizer-only controls stay hidden from members, and
  create/join affordances disappear once in a party
- Server: party/invitation endpoints with compare-and-swap updates on the
  party record; `/api/me` now returns the party
- Central 401 handling in the sync API client: a rejected token clears
  the stored session and degrades the UI to logged-out

## [1.2.0] - 2026-07-12

### Added
- Accounts (multi-user sync, PR 1): optional sign up / sign in / log out —
  the app remains fully functional without an account, and no existing
  route is gated
- Account entry point in the app header (generic glyph when logged out,
  initials chip when logged in) and new in-app screens: `/account`,
  `/sign-up`, `/sign-in`
- Local sync server (`npm run sync-server`): dependency-free plain Node
  service with scrypt password hashing, HMAC-signed 30-day tokens and
  on-disk JSON storage under `server/.data/` (gitignored); contract tests
  via `npm run test:server` (Node >= 18); see `server/README.md`
- Sessions persist across reloads/restarts (`sync.session`) until logout
  or token expiry; login/signup errors use clear, non-revealing copy
- Attribution: entries, fixed-entry states and bucket states created while
  logged in are stamped with `addedBy` (account id + first name) for the
  upcoming sync review wizard; anonymous when logged out
- `REACT_APP_SYNC_API_HOST` config (defaults to `http://localhost:4000`)

## [1.1.0] - 2026-07-10

### Changed
- Complete UX/UI overhaul on a new design-token system (`variables.scss`):
  refined dark "calm fintech" palette, consistent card surfaces, radii,
  focus-visible rings, and semantic income (green) / expense (rose) colors
  used across rows, totals, icon chips and charts
- Navigation: the Bootstrap navbar was replaced by an app bar with an
  icon+label nav — inline at the top on wide screens, a fixed bottom tab bar
  on narrow ones — with active-route highlighting; the same links (Home,
  Categories, Buckets, Fixed Entries, Data Management) stay in the DOM in
  both layouts
- Dashboard: savings now lead as a hero balance card (tone-colored by sign),
  followed by the month navigator, balance donut and tappable income/expense
  stat rows; Add Income / Add Expenses sit side by side
- Month navigation: Prev/Next became round chevron buttons with
  "Previous month" / "Next month" accessible names
- Buckets: each bucket is a card with a rounded progress bar (green → amber
  at 65% → red past 85%), a colored usage percentage and clearer
  Spent / Remaining / Allowance rows
- Forms: visible field labels (Amount, Description, Category, Monthly
  allowance…), helper hints, a styled recurring toggle, and the entry
  category select now prompts "Select a category" instead of "All categories"
- Summary tiles show plain text totals ("July total: …", "Expenses total: …")
  instead of the meaningless "remote" glyph; entry rows and totals use
  money-in/money-out arrow chips
- Data Management: reorganized into explanatory cards ("Keep your data
  safe" / "Danger zone"); clearing all data now asks for confirmation first
- Charts: doughnuts use a CVD-validated categorical palette with
  surface-colored slice gaps, softer legend, and a semantic green/red pair
  for income-vs-expense charts
- Data disclaimer modal restyled and reworded; button label fixed
  ("I Aknowledge" → "Got it")

### Fixed
- Refreshing (or landing directly) on `/summary` no longer shows an empty
  $0.00 report: the Summary screen derives its data from the store at render
  time instead of freezing whatever was loaded at mount
- Link-styled primary buttons no longer inherit the global link color, which
  washed out the gold "Add …" buttons with light text

### Tests
- `entryCreation.test.tsx`: the income-creation assertion now tolerates the
  same amount appearing in both the savings hero and the incomes row (the
  seeded scenario has no expenses, so both legitimately read $1,000.00)
- `CategorySelector.test.js.snap`: refreshed — the empty option renders the
  same DOM from a single template string
- `fixedEntries.test.tsx`: the "no Prev/Next on a single-month tree"
  assertions now match the buttons' new accessible names (`/prev/i`,
  `/next/i`) so the guard is no longer vacuous

## [1.0.4] - 2026-07-10

### Added
- CI: `unit-tests` and `integration-tests` GitHub Actions workflows, running
  on push to `master` and on pull requests targeting `master`. Both pin
  Node via `.nvmrc`, install with `npm ci`, and split the suite using the
  existing `testPathPattern="integrationTests"` convention

## [1.0.3] - 2026-07-10

### Fixed
- `App.test.js`: pass a real Redux store to `<App />` so the test no longer
  crashes inside `Provider`
- `CategorySelector.test.js`: refreshed a snapshot that predated the
  `categories_path` comma-delimited format and the added `className` prop
- `entriesHelper.test.js`: `getGroupedFilledEntriesByDate` fixture dates were
  stored as `Date#toString()` strings instead of Unix-ms timestamps, so every
  entry was silently grouped under `"NaN"/"NaN"`; converted the fixture and
  froze the system clock in the test so the "fill empty months up to now"
  behavior stays deterministic

### Changed
- Skipped 4 unit test suites (`Dashboard/index.test.js`,
  `AddEntry/index.test.js`, `Summaries/EntriesSummary.test.js`,
  `Summaries/EntrySummaryWithFilter.test.js`) that exercise component APIs
  removed in earlier refactors; each carries a `TODO(#116)` pointing at the
  tracking issue for their rewrite
- Removed the orphaned `Dashboard.test.js.snap`, left over from the
  now-fully-skipped Dashboard suite

## [1.0.2] - 2026-07-09

### Added
- Fixed Entries: section totals for the Incomes and Expenses lists, showing
  the sum of the recurring entries applying to the viewed month (#113)

## [1.0.0] - 2026-07-05

First stable release. This version consolidates the buckets, categories,
fixed-entries, and backup/restore work into a single supported release.

### Added
- Single-file backup & restore for the entire app's data (#109)
- Fixed Entries: mark incomes/expenses as recurring per category, with a
  dedicated Fixed Entries page and the ability to promote a regular entry
  to recurring from the edit screen (#103)
- Custom categories: create new categories together with their bucket (#100)
- Buckets: per-category budgeting buckets with per-month limits and
  carry-over of remainders/debt across months (#102, buckets exploration
  and management)
- Backup & restore for buckets data
- Integration test suite covering the core expense-manager flows (#89, #91)
- `typecheck` npm script for TypeScript checking
- `CLAUDE.md` project documentation for contributors

### Changed
- Per-month bucket limit edits now apply from the edited month forward
  instead of retroactively (#102)
- Negative bucket availability is now shown as `$0.00 (-deficit)` instead
  of a raw negative number
- Bucket card UI simplified per design feedback
- Internal categories state renamed to `unbudgetedCategories` for clarity (#100)

### Fixed
- New entries are now stamped with the selected month/year instead of the
  wall-clock date (#93)
- Cross-year month filling and a missing entry UUID after creation (#91)
- Leading zero re-appearing when re-entering a value after clearing the
  edit-bucket input
- Prev navigation no longer enabled when no user data exists
- Restore now navigates to the dashboard on success and hardens `FileReader`
  cleanup (#109)
- Dashboard `PropTypes` corrected for entries; recurring-entry coverage
  strengthened
- Various spacing/sizing fixes across the Buckets, Categories, and Fixed
  Entries pages
- Stale personal references and ESLint warnings removed; license file fixed

[1.0.2]: https://github.com/rivasvict/react-expenses-manager/releases/tag/v1.0.2
[1.0.0]: https://github.com/rivasvict/react-expenses-manager/releases/tag/v1.0.0
