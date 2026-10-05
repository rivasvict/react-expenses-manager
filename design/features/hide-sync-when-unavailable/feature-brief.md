# Hide sync actions when the sync server is unavailable

## Problem

Several parts of the app need the sync server to work: the account chip and its
status ring in the app bar, **Account** (Sign in / Sign up / Log out), **Party**
(create, invite, join), **Sync review**, and the **Sync with your party** card
on Data Management. Today they are always visible. When the server is offline,
or the app was deployed without one, a user can tap into Sign in or Sync and
only then find out it cannot work. A red ring around the account chip is the
only warning, and it is easy to miss.

## Goal

When the sync server is **offline** or **not configured**, the user is not
offered actions that cannot succeed. The app reads as a complete, local-only
expenses tracker, and nothing the user relies on offline (entries, buckets,
categories, fixed entries, backup and restore, settings) changes.

## Definitions

- **Online**: the health probe (`src/components/common/SyncStatusRing/useSyncServerStatus.ts`)
  answered. Everything shows as it does today.
- **Offline**: a server is configured but the probe failed, or the browser
  reports no connection. This can be temporary; the probe retries every
  minute and when the tab regains focus or the connection returns.
- **Not configured**: the build has no sync server address. Today
  `src/config.js` falls back to `http://localhost:4000`, so this state does not
  exist yet; the implementation would treat an empty
  `REACT_APP_SYNC_API_HOST` as "not configured" and drop that fallback.
- **Unknown**: before the first probe answers (well under a second on a
  healthy server).

## Constraints

- Follow `design/system/README.md`; tokens only, one gold primary per screen.
- Every visible string needs English and Spanish.
- Local data is never touched by this change. A signed-in session stored on
  the device is kept while the server is offline, so the user is still signed
  in when it comes back.
- A status change must not move the screen under the user's finger more than
  it has to (the server can flip between offline and online).

## Out of scope

- Offline queueing of syncs, or retrying a sync automatically.
- Changing how the health probe works or how often it polls.
- The Party, Sign in and Sync review screens themselves when the server is
  online.
