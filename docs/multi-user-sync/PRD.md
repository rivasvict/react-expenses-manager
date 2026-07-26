# PRD: Multi-User Sync

Status: Draft for Tech Lead RFC
Source of truth: `feature-brief.md` (this PRD elaborates it; brief wins on conflict)

## 1. Problem & Objective

The app is single-device: all data lives in `localStorage`. Families today
reconcile spending manually via a shared Google Drive spreadsheet — slow,
error-prone, disconnected from the app's categories/buckets.

**Objective:** let a small group of related users (a "party", e.g. a
household) each enter data on their own device and periodically reconcile
into one shared truth via manual, reviewed sync — making the app the
family's source of truth instead of a spreadsheet, with no requirement for
always-on connectivity or a live backend for dev/test.

This evolves the existing single-file backup/restore
(`src/helpers/backupHelper/backupHelper.js`,
`.../DataManagement`), not replaces it: restore-replace keeps working
unmodified; sync adds a second, merge-based path on the same envelope shape
(entries/balance, buckets, categories, fixedEntries).

## 2. Personas

- **Organizer (inviter):** creates the party, invites/adds/blocks members,
  can cancel the party. No elevated data rights — their entries sync like
  anyone else's.
- **Member (invitee):** joins via invitation, adds entries on their own
  device, syncs to reconcile with the party.

The organizer is simply whichever member created the party. Party-management
actions are organizer-only (AC-2.x).

## 3. User Stories & Acceptance Criteria

Numbering: `AC-<section>.<n>`.

### 3.1 Accounts

*As a user, I can sign up and log in, so my entries are attributed to me and
I can join a party.*

- AC-1.1: Signup/login need at minimum email + password. Auth MUST be the
  simplest secure mechanism that satisfies these ACs — no MFA/OAuth/email
  verification unless the RFC finds one necessary for security at
  negligible extra cost.
- AC-1.2: Passwords are never stored or transmitted in plaintext.
- AC-1.3: Login persists the session across reloads and browser restarts
  until explicit logout or session expiry.
- AC-1.4: Logout disables sync and stops entry attribution to that account
  until logging back in.
- AC-1.5: Duplicate-email signup and wrong-credential login are rejected
  with clear errors; login errors don't reveal whether the email exists.
- AC-1.6: Every entry created while logged in records which account added
  it — this is what the review wizard displays (AC-3.4).
- AC-1.7: Fully logged-out use works exactly as today; sync UI is
  hidden/disabled when logged out.

### 3.2 Parties

*As an organizer, I can create a party and invite family members so we can
later sync a shared view of our finances.*

- AC-2.1: A logged-in user with no party can create exactly one party and
  becomes its organizer.
- AC-2.2: A user belongs to **at most one** party. UI never offers to
  join/create a second while already in one.
- AC-2.3: Organizer generates an invitation: a token + an organizer-chosen
  password, delivered out-of-band.
- AC-2.4: Invitation token and password MUST be encrypted wherever stored
  or transmitted — never persisted/logged in plaintext.
- AC-2.5: Invitee redeems with token + password. Wrong password: rejected
  with a clear error; invitation stays usable for a later correct attempt
  (does not burn single-use).
- AC-2.6: A successfully redeemed invitation becomes permanently invalid.
  Any later redemption attempt (right or wrong password) is rejected as
  "already used."
- AC-2.7: Redemption adds the invitee as a member. If the invitee already
  belongs to any party, redemption is rejected, not switched/double-joined
  (EC-6).
- AC-2.8: Organizer can also add a user directly (no token needed); same
  one-party-per-user constraint applies.
- AC-2.9: Organizer can block a member. A blocked member immediately loses
  sync ability (AC-2.11); entries they already contributed to a prior
  synced backup are not retroactively removed.
- AC-2.10: Organizer can cancel the party. No member can sync against it
  afterward; no member's local data is touched.
- AC-2.11: Sync is usable only by a logged-in user who belongs to a party
  and is not blocked in it. Any other state disables the sync button with
  an explanatory message (not silently hidden).
- AC-2.12: Invite/add/block/cancel controls are visible only to the
  organizer.

### 3.3 Sync

*As a party member, I can pull in and reconcile the party's shared data with
mine, entry by entry, so we stay in sync without losing anyone's edits.*

- AC-3.1: Sync is a manual, explicit user action (button), gated by
  AC-2.11. No automatic/background sync.
- AC-3.2: Sync downloads the party's latest backup (same envelope shape as
  `buildBackupEnvelope`, each item now also carrying its contributing
  account) and diffs it against local data.
- AC-3.3: If the download has nothing new relative to what was already
  synced, show "already up to date" and skip the wizard (also applies to
  the no-remote-backup-yet case producing no diff, EC-1).
- AC-3.4: When there are incoming differences, a review wizard presents
  each changed/new item (entry, fixed entry, or bucket), showing its
  content, who added/changed it, and three actions: **Accept**, **Reject**,
  **Modify** (edit before accepting).
- AC-3.5: Wizard offers **Accept All** / **Reject All** shortcuts for all
  remaining unreviewed items.
- AC-3.6: Accept merges the item locally; Reject discards it (this and all
  future syncs, AC-3.9); Modify lets the user edit the incoming value
  before it's merged as accepted.
- AC-3.7: The existing Restore flow (whole-state replace) is completely
  unmodified — sync is an additive, separate path. Download Backup /
  Restore Backup / Clear All Data behave exactly as before.
- AC-3.8: After review completes (including via Accept/Reject All), the
  resulting local state is uploaded as the party's new latest backup.
- AC-3.9: Sync is idempotent: an item already present locally (own or
  previously synced) is never re-shown or duplicated; an item the user
  previously rejected never reappears in a later wizard and is never
  merged in, even though it's still in the party's backup history (EC-4).
