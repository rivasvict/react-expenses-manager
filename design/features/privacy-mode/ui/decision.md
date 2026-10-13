---
title: Privacy mode
summary: A Settings switch that makes the dashboard open with its figures blurred, with an eye on the Savings card to show them; off looks exactly like today.
status: implemented
chosen: d-eye-in-card
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**d-eye-in-card**, chosen by the owner after two rounds. With **Privacy mode**
on, the dashboard opens with its money figures blurred and a small eye beside
the "Savings" label shows them. With it off, nothing changes at all.

Why the others did not win: **A** (masked dots) and **C** (blur with a
per-figure peek) put a fourth control in an app bar that, signed in, already
holds the logo, the app name, the gear and the account chip; **B** (cover card)
makes the dashboard look different while hidden. **E** (status strip) explained
itself better but costs about 3rem of height and pushes the Add buttons below
the fold, while **D** costs no space and sits beside the figure it protects.

Owner's answers: the setting is **off by default**; **only the dashboard**
hides (lists, Summary, Trend and Buckets are reached on purpose); while on, the
figures are **always hidden when the app opens**.

## For the implementer

### What hides, and how

Only on the dashboard (`/`), and only while Privacy mode is on and the user has
not revealed:

| Figure | Hidden form |
|---|---|
| Savings amount (hero) | Blurred placeholder `$8,888.88` (formatted with the chosen currency symbol), neutral colour |
| Change pill in the card footer | Blurred placeholder `+8.8%` on a neutral tint: no arrow, no sign, no green/red. The "vs Sep" caption stays. The "nothing to compare" caption is replaced by the same pill and caption, so it does not reveal that there is no previous month |
| Doughnut chart | A uniform grey ring (`--highlight`) the size of the chart, with a legend of grey dots ("Expenses", "Savings"); the real chart is **not rendered** |
| Incomes and Expenses amounts | The same blurred placeholder; the icon chips lose their green/red tint |

The placeholder is a fixed string, so the real digits (and their count) are
never in the page. Each hidden figure is `role="img"` with an accessible name
("Amount hidden", "Percentage change hidden", "Chart hidden") and its
placeholder `aria-hidden`. A month with no entries is hidden the same way
(otherwise the mask would say "nothing here").

Not hidden: the month header, labels, the "Trend ›" link, the Add buttons, and
**every other screen** (Summary, incomes and expenses lists, Savings trend,
Buckets, Data management show their figures as today, even while Privacy mode
is on).

### Behaviour the screens do not show

- **Setting**: a switch row **Privacy mode** on `/settings`, below Currency.
  The whole row is the switch (`role="switch"`, `aria-checked`); tapping it
  applies at once. Stored on this device only in `localStorage` as
  `settings.privacyMode` = `"on"`; anything else (absent, unreadable, storage
  blocked) means off. Never in the entries model, backup or sync.
- **Off** (default): no eye, no blur; the dashboard is identical to today.
- **On**: the dashboard is hidden every time the app opens. The eye
  (`aria-label` "Show figures", gold on a soft gold wash while hidden) shows all
  figures at once; in the shown state it is plain with `aria-label` "Hide
  figures" and tapping it hides again.
- A reveal lasts for the session: it survives navigating to other screens and
  back, and is dropped when the app is closed, reloaded, or sent to the
  background (`document.visibilityState === "hidden"`), and when the switch is
  turned off and on again.
- The eye overlays the savings tile instead of living inside it, because the
  tile is a link to Summary and a button cannot sit inside a link. Tapping the
  eye must not navigate. Its horizontal position follows the label's width in
  each language (an invisible copy of the label pushes it, as in the mockup).
- While hidden, tapping the savings tile still opens Summary (which shows its
  figures, per the decision above).
- Touch target: the eye is 2.2rem square; the savings tile stays the larger
  target for Summary.
- A change made in another tab follows through the `storage` event, like
  language and currency.

### Reuse and new pieces

- Reuse: the `card` and `money-figures` mixins, `SettingRow`'s look for the new
  switch row, `ChangePill`, `ContentTitleSection`, `$accent` / `$accent-soft` /
  `$highlight` / `$text-secondary` tokens. No new tokens.
- New shared components (each gets a row in `design/system/components.md`):
  **Switch row** (Settings), **Privacy eye** (the eye chip), **Hidden figure**
  (blurred placeholder with accessible name) and the hidden **Balance chart
  placeholder**.
- New state: a small provider holds the preference and the in-memory reveal.

### New strings (English / Spanish / French)

