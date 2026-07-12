# Design Spec: Multi-User Sync

Status: Ready for Tech Lead review
Inputs: `PRD.md` (AC/EC refs below), `feature-brief.md`, existing design system
(`src/variables.scss`, `Header`, `DataManagement`, `MainContentContainer`,
`Forms.js`, `EntryForm`, `Buckets`, dormant `SignIn`/`SignUp`).

Tone: plain and reassuring, matching existing copy ("Keep your data safe",
"This cannot be undone"). No new colors, radii, or shadows — every screen
below is built from tokens already in `variables.scss`.

## 1. Information architecture

**Decision: no new bottom-tab item.** The tab bar is already full (Home,
Categories, Buckets, Fixed Entries, Data) and AC-1.7/NFR-3 require the app to
stay fully usable without ever touching this feature — it shouldn't tax the
primary nav for users who never sign up.

- **Account entry point:** a small circular icon-button added to
  `app-header__bar` (the row that already holds the brand/logo), right-aligned
  via the existing `justify-content: space-between`. It is present at every
  viewport, independent of the bottom tab bar's breakpoint collapse. Shows a
  generic account glyph when logged out, or the user's initials in an
  `$accent-soft` chip when logged in. Route: `/account`.
- **Party** is reached from `/account` (you need an account before a party
  makes sense) — not a nav item of its own.
- **Sync** lives on the existing Data Management screen (`/data-management`),
  as a new card between "Keep your data safe" and "Danger zone" — sync is
  another way of keeping data safe, so it reads as a natural extension of
  that screen rather than a new destination. The review wizard is a full
  screen the Sync button pushes to: `/sync-review`.

Routes (all mounted inside `Dashboard`'s existing `<Switch>`, so `Header` and
the nav stay visible everywhere, exactly like `/data-management` today):

| Route | Screen |
|---|---|
| `/account` | Account hub (logged-out or logged-in view) |
| `/sign-up` | Sign Up form |
| `/sign-in` | Sign In form |
| `/party` | Party hub (no-party / member / organizer / canceled / blocked views) |
| `/party/invite` | Organizer: generate invitation |
| `/party/join` | Invitee: redeem invitation |
| `/data-management` | unchanged, +Sync card (AC-3.7) |
| `/sync-review` | Review wizard |

Nothing here gates any existing route. `AuthenticatedApp` stays commented out;
`WithBalance` keeps loading entries directly regardless of session state.

## 2. Auth screens

Decision: **retire the standalone `NoSessionContainer`/`Lobby` full-page
takeover pattern for this feature.** That pattern assumes auth gates the
whole app; here auth is optional and additive, so Sign Up/Sign In should look
like every other in-app screen (`MainContentContainer` + `Forms.js`), not a
separate unthemed shell. Reuse `SignIn`/`SignUp`'s validation logic
(`FormValidation`/`FormModel`/`ValidateField`) as-is; replace their JSX
wrapper.

### 2.1 `/account` — logged out

```
┌ Account ─────────────────────────┐
│ Sign in to sync your entries      │
│ across devices with your party.   │
│ [        Sign in        ] primary │
│ [        Sign up      ] secondary │
│ Everything still works without    │
│ an account — this is only needed  │
│ for syncing with a party.         │
└────────────────────────────────────┘
```
`MainContentContainer pageTitle="Account"`, one `ContentTileSection`-style
static card holding the two `FormButton`s (`btn-primary` / `btn-secondary`),
plus a `text-secondary` reassurance line (AC-1.7).

### 2.2 `/sign-up`, `/sign-in`

Same fields/validation as today's `SignUp.js`/`SignIn.js`, wrapped in
`MainContentContainer pageTitle="Sign up"` / `"Sign in"` instead of
`NoSessionContainer`. Submit = `FormButton variant="primary"`, disabled
until `formState.isModelValid` (existing pattern). Add a `Cancel` /
`Button variant="secondary"` that calls `history.goBack()` (matches
`EditBucket`/`DataManagement`).

States:
- **Loading:** submit button label becomes "Signing up…" / "Signing in…",
  `disabled` (reuse `SignUp`'s existing `isLoading` ternary; add the same to
  `SignIn`).