- AC-3.10: Sync covers entries (incomes/expenses), fixed entries, and
  buckets. Categories travel with entries/buckets as today.
- AC-3.11: A failed download or upload (e.g. offline) leaves local data
  completely untouched, surfaces a clear error, and never partially
  applies a merge (EC-3).

## 4. Edge Cases

- **EC-1 First sync, no remote backup yet:** upload local state as the
  initial party backup (wizard skipped, or shown pre-accepted) — confirmed
  to the user, never an error.
- **EC-2 Concurrent syncs by two members:** no member's already-accepted
  entry may ever be silently lost. Last-write-wins upload is NOT
  acceptable on its own; RFC must pick either a version/conflict check
  that forces re-sync before upload, or an append-only history reconciled
  on download.
- **EC-3 Offline/failed upload:** AC-3.11.
- **EC-4 Rejected entries reappearing:** AC-3.9 — permanent per (user,
  item), never re-prompts.
- **EC-5 Modify-then-sync-back:** the modified value (not the original
  incoming one) is what's merged locally and re-uploaded (AC-3.6, 3.8); the
  next syncer sees the modified value as current.
- **EC-6 Invitee already in a party:** AC-2.7 — rejected, invitation NOT
  consumed.
- **EC-7 Wrong invitation password:** AC-2.5 — rejected, invitation stays
  valid for retry.
- **EC-8 Reused invitation token:** AC-2.6 — permanently rejected.
- **EC-9 Blocked user attempting sync:** AC-2.9/2.11 — rejected, no
  download/upload occurs.

## 5. Non-Functional Requirements

- **NFR-1 Cost:** cost-effective at small-family scale (few users,
  infrequent manual syncs); prefer pay-per-use/free-tier over always-on
  infra. Suggested Lambda/S3/DB are illustrative, not mandatory.
- **NFR-2 Security:** invitation token + password encrypted at rest and in
  transit (AC-2.4); user passwords never stored/logged in plaintext
  (AC-1.2).
- **NFR-3 No regressions:** every existing feature keeps working unchanged
  for a user who never signs up or joins a party; existing integration
  tests keep passing without modification unless strictly necessary and
  directly caused by this feature.
- **NFR-4 Local dev/test:** the whole feature (accounts, parties,
  invitations, sync) must be runnable and testable fully locally, no live
  AWS or paid third-party service required; production third-party
  services need a documented local stand-in.
- **NFR-5 Test approach:** new integration tests exercise user-visible
  behavior (screen text/roles/buttons), not Redux state or `localStorage`
  directly, and need no network access to a live third-party service.

## 6. Out of Scope

- Automatic/background sync.
- Real-time/live collaboration.
- Belonging to more than one party at once.
- Conflict resolution beyond the review wizard (accept/reject/modify).
- Any change to the existing Restore's replace semantics.
- Organizer-ownership transfer, deleting a member's history, or editing
  party metadata beyond create/cancel/add/block.
- Notifications that a party backup changed — user only learns by syncing.

## 7. Definition of Done

- [ ] Sign up, log out, log back in; session persists across reload
      (AC-1.1–1.3).
- [ ] Entry's creating account is shown in the review wizard to other
      members (AC-1.6, 3.4).
- [ ] Logged-out/party-less user sees sync disabled with an explanation;
      all existing features unaffected (AC-1.7, 2.11, NFR-3).
- [ ] Organizer creates a party, generates an invitation, a second account
      redeems it and becomes a member (AC-2.1–2.5).
- [ ] Re-redeeming the same invitation fails as "already used" (AC-2.6,
      EC-8).
- [ ] Wrong invitation password fails without burning it; correct retry on
      the same token still works (AC-2.5, EC-7).
- [ ] A user already in a party cannot redeem another invitation or be
      added to a second party (AC-2.7/2.8, EC-6).
- [ ] Organizer blocks a member; that member's sync becomes disabled and a
      sync attempt is rejected (AC-2.9, 2.11, EC-9).
- [ ] Organizer cancels the party; no member can sync afterward; no local
      data is deleted (AC-2.10).
- [ ] First sync for a new party succeeds without a "no backup" error
      (EC-1).
- [ ] Sync with incoming changes opens the wizard with correct content and
      attribution, working Accept/Reject/Modify and Accept All/Reject All
      (AC-3.4, 3.5).
- [ ] After review, local state = accepted/modified items only; this
      becomes the new party backup (AC-3.6, 3.8).
- [ ] Sync with nothing new shows "already up to date," no wizard (AC-3.3).
- [ ] Re-syncing never re-shows or re-applies already-accepted or
      already-rejected items (AC-3.9, EC-4).
- [ ] Entries, fixed entries, and buckets all reconcile in one sync
      (AC-3.10).
- [ ] Simulated offline/failed upload leaves local data untouched, shows a
      clear error, no partial merge (AC-3.11, EC-3).
- [ ] Existing Download Backup / Restore Backup / Clear All Data behave
      identically to before (AC-3.7, NFR-3).
- [ ] `npm test -- --testPathPattern="integrationTests"` passes, including
      new tests, with no live third-party network calls (NFR-4, NFR-5).
- [ ] `npm run typecheck` and `npm run lint` pass.
- [ ] No password or invitation token/password appears in plaintext in
      storage, logs, or network payloads (NFR-2).
- [ ] `package.json`/`package-lock.json` version bumped, `CHANGELOG.md`
      updated per repo convention.

## 8. Open Questions for Tech Lead RFC

- Exact conflict/versioning mechanism for EC-2.
- Whether invitations are party-scoped or bound to an invited email.
- Session/token expiry policy for AC-1.3.
- Local stand-ins for Lambda/S3/DB per NFR-4.
