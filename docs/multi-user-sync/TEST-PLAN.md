# Test Plan: Multi-User Sync

Inputs: `PRD.md` (AC/EC), `DESIGN.md` (screens/copy/a11y), `RFC.md`
(architecture/contract), `TASKS.md` (PR breakdown), `CLAUDE.md`.

IDs: `SC-<PR>.<n>` server contract (`node --test`), `UT-4.<n>` merge-engine
unit tests, `TC-<PR>.<n>` frontend integration tests, `MX-<n>` manual.
**[QA]** = not promised by `TASKS.md`; added here as a sign-off condition,
with a one-line reason.

---

## 1. Test strategy

**(a) Server contract** — `npm run test:server` (`node --test server/`,
zero deps). Calls `server/core` directly: status/error-code/body, plus
reading `server/.data/*.json` for secrets-at-rest checks.

**(b) Frontend integration** — `npm test --
--testPathPattern="integrationTests"` (jsdom, `renderApp`). All sync
fetches route through `fakeSyncServer.ts` stubbing `window.fetch`; no live
network. Assertions use `screen.findByText`/`getByRole` (NFR-5,
`CLAUDE.md`), never Redux/`localStorage` reads — except the one pattern
`singleFileBackup.test.tsx` already sets as precedent: reading
`localStorage` only to prove a **failure path wrote nothing**, never to
assert success (see TC-1.7).

**(c) Manual exploratory** — two terminals (`npm run sync-server` +
`npm start`), two browser profiles as two family members. Run after PR5
and again after PR6. Covers what jsdom can't: real browser-restart
persistence, a genuine two-tab CAS race, real disconnection, real
`server/index.js` HTTP/CORS, plaintext-at-rest inspection on disk. §6.

---

## 2. Traceability matrix

| AC/EC | Covered by | Gap |
|---|---|---|
| AC-1.1 | SC-1.1, SC-1.4, TC-1.1 | |
| AC-1.2 (pw never plaintext) | SC-1.8 **[QA]** | PR1's promised tests never check storage format; only PR6's grep sweep would. Added at the source PR. |
| AC-1.3 (persists reload/restart) | TC-1.4; MX-2 real restart | |
| AC-1.4 (logout) | TC-1.5, TC-4.1 | |
| AC-1.5 (dup email / wrong creds, generic) | SC-1.2, SC-1.5, SC-1.6, TC-1.2, TC-1.3 | |
| AC-1.6 (attribution) | TC-5.1 | Stamping happens in PR1 but is first checked in PR5's wizard — a PR1 stamping bug ships undetected for 4 PRs. Added TC-1.7. |
| AC-1.7 (logged-out unaffected) | TC-1.6, TC-4.1, §4 | |
| AC-2.1 (create one party) | TC-2.1 | |
| AC-2.2 (≤1 party; UI never offers 2nd) | TC-2.9 **[QA]** | No PR2 test asserts CTAs are absent for an existing member. |
| AC-2.3 (generate invite) | TC-2.3, SC-2.3 | |
| AC-2.4 (invite encrypted) | SC-2.9 | |
| AC-2.5 / EC-7 (wrong pw, not burned) | SC-2.6, TC-2.6 | |
| AC-2.6 / EC-8 (reused token) | SC-2.7, TC-2.7 | |
| AC-2.7 / EC-6 (already in party) | SC-2.8, TC-2.8 **[QA]** | DESIGN calls this path "normally unreachable"; no promised UI test. |
| AC-2.8 (direct add = invite) | TC-2.3 | |
| AC-2.9 (block; not retroactive) | SC-3.1, TC-3.1 mechanics; TC-3.6 **[QA]** non-retroactivity | "Entries already contributed stay in history" needs a synced backup, so it can't be closed until PR5 lands — flag for PR5 sign-off, not just PR3. |
| AC-2.10 (cancel; no data touched) | SC-3.5, TC-3.3, TC-3.4 | |
| AC-2.11 (sync gated) | TC-4.1 | |
| AC-2.12 (organizer-only controls) | TC-2.4, TC-3.5 | |
| AC-3.1 (manual only) | TC-4.10 **[QA]** | No promised test proves *absence* of an automatic sync call. |
| AC-3.2 (download + diff) | TC-4.4, TC-4.5, TC-5.1 | |
| AC-3.3 / EC-1 | TC-4.3, TC-4.4 | |
| AC-3.4 (wizard content/attribution/3 actions) | TC-5.1–5.4 | |
| AC-3.5 (Accept/Reject All) | TC-5.6, TC-5.7 | |
| AC-3.6 (accept/reject/modify) | TC-5.2–5.5 | |
| AC-3.7 (Restore unmodified) | TC-4.11, §4 | |
| AC-3.8 (result becomes new backup) | TC-5.9, TC-5.4 | |
| AC-3.9 / EC-4 (idempotent) | TC-5.13, TC-5.14 | |
| AC-3.10 (entries+fixed+buckets) | TC-5.1 | |
| AC-3.11 / EC-3 (failed dl/upload untouched) | TC-4.6, TC-5.10 | |
| EC-2 (version conflict) | TC-5.11 | |
| EC-5 (modify value wins) | TC-5.4 | |
| EC-9 (blocked sync rejected) | TC-4.7, TC-5.12, SC-3.3, SC-3.4 | |

