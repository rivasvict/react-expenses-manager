---
title: Savings change from the previous month
summary: The dashboard shows how much this month's savings rose or fell against the previous month, as a green-up or red-down percentage.
status: implemented
chosen: a-badge-in-hero
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**a-badge-in-hero.** A tinted pill (`▲ +12.5%`) and a "vs September" caption
sit directly under the savings amount, inside the existing balance hero. The
change stays next to the number it describes, the layout matches how banking
apps show a trend, and it adds only about 30px to a dashboard whose buttons
already sit close to the tab bar.

Why the others did not win: **b-strip-above-chart** separates the trend from
its figure with a card border, adds a second green or red block under a green
or red amount, and pushes the Add buttons down by about 65px.
**c-inside-donut** mixes two different ideas (the ring shows how *this* month
splits; the centre would compare with *last* month), and it disappears with
the donut in a month without entries, which is exactly when a −100% drop
matters.

> **Superseded in part.** The hero layout and the caption wording here were
> changed by [`../../savings-trend/ui/decision.md`](../../savings-trend/ui/decision.md):
> the badge now sits in the card's footer beside a Trend link, and its caption
> uses the short month ("vs Sep"). The badge's rules and colours below still hold.

## For the implementer

### What to build

- A new shared component, `src/components/common/SavingsChangeBadge/`
  (`index.tsx` and `styles.scss`), rendered as the last child of the balance
  hero in `DashboardContent`, under `.balance-hero__amount`. It is
  display-only: the whole hero card stays one link to Summary.
- A pure helper, `src/helpers/savingsChange/savingsChange.ts`, that computes
  the change from the `entries` tree and `selectedDate` already in Redux. No
  storage, backup or sync change.
- Reuse: the hero tile (`ContentTileSection`), the `money-figures` mixin, and
  the tokens `$income` / `$income-soft`, `$expense` / `$expense-soft`,
  `$text-secondary`, `$highlight` and `$radius-pill`. **No new tokens.**

### Rules

| Rule | Value |
|---|---|
| Savings of a month | Incomes minus expenses: the hero's own figure. |
| Previous month | The calendar month before the **selected** month (January → December of the year before). |
| Change | `(current − previous) / \|previous\| × 100`, rounded to one decimal. Dividing by the absolute value keeps the sign honest when the previous month was negative. |
| Up | `--income` text on `--income-soft`, up arrow, `+` sign. |
| Down | `--expense` text on `--expense-soft`, down arrow, `−` (U+2212) sign. |
| No change (rounds to 0.0) | `--text-secondary` on `--highlight`, a flat dash, no sign: `0.0%`. |
| Nothing to compare | The previous month has no entries, or saved exactly $0.00. No pill, only the caption. |
| Very large change | From 1,000% upward, show `>999%`. |
| Selected month has no entries | It saved $0.00, so the change is shown as normal (for example −100.0%); the donut hides as it does today. |

### Pill and caption

- Badge row: flex, wrap, `gap: 0.25rem 0.5rem`, `margin-top: 0.35rem`.
- Pill: `inline-flex`, `gap: 0.3rem`, `padding: 0.15rem 0.6rem`,
  `border-radius: $radius-pill`, `0.85rem / 700`, line height 1.5, tabular
  figures. Icon: 0.8em square SVG filled with `currentColor`.
- Caption: `0.82rem / 400`, `--text-secondary`.

### Accessibility

The badge is one `role="img"` whose name is the whole sentence; the pill and
caption are `aria-hidden`. The arrow and the sign carry the direction, so
colour is never the only signal.

### Strings (new i18n keys)

| Key | English | Spanish |
|---|---|---|
| `savingsChange.vs` | vs {{month}} | frente a {{month}} |
| `savingsChange.label.up` | Savings up {{percent}} compared with {{month}} | El ahorro subió un {{percent}} respecto a {{month}} |
| `savingsChange.label.down` | Savings down {{percent}} compared with {{month}} | El ahorro bajó un {{percent}} respecto a {{month}} |
| `savingsChange.label.flat` | Savings unchanged compared with {{month}} | El ahorro no cambió respecto a {{month}} |
| `savingsChange.nothingToCompare` | Nothing to compare with {{month}} | Nada que comparar con {{month}} |

`{{month}}` is the previous month's name as it reads mid-sentence: capitalised
in English ("September"), lowercase in Spanish ("septiembre"), unlike the month
header's title case. Percentages use the same `en-US` number format as the
app's money (`12.5%`).

### Review

`fixtures.json` pins the app's clock with `now` (the dashboard opens on the
current month) and compares only the balance hero (`region`), since the hero is
the only part of the screen this feature changes and the donut is a Chart.js
canvas.

## Approved screens

| Screen | State | File |
|---|---|---|
| Dashboard | Savings went up (default) | `approved/dashboard.up.html` |
| Dashboard | Savings went up, Spanish | `approved/dashboard.up-es.html` |
| Dashboard | Savings went down | `approved/dashboard.down.html` |
| Dashboard | No change | `approved/dashboard.no-change.html` |
| Dashboard | Nothing to compare (first month with data) | `approved/dashboard.nothing-to-compare.html` |
| Dashboard | Selected month has no entries | `approved/dashboard.empty-month.html` |

There is no loading or error state: the value is computed from entries
already in memory.
