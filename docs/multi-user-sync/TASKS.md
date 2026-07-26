# Multi-User Sync — PR Breakdown

Six stacked PRs, based on and merged into `sync` (never `master`). Every
PR leaves the app green — `npm test -- --testPathPattern="integrationTests"`
(existing tests unmodified, NFR-3), `npm run typecheck`, `npm run lint` —
and makes the version bump + `CHANGELOG.md` entry listed per PR. New
frontend code is TS where practical; server code is dep-free plain Node.
AC/EC refs → `PRD.md`; screens/copy → `DESIGN.md`; architecture → `RFC.md`.

---

## PR 1 — Accounts: local sync server (auth), API client, account UI, attribution

**Goal:** a user can sign up, log in/out, and stay logged in across
reloads; entries created while logged in are attributed; nothing changes
for logged-out users.

**Scope**
- `server/`: `core/` (router, HMAC token sign/verify, scrypt, storage
  interface), `storage-fs.js`, `index.js` (`node:http` + CORS), RFC §3
  endpoints 1–3 (`/api/me` returns `party: null` for now), README (local
  run), `npm run sync-server` / `test:server` scripts, gitignored `.data/`.
- `src/services/syncApi/` (+`contract.ts` error codes), `src/services/
  session.ts`, `src/redux/syncManager/` slice, `REACT_APP_SYNC_API_HOST`
  in `src/config.js` + `.env.template`.
- UI (DESIGN §2): header account chip, routes `/account`, `/sign-up`,
  `/sign-in` in `Dashboard`'s `<Switch>` — reuse `FormValidation`/
  `Forms.js` in `MainContentContainer`; dormant `SignIn`/`SignUp`/
  `NoSessionContainer` files untouched.
- Attribution (AC-1.6, RFC §2.3): stamp `addedBy` in `expensesManager`
  action creators (entry / fixed-entry / bucket writes) when logged in.
- `src/integrationTests/helpers/fakeSyncServer.ts` (auth portion);
  `renderApp` accepts an optional logged-in session.

**Out of scope:** parties, invitations, sync, any Data Management change.