- **Errors** (AC-1.5), rendered as a `role="alert"` paragraph above the
  submit button, same class as `restore-backup-error`:
  - Duplicate email: *"An account with this email already exists. Try
    signing in instead."* with a `Sign in` text link.
  - Wrong credentials: *"Email or password is incorrect."* — deliberately
    generic, never says which field was wrong (AC-1.5).
- Sign Up's `Cancel` and Sign In's implicit dead-end both return to
  `/account`.

### 2.3 `/account` — logged in

```
┌ Account ─────────────────────────┐
│  (JD)  Jane Doe                   │
│        jane@example.com           │
│ [        Party         ] →        │
│ [       Log out       ] secondary │
└────────────────────────────────────┘
```
`(JD)` = initials chip (`$accent-soft` bg, `$accent` text, same shape as the
header icon). "Party" row is a `ContentTileSection to="/party"` (chevron
affordance, reused as-is). Logout: `Button variant="secondary"`, no confirm
dialog (reversible, low-stakes) — on success, re-render the logged-out view
of the same screen with a transient `role="status"` line: *"Signed out. Your
data stays on this device."* (AC-1.4).

## 3. Party screens

### 3.1 `/party` — no party yet (logged in)

```
┌ Party ───────────────────────────┐
│ Create a party                    │
│ Start a party to sync entries     │
│ with family members.              │
│ [   Create a party   ] primary    │
│ Join a party                      │
│ Have an invitation code? Join     │
│ the party that invited you.       │
│ [   Join a party    ] secondary   │
└────────────────────────────────────┘
```
Two `.data-section`-style cards (reusing `DataManagement`'s
`@include card()` block), matching its "explanatory text above a button"
shape exactly.

- **Create a party** (AC-2.1) needs no input — reuse the `window.confirm`
  pattern already used by "Clear all data": *"Create a party? You'll become
  its organizer and can invite family members."* [OK/Cancel]. On confirm,
  the party is created and the screen re-renders as 3.2. The party is
  labeled for display only as *"{first name}'s Party"* — no name field, no
  extra step.
- **Join a party** routes to `/party/join` (3.4).

### 3.2 `/party` — organizer view

```
┌ Party ───────────────────────────┐
│ Jane's Party            Organizer │
├────────────────────────────────────┤
│ Jane Doe (you)          Organizer │
│ Tom Doe                  [Block]  │
│ Sam Doe                 Blocked   │
├────────────────────────────────────┤
│ [   Add a member    ] primary     │
│ [   Cancel party    ] danger      │
└────────────────────────────────────┘
```
Member list = stacked rows (new `MemberRow`, styled like `Bucket`'s row but
static, no `RowLink` navigation): name/email, and a right-aligned status —
`Organizer` badge (`$accent` text, no background) for the creator, a
`Block` button (`Button variant="secondary"`, AC-2.9) for active members
other than self, or a muted `Blocked` label for already-blocked ones (no
un-block affordance — out of scope). Clicking `Block` uses the same confirm
pattern: *"Block Tom Doe? They'll immediately lose the ability to sync.
Entries they've already contributed stay in the party's history."*

Bottom actions, **organizer-only** (AC-2.12): `Add a member` → `/party/invite`
(this is also the "add user directly" action — AC-2.8 and invite are the
same flow, since both end in an out-of-band token+password); `Cancel party`
→ `Button variant="danger"`, confirm: *"Cancel Jane's Party? No member will
be able to sync afterward. Nobody's local data is deleted."* (AC-2.10).

**Empty state** (organizer, no members yet): the list shows only the
organizer's own row, plus a `text-secondary` line under it: *"Invite family
members to start syncing."* No new illustration asset — text + existing
icon only, unlike `Buckets`' empty state which already had bespoke art.

### 3.3 `/party` — member (non-organizer) view

Same member list, read-only (no `Block` buttons, no bottom actions — AC-2.12).
Add one `text-secondary` line at the bottom: *"Only Jane, the organizer, can
add or remove members."*

### 3.4 `/party/invite` — organizer generates an invitation

