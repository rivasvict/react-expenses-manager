# Feature Brief: Multi-User Sync for the Family Expenses Tracker

This is the source-of-truth brief for the multi-user sync feature. All roles
(PM, Designer, Tech Lead, Contributor, QA) work from this document.

## Objective

Let multiple users collaborate on the expenses tracker without data loss or
collisions, making the app the single source of truth for family finances
(replacing Google Drive spreadsheets). Add cross-device sync.

## Scope

### Accounts

Implement the simplest possible auth (signup/login): lowest cost, secure,
minimal. Accounts identify who added each entry.

### Sync

- `localStorage` is the runtime source of truth.
- Reuse the existing backup system: sync = download the latest backup and
  **merge** it. The existing download/restore keeps its **replace** strategy —
  do not change it.
- Sync is **manual**, triggered by a button, and only allowed if the user
  belongs to a party.
- After downloading the latest backup, show a **wizard** to review each
  incoming entry: accept / reject / modify. Allow skipping review (accept-all
  or reject-all).
- Show who added the entry under review.
- After review, treat the local file as latest and upload it as the new backup.
- Sync entries, fixed entries, **and** buckets.
- Idempotent: already-applied updates are never duplicated.
- When local data is already up to date, notify the user; no further action
  needed.

### Parties (households/families)

- A user belongs to exactly one party.
- Invitations = an encrypted **token + password** (inviter sets the password;
  invitee enters it). Tokens and passwords MUST be encrypted.
- An invitation can be accepted only once.
- The inviter can manage the party: cancel it, add users, block users.

## Suggested Setup

Change this freely if a cheaper, simpler, cleaner, or more cost-effective
approach still meets the requirements.

- **AWS Lambda:** download backups, upload backups, send invitations,
  (optionally) login.
- **AWS S3:** store backups.
- **Database** (MongoDB or similar): store invitation tokens.

Provide a **local implementation** of every third-party dependency so the
whole feature can be spun up and fully tested locally without live AWS.
Clearly document the steps needed to configure the real third-party services.

## Constraints

- Cost-effective.
- No regressions; do not break existing functionality.
- Do not modify existing integration tests unless strictly necessary and
  directly related to this change.
- Add integration tests for the new functionality that do **not** require
  third-party connections. Verify through user-facing interactions, not by
  inspecting `localStorage` or React state (unless strictly necessary).

## Git

- `sync` is the feature branch and the base for **all** PRs. Merge everything
  into `sync`, never `master`.
- PRs may be stacked.