**Acceptance criteria:** AC-1.1–1.7 (sync UI itself doesn't exist yet, so
AC-1.4/1.7's "sync disabled" reduces to: no sync affordance anywhere).

**Tests**
- `node --test`: signup/login contract, duplicate email, generic
  wrong-credential body, token expiry.
- New `accounts.test.tsx`: signup→logged-in chip; duplicate-email and
  wrong-password errors (role=alert, generic copy); session survives a
  re-`renderApp` (reload analogue); logout shows "Signed out…" status;
  logged-out app renders all existing screens unchanged.

**Depends on:** — (first PR on `sync`).
**Version:** 1.2.0.

---

## PR 2 — Parties: create, invite, join

**Goal:** an organizer creates a party and generates an invitation
(token + organizer-chosen password); an invitee redeems it exactly once.

**Scope**
- `server/core`: party + invitation endpoints (RFC §3, 4–6), AES-256-GCM
  invitation records, sha256(code) lookup, CAS on `parties/{id}.json`;
  `/api/me` now returns the party.
- Client: `syncApi`/`syncManager` party support; screens `/party`
  (no-party, member, organizer + member list), `/party/invite` (2-step,
  copy buttons, DESIGN 3.4), `/party/join` (DESIGN 3.5, EC-6/7/8 copy);
  organizer-only controls hidden for members (AC-2.12); "Add a member"
  routes to the invite flow (AC-2.8 = invite, per PM handoff).
- `fakeSyncServer`: party/invitations + `seedPartyWithMembers`.

**Out of scope:** block/cancel (PR 3), sync card/wizard.

**Acceptance criteria:** AC-2.1–2.8, EC-6, EC-7, EC-8.

**Tests**
- `node --test`: invitation lifecycle — wrong password not consumed,
  redeem once, second redeem `INVITATION_USED`, already-in-party rejected
  without consuming, no plaintext code/password in stored files.
- New `party.test.tsx`: create party via confirm → organizer view named
  "{Name}'s Party"; generate invitation → code+password shown with
  "Copied" live text; member cannot see organizer controls.
- New `partyJoin.test.tsx`: redeem happy path → member view; wrong
  password error then successful retry on the same code; reused-token
  error.

**Depends on:** PR 1.
**Version:** 1.3.0.

---

## PR 3 — Party management: block & cancel

**Goal:** the organizer can block members and cancel the party; those
states render correctly for the affected users.

**Scope**
- `server/core`: block + cancel endpoints (§3.7–3.8); `BLOCKED` /
  `PARTY_CANCELED` enforcement on the (not-yet-used) backup endpoints so
  PR 4 inherits it.
- Client: Block button + confirm on `MemberRow`, Cancel party + confirm
  (DESIGN 3.2); blocked/canceled `/party` views (DESIGN 3.6); `/me`
  refresh drives `youAreBlocked`/`canceled`.
- `fakeSyncServer`: block/cancel + state transitions.

**Out of scope:** sync UI (the blocked/canceled *sync* messaging lands
with the sync card in PR 4).

**Acceptance criteria:** AC-2.9 (state part), AC-2.10, AC-2.12.

**Tests**
- `node --test`: blocked member 403 on backup GET/PUT; canceled party
  410; non-organizer block/cancel → 403 `NOT_ORGANIZER`.
- New `partyManagement.test.tsx`: block confirm → row shows "Blocked";
  blocked user's `/party` shows removed-from-party view; cancel confirm →
  organizer and member both see canceled view; member view has no
  Block/Cancel controls.

**Depends on:** PR 2.
**Version:** 1.4.0.

---

## PR 4 — Sync engine + Data Management sync card (no-wizard paths)

**Goal:** the merge engine exists and is fully unit-tested; the Sync card
works end-to-end for every path that doesn't need the wizard.

**Scope**
- `src/helpers/syncMergeHelper/` (TS, pure): canonical hash, itemKey,
  diff, apply, snapshot equality, rejection filtering (RFC §4.1–4.2).
- `server/core` + `fakeSyncServer`: backup GET/PUT with `baseVersion` CAS
  (§3.9–3.10), 1 MB limit.
- Client: `sync.state` storage, sync thunk (RFC §4.3 steps 1–3 + 6's
  commit), Sync card on `/data-management` (DESIGN §4.1–4.2): all five
  disabled-state captions, Last synced caption, in-progress state,
  "You're up to date.", EC-1 first-sync confirmation, download-failure
  alert, blocked/canceled rejection banners + card re-render. With
  incoming changes the thunk routes to `/sync-review`, shipped here as a
  minimal "Review changes" placeholder offering only Cancel review
  (discard-and-return, DESIGN's safe-abandonment rule) — nothing is ever
  applied unreviewed.
- Existing Download/Restore/Clear cards byte-identical (AC-3.7).

**Out of scope:** item cards, accept/reject/modify, summary/upload (PR 5).

**Acceptance criteria:** AC-2.11, AC-3.1, AC-3.2, AC-3.3, AC-3.7, AC-3.11
(download side), EC-1, EC-9.

**Tests**
- Unit: syncMergeHelper (identity/hash/diff/apply incl. fixed-entry
  tombstones, bucket case-insensitive keys, additive-only rule).
- New `syncGating.test.tsx`: the five disabled/enabled caption states.
- New `syncNoWizard.test.tsx`: EC-1 first sync uploads + confirmation;
  identical states → "You're up to date.", no upload; local additions +
  unchanged remote → silent upload then up-to-date; download failure
  alert leaves existing entries rendering; blocked/canceled rejection
  banners; cancel-from-placeholder changes nothing.
- Existing `singleFileBackup.test.tsx` passes unmodified.

**Depends on:** PR 3 (state enforcement), PR 1 (client/session).
**Version:** 1.5.0.

---

## PR 5 — Review wizard: accept / reject / modify, staging, CAS upload

**Goal:** the full DESIGN §4.3 wizard — the remaining heart of the feature.

**Scope**
- `/sync-review` (replaces PR 4 stub): `ReviewItemCard` (+attribution,
  "Added anonymously" fallback), `WizardProgress`, Accept/Reject/Modify
  (Modify reuses `Forms.js`/`CategorySelector`, adds `InputDate`),
  Accept All / Reject All confirms, `WizardSummary`, staged-decision
  model (component state only), commit-on-upload-success, retry on
  failure, EC-2 conflict → discard + "Sync again", blocked/canceled
  mid-review handling, rejection memory persisted only on completed
  upload (AC-3.9 + PM handoff), focus management/aria per DESIGN §5.

**Out of scope:** any server change (contract is finished).

**Acceptance criteria:** AC-1.6 (display), AC-3.4, AC-3.5, AC-3.6, AC-3.8,
AC-3.9, AC-3.10, AC-3.11 (upload side), EC-2, EC-3, EC-4, EC-5.

**Tests** (all UI-driven via `fakeSyncServer` seeded as another member)
- `syncWizard.test.tsx`: mixed entry/fixed/bucket incoming set shows
  correct cards, counts, attribution (incl. anonymous fallback); accept →
  visible in month view after finish; reject → absent; modify → edited
  value visible and present in `getUploadedBackups()` (EC-5).
- `syncWizardBulk.test.tsx`: Accept All / Reject All confirms + summary
  counts (AC-3.5).
- `syncIdempotency.test.tsx`: re-sync after completed review → "You're up
  to date."; rejected item never re-shown (EC-4); abandoned review
  re-presents everything next sync.
- `syncConflict.test.tsx`: EC-2 mid-review version bump → conflict alert,
  "Sync again" restarts fresh; upload network failure → error + Retry,
  dashboard data unchanged (EC-3).

**Depends on:** PR 4.
**Version:** 1.6.0.

---

## PR 6 — Cloud deployment docs + DoD hardening sweep

**Goal:** ship the "configure real third-party services" documentation and
close every remaining PRD Definition-of-Done checkbox.

**Scope**
- `server/README.md`: full AWS steps (RFC §7 expanded — bucket, Lambda,
  IAM, env vars, CORS, frontend build config) plus secret generation.
  Adds `server/lambda.js` (Function-URL adapter) and `server/storage-s3.js`
  (dep-free; not exercised by CI, documented as such).
- Sweep: audit that no token/password plaintext appears in logs, storage
  or payloads (grep + targeted `node --test` assertions); a11y pass on
  new screens (focus rings, aria-labels per DESIGN §5); CHANGELOG
  consolidation for the feature.

**Out of scope:** new user-facing behavior.

**Acceptance criteria:** NFR-1–NFR-5 closure; every PRD §7 DoD checkbox
verified and mapped to a test from PRs 1–5 (add any found missing).

**Tests:** only gap-fills discovered by the DoD audit.

**Depends on:** PR 5.
**Version:** 1.6.1.

---

**Cumulative DoD coverage:** accounts (PR 1), invitations/join (PR 2),
block/cancel (PR 3), gating + EC-1/up-to-date/failed-download (PR 4),
wizard/idempotency/EC-2/3/4/5 (PR 5), docs + NFR audit (PR 6).