```
Step 1                          Step 2 (same route, state swap)
┌ Add a member ──────┐          ┌ Add a member ────────────────┐
│ Set an invitation   │          │ Invitation ready              │
│ password             │  ───▶   │ Code  [ K7X9-QP2M   ] [Copy]  │
│ [ ......... ] pwd    │          │ Pwd   [ •••••••••••  ] [Copy] │
│ [Generate invite]    │          │ Share code & password over    │
└──────────────────────┘          │ different channels.           │
                                   │ [        Done       ]secondary│
                                   └────────────────────────────────┘
```
Step 1: a single `InputPassword` (organizer chooses it, AC-2.3), `FormButton`
"Generate invitation". Step 2: the token renders as a short uppercase code
(monospace `InputText readOnly`) next to a `Copy` icon button
(`codicon:copy`); same for the password (masked, `codicon:eye` reveal toggle,
`InputPassword`'s existing type). Tapping `Copy` shows a 2-second inline
*"Copied"* confirmation (`aria-live="polite"` — no toast primitive exists in
the app, so this avoids introducing one). `Done` returns to `/party`. Nothing
here is ever logged; token/password only exist in component state and the
encrypted invitation record (AC-2.4/NFR-2).

### 3.5 `/party/join` — invitee redeems an invitation

```
┌ Join a party ────────────────────┐
│ [ Invitation code    ] text       │
│ [ Password            ] password  │
│ [        Join         ] primary   │
│ [       Cancel       ] secondary  │
└────────────────────────────────────┘
```
Same `FormValidation`/`Forms.js` shape as Sign In. Submit disabled until both
fields are non-empty. Errors, `role="alert"`, invitation-specific and never
technical:
- Wrong password (EC-7): *"That password doesn't match this invitation.
  Double-check it with whoever invited you and try again."* — code/password
  fields stay filled so the user can retry immediately; the invitation is
  **not** burned (AC-2.5).
- Reused token (EC-8): *"This invitation has already been used. Ask the
  organizer to send you a new one."*
- Already in a party (EC-6): normally unreachable — AC-2.2 means `/party`
  never offers this route to a member — but kept as a defensive message for
  a stale tab: *"You already belong to a party. Refresh to see it."*

On success: redirect to `/party` (now rendering the member view, 3.3).

### 3.6 Blocked / canceled-party views

Both reuse the no-party CTA layout from 3.1 (no member list) — being blocked
or losing a canceled party both leave the user free to create/join
elsewhere:
- Blocked: *"You've been removed from this party by its organizer."*
- Canceled: *"Your party was canceled. Create or join a new one to sync
  again."*

## 4. Sync flow (`/data-management`)

New card, same shape/order as the existing two `.data-section` cards:

```
┌ Data Management ─────────────────┐
│ Keep your data safe   (existing)  │
│ ...                                │
├────────────────────────────────────┤
│ Sync with your party               │
│ Pull in what your family added,    │
│ review it, then merge it in.       │
│ [    Sync with party   ] primary   │
│ Last synced: 3 days ago            │  ← or "Never synced yet"
├────────────────────────────────────┤
│ Danger zone            (existing)  │
└────────────────────────────────────┘
```

### 4.1 Button enabled/disabled logic (AC-2.11)

The button uses a native `disabled` attribute (same pattern as `SignIn`'s
`disabled={!formState.isModelValid}`) so it's visually inert, but the
explanatory copy is a **permanent, always-rendered `text-secondary`
paragraph directly under the button** — never a tooltip or hover-only
hint — so it reaches screen readers regardless of the button's focus state
("not silently hidden", AC-2.11):

| State | Copy under the button |
|---|---|
| Logged out | "Sign in and join a party to sync your entries across devices." |
| Logged in, no party | "Create or join a party to start syncing." |
| Party canceled | "Your party was canceled. Create or join a new one to sync again." |
| Blocked (AC-2.9/EC-9) | "You've been removed from your party by its organizer. Sync is unavailable." |
| Enabled | "Last synced: {relative date}" / "Never synced yet" (not a warning — muted caption) |

### 4.2 Sync button states

- **Idle/enabled:** "Sync with party".
- **In progress:** label → "Syncing…", spinner, `disabled`,
  `aria-live="polite"` region announces "Syncing with your party…".
- **Nothing new (AC-3.3):** inline `role="status"` banner appears under the
  card, button returns to idle: *"You're up to date."*
- **First sync for the party, no remote backup yet (EC-1):** local state
  uploads automatically as the initial backup, wizard skipped, distinct
  confirmation (still success, never framed as an error): *"This is the
  first sync for your party. Your data is now the starting point — future
  syncs will compare against it."*
- **Incoming changes:** navigates to `/sync-review`.
- **Download failed:** `role="alert"` banner: *"Couldn't reach your party.
  Check your connection and try again."* Button re-enabled, label back to
  "Sync with party" (AC-3.11 — nothing local touched, so simple retry).

### 4.3 The review wizard (`/sync-review`)

**Staging model (resolves AC-3.6 vs AC-3.11):** decisions made while
reviewing (accept/reject/modify) are held in the wizard's local state only.
Nothing is written to real `localStorage` until the final upload succeeds
(4.3.4). This makes "nothing applied until review completes," mid-wizard
cancel, and "failed upload leaves local data untouched" all the same simple
rule instead of three special cases — worth the Tech Lead confirming the
sync engine can expose a staged/dry-run merge this way.

Because nothing is committed until upload succeeds, **the bottom tab bar and
header stay interactive during the wizard**: navigating away mid-review is
always a safe, silent abandonment (equivalent to Cancel, just without the
confirmation prompt). The in-wizard "Cancel review" control below exists
only to make that abandonment a deliberate, confirmed choice so users don't
lose review progress by accident.

#### 4.3.1 Item card — one item at a time (AC-3.4)

```
┌ Review changes ───────────────────┐
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  Item 3 of 12 │
│ [Accept all]          [Reject all] │
├─────────────────────────────────────┤
│ ● Expense            Added by Tom  │
│  $42.10                            │
│  Groceries                         │
│  Household, eating out             │
│  Jul 10, 2026                      │
│ [ Accept ]  [ Modify ]  [ Reject ] │
└─────────────────────────────────────┘
```
- Progress: native `<progress>` (same element `Bucket` already uses) plus
  visible text "Item 3 of 12"; the *text* (not the bar) sits in an
  `aria-live="polite"` region so screen readers hear only the count change,
  not the whole card re-read on every advance.
- Kind badge: small dot + label — "Income"/"Expense"/"Fixed Income"/"Fixed
  Expense"/"Bucket" — colored with `$income`/`$expense`/`$accent`
  respectively (reuses existing semantic colors, no new ones).
- Attribution: *"Added by {first name}"*, right-aligned, `text-secondary`
  (AC-1.6/3.4).
- Body fields: amount (colored `$income`/`$expense` like every other money
  row in the app), description, category path pretty-printed (split on the
  `,` segments, e.g. `Household, eating out`), date formatted `MMM D, YYYY`
  (`dayjs`, same library already used in `helpers/date.js`). A bucket item
  shows its name + monthly allowance instead of the four entry fields.
- Actions: `Accept` (`btn-primary`), `Modify` (`btn-secondary`), `Reject`
  (styled like the existing `.btn.btn-danger` — transparent bg, rose border,
  since it's a common, not scary, action). Each gets a full accessible name,
  e.g. `aria-label="Accept $42.10 expense added by Tom"`, so the visible
  short labels stay clean for sighted users while screen-reader users get
  the specific item.
- Choosing any action auto-advances to the next item and moves DOM focus to
  the new card's container (`tabIndex={-1}` + `.focus()`), so the next
  card's content is read in natural order without relying solely on the
  `aria-live` progress text.

#### 4.3.2 Modify (AC-3.6, EC-5)

Tapping `Modify` swaps the card body in place (no navigation) for the same
field set `EntryForm` already uses — `InputNumber` (amount), `InputText`
(description), `CategorySelector` (category) — plus one genuinely new field,
a plain `InputDate` (native `type="date"`, styled like the other `Forms.js`
inputs; no date picker exists in the app today and a native input is the
smallest addition that fits). Actions become `Save & accept` (primary) /
`Cancel` (secondary, discards the edit and returns to the read-only card
without recording a decision). Saving records the item as **accepted with
the edited values** — the modified value, not the original, is what's staged
(EC-5).

#### 4.3.3 Accept all / Reject all (AC-3.5)

Two small secondary text buttons pinned under the progress bar, always
visible, acting on *all remaining unreviewed items* (not the whole set —
already-decided items are untouched). Both reuse the `window.confirm`
pattern:
- *"Accept the remaining 9 items without reviewing them individually?"*
- *"Reject the remaining 9 items without reviewing them individually?"*

Confirming jumps straight to the summary (4.3.4).

#### 4.3.4 Summary → upload → success

```
┌ Review complete ─────────────────┐
│ 8 accepted · 1 modified · 3       │
│ rejected                          │
│ [   Upload & finish   ] primary   │
│ [   Cancel review    ] secondary  │
└────────────────────────────────────┘
```
Reached after the last item or after Accept/Reject All. `Upload & finish`
commits the staged merge to `localStorage` and uploads it as the party's new
backup in one step (AC-3.8):
- **Uploading:** button → "Saving…", disabled, `aria-live="polite"`
  announces "Saving your changes…".
- **Success:** screen swaps to *"Synced! Your party is up to date."* with a
  single `Done` button (`FormButton variant="primary"`) → `/data-management`.
  No auto-redirect — explicit `Done` keeps the confirmation on screen long
  enough to read, matching how `Restore Backup` pushes `history.push("/")`
  only after its own async step resolves, not eagerly.
- **Upload failed (AC-3.11/EC-3):** stays on the summary screen, adds a
  `role="alert"` line above the buttons: *"Couldn't save your changes to
  your party. Check your connection and try again."* `Upload & finish`
  becomes `Retry` — it re-attempts the same staged decision set without
  re-running review. Local data is untouched (nothing was committed pre-
  upload, per the staging model above).

**Cancel review** (available on the summary, and as a smaller text link on
every item card): confirm dialog — *"Stop reviewing? None of your choices in
this session will be saved. You can sync again anytime."* [Stop
reviewing/Keep reviewing]. Confirming discards all staged decisions and
returns to `/data-management` with no message (there's nothing to report —
local state never changed). A later sync re-downloads and re-presents every
still-outstanding item from scratch.

## 5. Accessibility summary

- **Focus management:** wizard route mount → focus the screen `h1`. Each item
  advance (accept/reject/save-and-accept) → focus the next card container.
- **`aria-live="polite"`:** progress count text, sync-in-progress/uploading
  status text, "Copied" confirmations on the invite screen.
- **`role="alert"`:** every error state (auth, invitation, download/upload
  failure) — reuses the exact `restore-backup-error` class/role already in
  `DataManagement`.
- **`role="status"`:** non-error confirmations ("You're up to date.",
  "Signed out.", first-sync confirmation) — announced without interrupting.
- **Button names:** header account icon gets `aria-label="Account"` (logged
  out) / `"Account: Jane Doe"` (logged in), matching how `Header`'s nav items
  already carry explicit `aria-label`s. Wizard actions get item-specific
  `aria-label`s (4.3.1).
- **Contrast/touch targets:** no new colors — every pairing above reuses
  `$text-primary`/`$text-secondary`/`$danger`/`$income`/`$expense` on
  `$bg-raised`, all already validated. Buttons keep the existing `.btn` 3.1em
  height (~50px); the new header icon button gets a 44×44px hit area.
- **Focus rings:** every new interactive element gets `@include
  focus-ring()`, no exceptions.

## 6. Component mapping

| Screen | Reused | New |
|---|---|---|
| Header account icon | `app-header__bar` layout, `focus-ring` mixin | icon-button + initials chip (`Header.js`/`.scss`) |
| Account hub | `MainContentContainer`, `ContentTileSection`, `FormButton` | — |
| Sign up / Sign in | `SignIn`/`SignUp`'s existing logic, `Forms.js`, `FormValidation` | swap `NoSessionContainer` wrapper for `MainContentContainer` |
| Party hub / detail | `.data-section` card (`DataManagement`), `window.confirm` pattern, `RowLink`-style row shape | `MemberRow` (status-aware row, no navigation) |
| Invite generate | `Forms.js` inputs, `codicon:copy`/`codicon:eye` icons | `InviteShareCard` (read-only field + copy button + "Copied" live text) |
| Join party | `Forms.js`, `FormValidation` | — |
| Sync card | `.data-section` card, `Button` variants | inline alert paragraph (info/success/error variants — small shared style, not a new component) |
| Review wizard | `<progress>` (from `Bucket`), `Forms.js`/`CategorySelector` for Modify, `$income`/`$expense` money coloring, `window.confirm` for bulk actions | `ReviewItemCard`, `WizardProgress`, `WizardSummary`, `InputDate` (new, in `Forms.js`) |

Total new components: **6** (header account chip, `MemberRow`,
`InviteShareCard`, `ReviewItemCard`, `WizardProgress`/`WizardSummary`,
`InputDate`) — everything else reuses existing tokens and components as-is.
