# Multi-User Sync — Definition of Done Audit (PR 6)

Maps every PRD §7 checkbox and every QA-flagged gap (TEST-PLAN §3,
TC-6.1) to the code/tests that satisfy it. Test files live under
`src/integrationTests/` (jest, UI-driven via `fakeSyncServer`),
`src/helpers/syncMergeHelper/` and `src/redux/expensesManager/` (jest
unit) and `server/test/` (`npm run test:server`, Node built-in runner).

Verdict summary: **20 of 21 PRD §7 checkboxes fully satisfied; 1
(repo-wide lint) partially satisfied** — details in §3. All eight
QA-flagged gap tests exist and pass.

## 1. PRD §7 checkboxes

| # | DoD item | Satisfied by |
|---|---|---|
| 1 | Sign up, log out, log back in; session persists across reload (AC-1.1–1.3) | `accounts.test.tsx`: signup→chip, login + fresh-`renderApp` reload analogue, logout status; `server/test/auth.test.js` lifecycle + token expiry |
| 2 | Entry's creating account shown in the wizard to other members (AC-1.6, 3.4) | `syncWizard.test.tsx` ("Added by Tom" + "Added anonymously" legacy fallback); stamping: `src/redux/expensesManager/attribution.test.js` |
| 3 | Logged-out/party-less user sees sync disabled with explanation; existing features unaffected (AC-1.7, 2.11, NFR-3) | `syncGating.test.tsx` (all five §4.1 captions); `accounts.test.tsx` logged-out spot checks; regression suite files unmodified since PR 1 (git history) |
| 4 | Create party → invitation → second account redeems, becomes member (AC-2.1–2.5) | `party.test.tsx`, `partyJoin.test.tsx`; `server/test/party.test.js` |
| 5 | Re-redeeming fails as "already used" (AC-2.6, EC-8) | `partyJoin.test.tsx` reused-token copy; `server/test/party.test.js` incl. the concurrent-redeem race (exactly one 200) |
| 6 | Wrong invitation password doesn't burn it; retry works (AC-2.5, EC-7) | `partyJoin.test.tsx` wrong-password-then-retry; `server/test/party.test.js` lifecycle |
| 7 | One party per user; no second join/add (AC-2.7/2.8, EC-6) | `partyJoin.test.tsx` defensive EC-6; `party.test.tsx` (no create/join CTAs while in a party); `server/test/party.test.js` EC-6-without-consumption. AC-2.8 "add directly" = the invite flow, per the PM handoff recorded in TASKS.md |
| 8 | Block → member's sync disabled, attempts rejected (AC-2.9, 2.11, EC-9) | `partyManagement.test.tsx`; `syncGating.test.tsx` blocked caption; `syncNoWizard.test.tsx` blocked-mid-flight banner; `server/test/partyManagement.test.js` 403 BLOCKED on backup GET/PUT |
| 9 | Cancel → nobody syncs; no local data deleted (AC-2.10) | `partyManagement.test.tsx` (both views); `syncNoWizard.test.tsx` canceled banner; `server/test/partyManagement.test.js` 410s + block/cancel-mutate-only-the-party-record test |
| 10 | First sync succeeds without a "no backup" error (EC-1) | `syncNoWizard.test.tsx` EC-1 confirmation + upload; `server/test/backup.test.js` create-only CAS |
| 11 | Wizard: correct content/attribution, Accept/Reject/Modify, Accept All/Reject All (AC-3.4, 3.5) | `syncWizard.test.tsx`, `syncWizardBulk.test.tsx` |
| 12 | After review, local = accepted/modified items; becomes the new backup (AC-3.6, 3.8) | `syncWizard.test.tsx` (month view + `getUploadedBackups()` incl. EC-5 modified values) |
| 13 | Nothing new → "already up to date", no wizard (AC-3.3) | `syncNoWizard.test.tsx` identical-states (asserts zero uploads) |
| 14 | Re-sync never re-shows/re-applies accepted or rejected items (AC-3.9, EC-4) | `syncIdempotency.test.tsx` (incl. re-edited-item re-prompt and abandonment semantics) |
| 15 | Entries, fixed entries, buckets reconcile in one sync (AC-3.10) | `syncWizard.test.tsx` mixed-set test; `syncMergeHelper.test.ts` (tombstones, case-insensitive buckets, additive-only) |
| 16 | Offline/failed upload: local untouched, clear error, no partial merge (AC-3.11, EC-3) | `syncNoWizard.test.tsx` download failure; `syncConflict.test.tsx` upload failure + Retry; EC-2 conflict paths in both |
| 17 | Download/Restore/Clear behave identically (AC-3.7, NFR-3) | `singleFileBackup.test.tsx` unmodified and passing since PR 1; the sync card is purely additive in `DataManagement/index.js` |
| 18 | Integration tests pass with no live third-party network calls (NFR-4, NFR-5) | Full suite green; `fakeSyncServer` **throws** on any fetch outside the sync host, so a live call would fail the suite |
| 19 | `npm run typecheck` and `npm run lint` pass | Typecheck: clean. Lint: **partial — see §3.1** |
| 20 | No password/invitation secret in plaintext in storage, logs, or network payloads (NFR-2) | Automated sweep `server/test/secretsSweep.test.js` (full lifecycle on the real fs adapter; greps all files at rest + captured console); `server/test/party.test.js` at-rest test; `auth.test.js` asserts responses carry no plaintext. Secrets travel only in POST bodies; in transit = TLS in prod (DEPLOYMENT.md §3) |
| 21 | Version bumps + CHANGELOG per convention | 1.2.0 → 1.6.1 across PRs 1–6, one Keep-a-Changelog entry each |