Cross-cutting gaps not tied to a single AC:
- **No client-side test for token-expiry handling** (RFC §5: 401 → client
  clears session, shows logged-out state). SC-1.7 is server-only. Added
  TC-1.11.
- PR6's "a11y pass" / "no plaintext" sweep is a manual audit in
  `TASKS.md`, not new automated coverage — PR6 sign-off is contingent on
  the checklists in §5/§6, not on test count alone.

---

## 3. Test cases

### PR 1 — Accounts

- **SC-1.1** Valid signup → `201 {token,user}`.
- **SC-1.2** Signup with a taken email → `409 EMAIL_TAKEN`.
- **SC-1.3** Signup missing password → `400 VALIDATION_ERROR`.
- **SC-1.4** Valid login → `200 {token,user}`.
- **SC-1.5** Correct email, wrong password → `401 INVALID_CREDENTIALS`.
- **SC-1.6** Unregistered email → `401 INVALID_CREDENTIALS`, body
  byte-identical in shape to SC-1.5 (no account-enumeration signal).
- **SC-1.7** Expired token on `GET /api/me` → `401 UNAUTHORIZED`.
- **SC-1.8 [QA]** Read `server/.data/users/<hash>.json` after signup: no
  field equals the plaintext password; `password.algo === "scrypt"` with
  non-empty salt/hash.

- **TC-1.1** Sign up from `/account` (logged out) → header icon becomes
  an initials chip; `/account` shows name/email.
- **TC-1.2** Sign up with an email that already has an account →
  `role="alert"` *"An account with this email already exists. Try signing
  in instead."* with a working `Sign in` link, fields retained.
- **TC-1.3** Sign in, wrong password → `role="alert"` exactly *"Email or
  password is incorrect."*
- **TC-1.4** Sign up, then re-`renderApp()` (reload analogue) without
  touching storage → still shows the initials chip.
- **TC-1.5** Log out → no confirm dialog; logged-out `/account` renders;
  transient `role="status"` *"Signed out. Your data stays on this
  device."*
- **TC-1.6** Logged out, visit every existing route → unchanged from
  today; header `aria-label="Account"`; zero sync DOM anywhere.
- **TC-1.7 [QA]** *Gap-fill, AC-1.6.* Logged in as Jane, add an income.
  No PR1 UI surfaces attribution yet, so — per the one sanctioned
  exception in §1(b) — read `localStorage.getItem("balance")` and assert
  the new entry's `addedBy.name === "Jane"`; comment inline why (PR5's
  TC-5.1 is the later UI-level confirmation).
- **TC-1.8** Submit sign-up/sign-in with a delayed `fakeSyncServer`
  response → button reads "Signing up…"/"Signing in…", `disabled`.
- **TC-1.9** `/sign-up` → `Cancel` → back to `/account`, no account
  created.
- **TC-1.10** Logged in → header `aria-label="Account: Jane Doe"`.
- **TC-1.11 [QA]** *Gap-fill, token expiry.* Logged in;
  `fakeSyncServer` returns `401` on the next authenticated call →
  triggering it falls back to the logged-out view, no crash/stuck spinner.

### PR 2 — Parties

- **SC-2.1** `POST /api/party` (no existing party) → `201`, name =
  `"{firstName}'s Party"`.
