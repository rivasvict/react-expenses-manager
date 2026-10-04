---
title: Hide sync when the server is unavailable
summary: Three ways to stop offering account, party and sync actions while the sync server is offline or not set up.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Nothing is chosen yet.

What the options agree on:

- **Online** looks exactly as it does today in all three.
- **Not configured** (no sync server address in the build) hides every sync
  surface for good: no account chip, no status ring, no sync card, and the
  `/account`, `/sign-in`, `/sign-up`, `/party*` and `/sync-review` routes
  send the user to the dashboard. Options differ only in what they say about it.
- Backup, restore, Settings and all money screens never change.

## Options considered

### a-hide-everything: the app becomes local-only

Offline is treated like not configured: the account chip and its ring leave the
app bar, the sync card leaves Data Management, and the sync routes are
unreachable. A user who arrives through an old link or bookmark (or is on
Party when the server drops) sees a one-card "Sync isn't available right
now" screen with **Go to dashboard**.

- **Good at:** the cleanest result. Nothing on screen can fail, and the user
  never has to learn what a sync server is.
- **Costs:** a signed-in user loses every sign that they are signed in, and
  cannot log out while the server is down. When the server flaps, the chip
  appears and disappears in the app bar. Unknown is treated as offline, so the
  chip fades in after the first probe on a healthy server. Least code:
  one "is sync available" selector applied to four places, plus one screen.

### b-keep-account-chip: show who you are, hide what can't work

The account chip stays in the app bar with its red ring, so the bar never
changes shape. Behind it, every action that needs the server is hidden:
Account keeps the identity card and **Log out** (local only) but drops the
Party tile, and the signed-out view drops **Sign in / Sign up** for a short
"Sync server is offline" note. The sync card on Data Management shrinks to
its title and a status line, with no button.

- **Good at:** the most honest one. Users who sync know their session is
  intact and why sync is gone; nothing jumps in the app bar.
- **Costs:** the sync surfaces are still there, only emptier, so a user who
  never syncs still sees a red ring. Most copy: three new status messages
  (EN and ES). Party and Sync review still need a fallback for a server that
  drops mid-visit (same screen as option A).

### c-status-in-settings: one place to find out

Sync surfaces are hidden as in option A, but the app says so in one place:
Settings gains a **Sync server** section with the status (Offline / Not set
up), a sentence on what is hidden, and **Check again** (re-runs the probe).
The settings gear gets a small red dot while the server is offline, so a
user who wonders where Sync went has somewhere to look. The red ring on the
account chip goes away, since the chip is not shown when it would be red.

- **Good at:** a clean app bar and money screens, with an answer for the
  user who expected sync, and one natural home for the "not set up" state.
- **Costs:** a new Settings section and a status dot on the gear (a new
  variant of an existing chip, to add to `design/system/components.md`). A
  signed-in user still cannot log out while offline. **Check again** adds a
  manual way to call the health probe.

## Recommendation

**c-status-in-settings.** It hides everything that cannot work, as the brief
asks, and still answers "where did sync go?" without leaving a red mark on
every screen. If staying visibly signed in matters more than a clean app
bar, **b** is the better fit.

## Open questions for the approved design

- Unknown state: hide sync surfaces until the first probe says online
  (A and C), or show them until it says offline (B)?
- Should leaving the offline state be announced (a polite status line), or
  should the chip and card simply reappear?
- Empty and error stories: the error story is the offline screens above; there
  is no data to be empty.