| Key | English | Spanish | French |
|---|---|---|---|
| `settings.privacy.title` | Privacy mode | Modo privacidad | Mode confidentialité |
| `settings.privacy.hint` | Blurs figures when the app opens until you show them | Difumina las cifras al abrir la app hasta que las muestres | Floute les chiffres à l'ouverture de l'app jusqu'à ce que vous les affichiez |
| `privacy.show` | Show figures | Mostrar cifras | Afficher les chiffres |
| `privacy.hide` | Hide figures | Ocultar cifras | Masquer les chiffres |
| `privacy.amountHidden` | Amount hidden | Importe oculto | Montant masqué |
| `privacy.changeHidden` | Percentage change hidden | Variación porcentual oculta | Variation en pourcentage masquée |
| `privacy.chartHidden` | Chart hidden | Gráfico oculto | Graphique masqué |

### Edge cases

- Long text: the hint wraps to two or three lines in Spanish and French; the
  switch keeps its width. The eye stays after the label whatever its length.
- Storage unavailable: the switch cannot persist and the app behaves as off on
  the next load.
- Negative, zero or very large savings: the placeholder is the same, so none
  of that shows.
- No error or empty state of its own.

## Approved screens

| Screen | State | File |
|---|---|---|
| Settings | Privacy mode off | [`approved/settings.off.html`](approved/settings.off.html) |
| Settings | Privacy mode on | [`approved/settings.on.html`](approved/settings.on.html) |
| Settings | Privacy mode on, Spanish | [`approved/settings.on-es.html`](approved/settings.on-es.html) |
| Dashboard | Figures hidden | [`approved/dashboard.hidden.html`](approved/dashboard.hidden.html) |
| Dashboard | Figures hidden, Spanish | [`approved/dashboard.hidden-es.html`](approved/dashboard.hidden-es.html) |
| Dashboard | Figures shown | [`approved/dashboard.shown.html`](approved/dashboard.shown.html) |

Flow: Settings (switch on) → open the app → Dashboard hidden → tap the eye →
Dashboard shown → tap the eye or reopen the app → hidden again.

## Exploration history (kept for reference)

## Options considered

**A · Masked in place** (`options/a-masked-in-place/`). The dashboard keeps its
layout, but every figure becomes a row of dots (`••••••`), the percentage pill
becomes `•••` on a neutral tint (no arrow, no green or red), the doughnut
becomes a plain grey ring and the row chips lose their tint. An **eye chip** in
the app bar (next to the settings gear, gold while figures are hidden) reveals
everything; tapping it again hides again. A reveal lasts until the app is
closed or sent to the background. Settings gets one **Privacy mode** switch row.
*Good at:* the screen still looks like the dashboard, one tap shows it all,
least new UI. *Costs:* an extra chip in the app bar on every screen; the
layout still hints that there is a balance, a chart and two rows.

**B · Cover card** (`options/b-cover-card/`). The figures, chart and rows are
replaced by one calm card with a lock icon, "Figures are hidden" and a single
gold **Show figures** button. Month stepper and the two Add buttons stay, so
entries can be added without revealing anything. Showing lasts until the user
leaves the screen. Settings gets the switch plus a **Hide again** row (a sheet:
when leaving the screen / after 1 minute / after 5 minutes).
*Good at:* strongest privacy (nothing about the shape of the month is shown)
and a very clear "this is deliberate" message. *Costs:* the dashboard no
longer looks like itself while hidden, a second setting with its own sheet,
and the other money screens need their own cover (a list of rows becomes the
same card).

**C · Blur and peek** (`options/c-blur-and-peek/`). Figures stay in place but
blurred; a one-line strip says how to use it. **Tapping a figure shows only
that one for 5 seconds**, then it blurs again; the chart is blurred too.
Settings gets one switch row. *Good at:* quick, per-figure glances without
exposing everything. *Costs:* weakest hiding (blur still shows how many digits
and where the figures are; the real text must not stay in the page, so the
blur needs a placeholder of fixed width in practice), a timer to build and to
explain, and tapping on the hero also navigates to Summary today, so peek
needs a rule for that tap.

## Non-default states

- **Revealed**: A draws it (`dashboard.revealed`: plain eye chip, real
  figures, identical to today's dashboard). B's revealed state is today's
  dashboard unchanged; C's is the peek state
  (`dashboard.peek`).
- **Empty month**: a month with no entries still masks `$0.00` (otherwise the
  mask would say "nothing here"); A and C keep the masked rows, B shows the
  same cover.
- **Error**: none; the preference reads from `localStorage` and an unreadable
  value falls back to off (as language and currency do).

## Decided

- Default **off** (nothing changes until the user switches it on).
- Only the **dashboard** hides; other routes always show their figures.
- While on, figures are **always hidden when the app opens**; a reveal lasts
  until the app is closed or sent to the background.

