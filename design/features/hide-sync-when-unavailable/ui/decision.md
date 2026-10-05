---
title: Hide sync when the server is unavailable
summary: While the sync server is offline or not set up, the app stops offering account, party and sync actions; the account chip stays and says why.
status: approved
chosen: b-keep-account-chip
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**b-keep-account-chip.** The app bar never changes shape: the account chip and
its red ring stay, so a user who syncs can see that their session is intact and
why syncing is gone. Every action that needs the server is hidden behind a short
"Sync server is offline" note.

Why the others did not win: **a** removes every sign that the user is signed in
and makes the app bar jump when the server flaps; **c** needs a new Settings
section and a gear variant to explain a state that B already explains where the
user is looking.

## For the implementer

### What changes, by sync state

| Surface | Online / unknown | Offline |
|---|---|---|
| App bar: account chip + status ring | as today | unchanged (red ring) |
| Account, signed in | identity, Party tile, Log out | identity, **status note** (in the Party tile's place, inside the same account card), Log out. **Party tile hidden.** |
| Account, signed out | description, Sign in, Sign up, reassurance | **status note** instead of description + Sign in / Sign up; reassurance kept |
| Data Management, sync card | title, description, **Sync with party** button, caption | title, **status line**, note. **No button and no caption.** |
| `/party`, `/party/invite`, `/party/join`, `/sign-in`, `/sign-up`, `/sync-review` | as today | the **Sync unavailable** screen (below) |
| Log out | works | still works (local only); the session is kept in `localStorage` |

- **Unknown** (before the first health probe answers) behaves as **online**:
  nothing is hidden until the server is known to be offline. The probe is the
  existing `useSyncServerStatus` (`src/components/common/SyncStatusRing/`), so
  it must become shared state (a context or a store value) rather than a hook
  that only the ring reads.
- **Offline** is exactly the ring's `offline` status: the probe failed or
  `navigator.onLine === false`. It can be temporary; the surfaces come back by
  themselves on the next successful probe, with no announcement.
- **Not configured** (no sync server address in the build): hide every sync
  surface for good: no account chip, no status ring, no sync card, and the
  routes above show the Sync unavailable screen. Data Management then looks as
  it did before sync existed (backup, danger zone, Go Back). This state cannot
  be reached by `fixtures.json` (the review build has an address), so it is not
  an approved screen; it is covered by unit tests. The brief assumes an empty
  `REACT_APP_SYNC_API_HOST` means "not configured"; see the PR for how the
  `localhost:4000` fallback is handled.
- A signed-in session is never cleared by being offline.

### Sync unavailable screen

One screen for every sync route that is reached while offline (an old bookmark,
or the server dropping while the user is on Party). A `mk-tile` with the title,
a secondary-text paragraph, and one gold primary **Go to dashboard** that goes
to `/`. No Go Back: the previous page may be another sync screen. It replaces
the page; it does not redirect, so the user keeps their URL and returns to the
real screen by reloading once the server answers.

### Reuse

- `MainContentContainer`, `ContentTileSection`, `ButtonLikeLink`; `.data-section`
  in `DataManagement/styles.scss`; `.account-card` in `Account/styles.scss`.
- Status line: a 0.6rem dot (`$danger`, `0 0 0 3px $danger-soft`) beside a
  semibold label, then the explanation at the same size as the card's other
  descriptions (0.88rem, `$text-secondary`), as drawn. The dot repeats the
  ring's offline look. The mockups reproduce the real screens' structure
  (centred eyebrow title, one account card) so the review diff is meaningful.
- No new token. One new shared component, **Sync server status note** (the
  dot + label + paragraph card), gets a row in `design/system/components.md`.

### New strings (`src/i18n/translations/en.ts` and `es.ts`)

| Key | English | Spanish |
|---|---|---|
| `syncOffline.status` | Sync server is offline | El servidor de sincronización está sin conexión |
| `syncOffline.dataManagementNote` | Syncing comes back by itself once the server answers. Your entries are safe on this device. | La sincronización se reanuda sola en cuanto el servidor responda. Tus movimientos están a salvo en este dispositivo. |
| `syncOffline.accountSignedInNote` | Your party and syncing are hidden until it answers again. You stay signed in. | Tu grupo y la sincronización están ocultos hasta que vuelva a responder. Sigues con la sesión iniciada. |
| `syncOffline.accountSignedOutNote` | Signing in and signing up need the sync server. You can come back here once it answers. | Iniciar sesión y registrarse necesitan el servidor de sincronización. Puedes volver aquí cuando responda. |
| `syncUnavailable.title` | Sync isn't available right now | La sincronización no está disponible ahora |
| `syncUnavailable.message` | This page needs the sync server, and it isn't answering. Everything else works on this device as usual. | Esta página necesita el servidor de sincronización y no responde. Todo lo demás sigue funcionando en este dispositivo como siempre. |
| `syncUnavailable.goToDashboard` | Go to dashboard | Ir al inicio |

Existing strings are reused unchanged: `syncCard.title`, `account.pageTitle`,
`account.logOut`, `account.reassurance`, `dataManagement.*`, `common.goBack`.

### Edge cases

- The status note is a polite `role="status"` region so a screen reader hears it
  when the server drops while the screen is open. Only the transition to
  offline is announced, not the page load.
- Long Spanish text wraps inside the card; nothing is truncated. The user's
  name and email wrap in the Account identity card.
- The Sync card's `/me` refresh must not fire while offline (no request to a
  server known to be down).
- When the server comes back mid-visit, the hidden controls reappear in place.

## Open items

- Empty state: none (no data); the error story is the offline screens above.

## Approved screens

| Screen | State | File |
|---|---|---|
| Data Management | server offline | `approved/data-management.offline.html` |
| Data Management | server offline, Spanish | `approved/data-management.offline-es.html` |
| Account | signed in, server offline | `approved/account.signed-in-offline.html` |
| Account | signed in, server offline, Spanish | `approved/account.signed-in-offline-es.html` |
| Account | signed out, server offline | `approved/account.signed-out-offline.html` |
| Sync unavailable | default | `approved/sync-unavailable.default.html` |
| Sync unavailable | Spanish | `approved/sync-unavailable.es.html` |

Flow: [`flow.json`](flow.json) (generated walkthrough: `flow.html`).