## 2. QA-flagged gaps (TEST-PLAN TC-6.1)

| ID | Requirement | Test |
|---|---|---|
| SC-1.8 | Stored user record is scrypt-only, no plaintext | `server/test/auth.test.js` "signup stores no plaintext password" |
| TC-1.7 | `addedBy` stamped on entries created while logged in | `src/redux/expensesManager/attribution.test.js` (the plan's sanctioned storage-level exception) |
| TC-1.11 | Dead token → logged-out fallback, no dead end | `syncHardening.test.tsx` "session expiry degradation" (added in PR 6) |
| TC-2.2 | Dismissed create-party confirm is a no-op | `party.test.tsx` "does nothing when the confirm dialog is dismissed" |
| TC-2.8 | Member force-navigated to `/party/join` → EC-6 copy | `partyJoin.test.tsx` "defensively rejects a join while already in a party" |
| TC-2.9 | Member's `/party` offers no create/join CTAs | `party.test.tsx` member-view test |
| TC-3.6 | Blocking is not retroactive (blocked member's synced entries survive) | `syncHardening.test.tsx` "blocking is not retroactive" (added in PR 6) |
| TC-4.10 | No automatic sync requests | `syncGating.test.tsx` (backup endpoints only on button click) + `syncHardening.test.tsx` strict zero-requests for a logged-out visit (added in PR 6) |

TEST-PLAN §3/PR-6 also requires `server/lambda.js` / `server/storage-s3.js`
to exist and be documented as not CI-exercised: both exist, are
unit-tested with injected doubles (`server/test/cloudAdapters.test.js`),
and are documented in `DEPLOYMENT.md` and `server/README.md`.

## 3. Not (fully) satisfied — honest list

1. **Repo-wide `npm run lint` exits non-zero** (DoD #19, partial): 7
   errors + 8 warnings that **pre-date the feature** (present at the
   `sync` branch point), all in old unit-test files untouched by PRs 1–6
   (`AddEntry/index.test.js`, `EntriesSummary.test.js`,
   `EntrySummaryWithFilter.test.js`, `WithBalance` test, `setupTests.js`,
   plus unused-import warnings in two protected regression test files).
   Every file added or modified by this feature lints clean (verified
   per-PR). Fixing the pre-existing errors means restructuring old tests
   (`no-render-in-setup`, `no-unnecessary-act`) — behavior-affecting
   changes to files NFR-3 tells us not to touch, so they are left as
   tracked repo debt rather than smuggled into this feature.
2. **Cloud adapters not exercised against real AWS** — by design (RFC §1:
   dev/test/CI never touch AWS). The SigV4 signing, CAS header mapping
   and Function-URL event mapping are unit-tested with injected doubles;
   DEPLOYMENT.md §2.5 prescribes the one manual smoke test on first
   deployment.
3. **Minor cosmetic deltas vs the TEST-PLAN's aspirational list** (none
   QA-blocking): badge *colors* aren't asserted (jsdom cannot compute
   SCSS; labels are asserted for Expense/Fixed Expense/Bucket), the
   in-progress state is a `role="status"` text rather than a spinner
   graphic, and the "Signing up…" pending label is implemented but not
   exercised (the fake server responds synchronously).