- **SC-2.2** `POST /api/party` for a user already in one → `409
  ALREADY_IN_PARTY`.
- **SC-2.3** Organizer generates invitation → `201 {code}` shaped
  `XXXX-XXXX`.
- **SC-2.4** Non-organizer calls invitation endpoint → `403
  NOT_ORGANIZER`.
- **SC-2.5** Redeem correct code+password → `200`, member added.
- **SC-2.6** Redeem correct code, wrong password → `401
  INVITATION_WRONG_PASSWORD`; retry with correct password on the *same*
  code still succeeds (EC-7, not burned).
- **SC-2.7** Redeem an already-used code (either password) → `410
  INVITATION_USED` (EC-8).
- **SC-2.8** User already in party A redeems a code for party B → `409
  ALREADY_IN_PARTY`; a later fresh user on the *same* code still succeeds
  (proves it wasn't consumed, EC-6).
- **SC-2.9** Inspect `server/.data/parties/*.json` after SC-2.3: code and
  password appear nowhere in plaintext.

- **TC-2.1** `Create a party` → confirm dialog *"Create a party? You'll
  become its organizer and can invite family members."* → organizer card
  `"Jane's Party"` with `Organizer` badge.
- **TC-2.2 [QA]** `Create a party` → dismiss the confirm → still on
  no-party view.
- **TC-2.3** Organizer: `Add a member` → set password → `Generate
  invitation` → code+password shown read-only with `Copy` buttons;
  `Copy` shows *"Copied"* in an `aria-live="polite"` region (~2s).
- **TC-2.4** Non-organizer member on `/party` → no `Add a
  member`/`Cancel party`; footer *"Only Jane, the organizer, can add or
  remove members."*
- **TC-2.5** `/party/join` with valid code+password → redirected to
  `/party`, member view (3.3), new member's row visible.
- **TC-2.6** Right code, wrong password → `role="alert"` exactly *"That
  password doesn't match this invitation. Double-check it with whoever
  invited you and try again."*; fields retained; correcting and
  resubmitting succeeds.
- **TC-2.7** Redeem a code once, redeem again from a second account →
  `role="alert"` exactly *"This invitation has already been used. Ask
  the organizer to send you a new one."*
- **TC-2.8 [QA]** Existing member force-navigated to `/party/join`
  submits a valid code (stale-tab simulation) → `role="alert"` exactly
  *"You already belong to a party. Refresh to see it."*
- **TC-2.9 [QA]** *Gap-fill, AC-2.2.* Existing member visits `/party` →
  no `Create a party`/`Join a party` CTA anywhere reachable.
- **TC-2.10** Organizer, no members yet → list shows only Jane's row +
  *"Invite family members to start syncing."*

### PR 3 — Block & cancel

- **SC-3.1** Organizer blocks a member → `200`, `blocked === true`.
- **SC-3.2** Non-organizer block attempt → `403 NOT_ORGANIZER`.
- **SC-3.3/3.4** Blocked member: `GET`/`PUT /api/party/backup` → `403
  BLOCKED`.
- **SC-3.5** Organizer cancels → `200`, `canceled === true`.
- **SC-3.6** Non-organizer cancel attempt → `403 NOT_ORGANIZER`.
- **SC-3.7** Canceled party: `GET`/`PUT /api/party/backup` → `410
  PARTY_CANCELED`.

- **TC-3.1** Organizer `Block`s Tom, confirms (*"Block Tom Doe? They'll
  immediately lose the ability to sync. Entries they've already
  contributed stay in the party's history."*) → Tom's row shows muted
  `Blocked`, no `Block` button.
- **TC-3.2** Tom (just blocked) loads `/party` → CTA layout, *"You've
  been removed from this party by its organizer."*
- **TC-3.3** Organizer `Cancel party`, confirms (*"Cancel Jane's Party?
  No member will be able to sync afterward. Nobody's local data is
  deleted."*) → organizer's own `/party` becomes canceled CTA view.
- **TC-3.4** Member loads `/party` after cancel → *"Your party was
  canceled. Create or join a new one to sync again."*
- **TC-3.5** Member view has no `Block`/`Cancel party` controls, pre- and
  post-cancel.
- **TC-3.6 [QA]** *Gap-fill, AC-2.9 — run once PR5's sync exists, not at
  PR3 merge.* Tom synced an entry, then got blocked; Jane syncs →
  Tom's entry is still present as merged/incoming, not stripped.

### PR 4 — Sync engine + Data Management card

- **UT-4.1** `itemKey`/`contentHash` stable regardless of object key
  order.
- **UT-4.2** Local has `key` with equal `hash` → skipped (not incoming).
- **UT-4.3** `(key,hash)` in `sync.state.rejections` → skipped even if
  still in the remote backup (EC-4).
- **UT-4.4** Same `key`, different `hash` → `isChange: true`.
- **UT-4.5** Additive-only: item missing from remote is never removed
  locally.
- **UT-4.6** Bucket `itemKey` matching is case-insensitive.
- **UT-4.7** `removed: true` tombstone diffed as an ordinary history
  state.

- **TC-4.1** Assert exact caption per state:
  | State | Caption |
  |---|---|
  | Logged out | "Sign in and join a party to sync your entries across devices." |
  | Logged in, no party | "Create or join a party to start syncing." |
  | Party canceled | "Your party was canceled. Create or join a new one to sync again." |
  | Blocked | "You've been removed from your party by its organizer. Sync is unavailable." |
  | Enabled, never synced | "Never synced yet" |
- **TC-4.2** Enabled, prior sync recorded → "Last synced: {relative
  date}".
- **TC-4.3** No remote backup yet (EC-1) → sync → no wizard;
  `role="status"` *"This is the first sync for your party. Your data is
  now the starting point — future syncs will compare against it."*;
  `getUploadedBackups()` now has the local snapshot.
- **TC-4.4** Remote content-equals local → `role="status"` *"You're up to
  date."*; no `PUT` recorded.
- **TC-4.5** Local-only additions, remote otherwise unchanged → no
  wizard, silent `PUT`, then "You're up to date."
- **TC-4.6** `failNext("GET /api/party/backup")` → `role="alert"*
  *"Couldn't reach your party. Check your connection and try again."*;
  button back to idle; existing entries still render.
- **TC-4.7** GET rejected `403 BLOCKED` → `role="alert"` exactly *"This
  sync was declined: you've been removed from your party by its
  organizer. Nothing on this device was changed."*; card re-renders to
  Blocked state (TC-4.1).
- **TC-4.8** Same with `410 PARTY_CANCELED` → *"This sync was declined:
  your party was canceled. Nothing on this device was changed."* → card
  re-renders to Canceled state.
- **TC-4.9** Mid-flight (delayed response) → "Syncing…" + spinner +
  `disabled`; `aria-live="polite"` contains "Syncing with your party…".
- **TC-4.10 [QA]** *Gap-fill, AC-3.1.* Render `/data-management`, click
  nothing → `fakeSyncServer` records zero requests.
- **TC-4.11** Existing `singleFileBackup.test.tsx` unmodified still
  passes; additionally: Download/Restore controls unchanged in
  count/order, Sync card sits between "Keep your data safe" and "Danger
  zone" in DOM order.

### PR 5 — Review wizard

- **TC-5.1** Remote has a new entry (Tom), a changed fixed-entry state
  (Sam), a new bucket state, and one entry with no `addedBy` (legacy) →
  4 cards; correct kind badges; "Added by Tom"/"Added by Sam"; legacy
  item shows *"Added anonymously"*; progress "Item 1 of 4".
- **TC-5.2** `Accept` an expense, finish, upload → visible in its
  month's Expenses view after `Done`.
- **TC-5.3** `Reject` an income, finish, upload → absent everywhere
  after `Done`.
- **TC-5.4** `Modify` an expense (amount+description), `Save & accept`,
  finish, upload → edited values (not original) shown on dashboard and
  in `getUploadedBackups()`'s latest entry (EC-5).
- **TC-5.5** `Modify`, edit, then `Cancel` → read-only card, no decision
  recorded (progress count unchanged).
- **TC-5.6** `Accept all` with N remaining → confirm text exactly
  *"Accept the remaining N items without reviewing them individually?"*;
  confirming jumps to summary, all N counted accepted.
- **TC-5.7** `Reject all` → *"Reject the remaining N items without
  reviewing them individually?"*
- **TC-5.8** 8 accepted/1 modified/3 rejected → summary text exactly
  *"8 accepted · 1 modified · 3 rejected"*.
- **TC-5.9** `Upload & finish` success → "Saving…",
  `aria-live="polite"` "Saving your changes…"; on completion
  *"Synced! Your party is up to date."* + single `Done` → navigates to
  `/data-management`.
- **TC-5.10** `failNext("PUT /api/party/backup")` → stays on summary,
  `role="alert"` *"Couldn't save your changes to your party. Check your
  connection and try again."*; button becomes `Retry`; dashboard
  unchanged; `Retry` re-attempts the same staged set without re-review.
- **TC-5.11** Backup version bumped between download and upload (another
  member synced) → `role="alert"` exactly *"Your party synced new
  changes while you were reviewing. Sync again to pick them up — you'll
  review everything fresh, including what you just saw."*; primary
  becomes `Sync again` (discards staged, fresh download+wizard);
  `Cancel review` still returns to `/data-management` untouched.
- **TC-5.12** Mid-review, user blocked or party canceled so final `PUT`
  is rejected → staged decisions discarded, lands on
  `/data-management` with the matching TC-4.7/4.8 banner, not the
  generic connection error.
- **TC-5.13** Sync again right after a completed upload, nothing new →
  "You're up to date.", no wizard.
- **TC-5.14** An item rejected in a completed review; unrelated change
  synced in by a third member; original user syncs again → the
  rejected item never reappears/merges (EC-4), even though still in
  party history.
- **TC-5.15** Decide 2/5 items, navigate away via a bottom-tab link (no
  confirm) → silent success (safe abandonment); next sync re-presents
  all 5 items from scratch, including the 2 already decided.
- **TC-5.16** `Cancel review` → confirm exactly *"Stop reviewing? None
  of your choices in this session will be saved. You can sync again
  anytime."*; "Keep reviewing" leaves wizard state intact; "Stop
  reviewing" returns to `/data-management`, no message.
- **TC-5.17** Same as TC-5.15 via the header account icon instead of the
  tab bar → same silent-abandonment behavior.
- **TC-5.18** Accept/reject through several items → visible "Item N of
  M" updates; `aria-live` node's text equals only the progress string,
  not the full card.
- **TC-5.19** Mount `/sync-review` → focus on `h1`; accept one item →
  focus moves to the new card's container (`tabIndex={-1}`).
- **TC-5.20** Inspect action buttons on a $42.10-expense-by-Tom card →
  `aria-label`s like `"Accept $42.10 expense added by Tom"`, distinct
  per action; visible labels stay short.
- **TC-5.21** One card per kind → badge color/label: Income/`$income`,
  Expense/`$expense`, Fixed Income/`$income`, Fixed Expense/`$expense`,
  Bucket/`$accent`.
- **TC-5.22** Bucket-kind card → shows name + monthly allowance; no
  amount/description/category/date fields.

### PR 6 — Docs + DoD hardening

No new user-facing behavior; obligation is closing gaps this plan and
`TASKS.md`'s own DoD audit surface:
- **TC-6.1 [QA]** Every **[QA]** test above (SC-1.8, TC-1.7, TC-1.11,
  TC-2.2, TC-2.8, TC-2.9, TC-3.6, TC-4.10) exists and passes — if
  deferred instead of added to its originating PR, PR6 must add it.
- **TC-6.2 [QA]** Every PRD §7 DoD checkbox has ≥1 test ID against it
  (cross-check §2); any checkbox with none blocks PR6 sign-off.
- §6 covers the accompanying manual/code checklist, including confirming
  `server/lambda.js`/`storage-s3.js` exist and are documented as not
  CI-exercised (per `TASKS.md`), not silently dropped.

---

## 4. Regression suite

Must stay green **and unmodified** (NFR-3) on every PR:

- `bucketLimitEdits`, `bucketSpentAndRemaining`, `bucketsCarryOn`,
  `bucketsEmptyState`, `categoryBucketCreation`, `dataReading`,
  `entryCreation`, `fixedEntries`, `navigation`, `singleFileBackup`
  (all `.test.tsx`) — zero diffs to these files across all 6 PRs unless
  explicitly justified per NFR-3 ("strictly necessary and directly
  caused by this feature") — treat any such diff as a flagged review
  item, not routine.
- Download Backup / Restore Backup / Clear All Data: identical copy,
  confirms, and replace (not merge) semantics before/after PR4 (TC-4.11).
- A user who never signs up: every route renders, every action works,
  zero sync DOM present (TC-1.6).
- Existing routes unchanged in path/behavior; new routes (`/account`,
  `/sign-up`, `/sign-in`, `/party`, `/party/invite`, `/party/join`,
  `/sync-review`) are additive only.
- `npm run typecheck` and `npm run lint` pass on every PR, not just the
  last one.

---

## 5. Accessibility checks

| # | Check | Pass condition |
|---|---|---|
| A1 | Wizard mount focus | `/sync-review` mount moves focus to `h1` (TC-5.19). |
| A2 | Wizard advance focus | Accept/Reject/Save&accept moves focus to next card container, not page top (TC-5.19). |
| A3 | `role="alert"` on errors | Auth (TC-1.2/1.3), invitation (TC-2.6/2.7/2.8), download/upload failure (TC-4.6/5.10), blocked/canceled (TC-4.7/4.8/5.12), version conflict (TC-5.11). |
| A4 | `role="status"` on confirmations | "You're up to date.", "Signed out…", EC-1 confirmation, wizard success — never `role="alert"`. |
| A5 | `aria-live="polite"` regions | Progress count (TC-5.18), syncing text (TC-4.9), uploading text (TC-5.9), "Copied" (TC-2.3) — the live node itself contains only the short text, not the whole card. |
| A6 | Button accessible names | Header icon `aria-label="Account"`/`"Account: {name}"` (TC-1.10); wizard actions item-specific (TC-5.20). |
| A7 | Disabled-state explanation always rendered | The 5 gating captions (TC-4.1) are in the DOM unconditionally — not a tooltip, not hover/focus-only. |
| A8 | Touch targets | Header icon ≥44×44px; `.btn` height stays ~50px — spot-check computed style in one wizard test, one account test. |
| A9 | Focus rings | Every new interactive element (header icon, Block button, invite Copy buttons, wizard actions, Accept/Reject all, InputDate) has `:focus-visible` styling — verify by selector presence in compiled SCSS during PR6 (jsdom won't render it). |

---

## 6. Post-merge QA execution plan

Run after PR5 (feature-complete) and again after PR6:

1. `npm run typecheck` — zero errors.
2. `npm run lint` — zero errors.
3. `npm run test:server` (`node --test server/`) — all SC-x pass.
4. `npm test -- --testPathPattern="integrationTests" --watchAll=false` —
   all TC-x/UT-4.x pass; all §4 files pass unmodified.
5. **Manual exploratory:**
   - MX-1: `npm run sync-server` — listens on `:4000`, no crash;
     `server/.data/` created and git-ignored (`git status` clean).
   - MX-2: sign up as Jane (profile A), fully close/reopen the browser —
     still logged in (real restart, vs. TC-1.4's re-mount analogue).
   - MX-3: Jane creates a party, invites Tom (profile B), who redeems it;
     Jane blocks Tom; Tom's next sync is rejected live (not stubbed).
   - MX-4: real two-tab CAS race for EC-2 — two tabs download the same
     backup, one uploads first, the other's upload gets a live `409`
     with the conflict copy.
   - MX-5: kill `sync-server` mid-sync (real offline) — "Couldn't reach
     your party" path fires against the real process, not the stub.
6. **Code-level inspection:**
   - `grep -RIn` for the literal invite password and a test user's
     password across `server/.data/` and sync-server stdout from MX-3 —
     zero plaintext hits (AC-1.2, AC-2.4, NFR-2).
   - Open `server/.data/parties/<id>.json` after MX-3, confirm
     `invitations` values are AES-GCM ciphertext, not readable fields.
   - Confirm `server/lambda.js`/`server/storage-s3.js` exist, mirror
     `server/core`'s interface, and are documented as not CI-exercised.
   - Diff `package.json`/`package-lock.json`/`CHANGELOG.md` across all 6
     PRs — version bump + changelog entry present each time, matching
     `TASKS.md` (1.2.0 → 1.6.1).
   - Re-check §2's matrix against the final PRD §7 DoD list — every
     checkbox has a passing test ID; any without one blocks sign-off.
