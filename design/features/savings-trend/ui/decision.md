---
title: Savings trend
summary: A Savings trend screen, reached from a "Trend" link on the dashboard's savings card, answers "am I growing my savings?" with a green/red area chart and 1M–YTD or custom month ranges.
status: implemented
chosen: d-trend-link-with-compare
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**d-trend-link-with-compare**: B's dashboard entry with A's trend screens.

- **Dashboard.** The savings card is split by a hairline. The top half is
  unchanged (it still opens Summary). The bottom half holds the existing
  change badge on the left and a gold **Trend ›** link, led by a small
  trending-up chip, on the right. The badge caption is shortened to
  **"vs Sep"** (Spanish "frente a sep"). It adds about 25px to the dashboard.
- **Trend screen** (`/savings-trend`). The month header picks the end month
  exactly as on the dashboard. One segmented control picks the range
  (`1M 2M 3M 6M 1Y YTD` and a calendar button for a custom range). A headline
  compares the end month with the month the range starts at
  ("October vs April: **+$340.00**, ▲ 26.6%"), and a line chart plots each
  month's savings against the starting month's line: green above it, red
  (hatched) below it.

Why this won: the literal "compare with a month" reading of the request; every
preset is one tap; the entry sits next to the badge people already read to see
how they are doing, so it is easy to find without a new tab or extra buttons.

Why the others did not win: **a-compare-with-a-month** added a whole row (about
60px) to a dashboard whose buttons already sit near the tab bar.
**b-savings-pot** answers a different question (running total) than the one
asked (this month against an earlier one). **c-verdict-first** hides the
presets behind a menu (two taps) and needs verdict copy for every case, in two
languages.

This **supersedes the hero layout approved in
[`../../savings-delta/ui/decision.md`](../../savings-delta/ui/decision.md)**:
the badge moves from under the amount to the card's footer and its caption uses
the short month name. The badge's rules, colours and spoken label are
unchanged.

## For the implementer

### What to build

| Piece | Where | Notes |
|---|---|---|
| Range and trend maths | `src/helpers/savingsTrend/savingsTrend.ts` + colocated test | Pure. Builds the monthly points between the reference month and the end month and the comparison. Generalise the helpers in `src/helpers/savingsChange/savingsChange.ts` (month savings, "has entries", percent rule, `formatPercent`) rather than copying them; `getSavingsChange` becomes the one-month case. |
| Dashboard hero | `src/components/Dashboard/components/DashboardContent/` | One card (`.balance-hero`): the existing summary tile on top, a footer below holding `SavingsChangeBadge` and the new trend link. The summary tile keeps `title="Summary"`. |
| `SavingsTrendLink` | `src/components/common/SavingsTrendLink/` | Chip + "Trend" + chevron; router link to `/savings-trend`; `aria-label` is "Savings trend". Minimum tap height 2.5rem. |
| `SavingsChangeBadge` | edit in place | Caption uses the **short** month ("Sep"); the spoken label keeps the full name. Margin-top is removed inside the footer. |
| Screen | `src/components/common/SavingsTrend/` (`index.tsx`, `styles.scss`) | Route `${match.url}savings-trend` in `src/components/Dashboard/index.js`. Page title (eyebrow) via `MainContentContainer`. Connects to Redux with `connect()`; end month is the Redux `selectedDate`, moved by the existing `NavigableMonthHeader`. |
| `RangeSwitch` | `src/components/common/SavingsTrend/RangeSwitch/` | The segmented control (a group of buttons with `aria-pressed`). |
| `TrendChart` | `src/components/common/SavingsTrend/TrendChart/` | Plain SVG, no chart library: it must be pixel-stable for the design review and testable in jsdom. |
| `CustomRangeSheet` | `src/components/common/SavingsTrend/CustomRangeSheet/` | Bottom sheet on a scrim; same stacking and look as `FilterSheet` (z-index 110/111, `$radius-shell` top corners, grabber, close button). |
| Docs | `design/system/components.md` | A row for each new shared component. |

Reuse: the card mixin, `money-figures`, `focus-ring`, the buttons mixin
(`.btn-primary`, `.btn-secondary`), the native select styling in `global.scss`,
the tokens `$income`/`$income-soft`, `$expense`/`$expense-soft`, `$accent`/
`$accent-soft`, `$highlight`, `$border-strong`, `$text-*`, `$scrim`.
**No new tokens.**

### Range rules

| Rule | Value |
|---|---|
| Savings of a month | Incomes minus expenses (the hero's own figure). A month with no entries counts as $0.00 on the chart. |
| End month | The Redux `selectedDate`. |
| Reference month | `1M`/`2M`/`3M`/`6M`: that many months before the end month. `1Y`: 12 months before. `YTD`: January of the end month's year. Custom: the **From** month. |
| Preset availability | A preset is enabled only if its reference month is a recorded month (the Redux entries tree starts at the first month with data). Disabled ones are dimmed and not focusable (`disabled`). `YTD` is also disabled when the end month is January. |
| Default and fallback | `6M`, or the longest enabled preset when `6M` is not available. |
| Not enough history | When no earlier recorded month exists (including no entries at all): the whole control is disabled with nothing selected and the message card replaces the headline and chart (`trend.empty`). |
| Moving the end month | The chosen preset stays selected when still available, else falls back to the default above. A custom range keeps its length, clamped to the recorded history. |
| Headline | `{end} vs {reference}` (month names; **with the year on both** when the years differ, e.g. "October 2026 vs October 2025"). The amount is `end − reference` with a sign (`+`, `−` U+2212), green / red / neutral; the pill is the percentage, using the savings badge's rules (`(end − reference) / \|reference\| × 100`, one decimal, `>999%` from 1,000%). **No pill** when the reference month has no entries or saved exactly $0.00; the caption (`$end vs $reference`) stays. |
| Colour is never the only signal | Sign and arrow on every figure; the area below the line is hatched; the end dot is outlined in the surface colour. |

### Custom range sheet

- Opened by the calendar button (`aria-label` "Custom range"); focus moves to
  the heading and returns to the button on close. Escape, the close button,
  the scrim and **Cancel** close it without changing anything.
- **From** and **To** are native selects, one option per **recorded** month,
  labelled "April 2026" (title case; Spanish "Abril 2026"), newest first.
  Defaults: the current reference month and the end month.
- **From** lists only months before the selected **To**; **To** lists only
  months after the selected **From**. The pair is therefore always valid and
  there is no error state. (To move a range earlier, change From first.)
- **Show trend** (the one gold primary) applies the range: it sets the
  Redux selected month to **To** (so the month header follows), selects the
  calendar button, and closes the sheet.

### Chart

All values in SVG user units, `viewBox="0 0 300 150"`, drawn to fill the plot
card's width.

| Part | Spec |
|---|---|
| Padding | left 8, right 8, top 18, bottom 22. |
| Scale | min and max over the points **and** the baseline, widened by 12% of the span on each side; points evenly spaced in x. |
| Baseline | The reference month's savings: a 1px dashed line (`$border-strong`, `3 3`). |
| Area | Between the line and the baseline: `$income` at 0.2 opacity above, `$expense` at 0.16 below plus a 45° hatch (`$expense`, 1.5px strokes every 5 units, 0.55 opacity). Split with two clip rects at the baseline. |
| Line | 2px, round joins and caps; `$income` above the baseline, `$expense` below (the same two clips). |
| Dots | Reference: 4.5 radius, surface fill, `$text-secondary` 2px ring. End: 5 radius, `$income` or `$expense` by sign, 2px ring in the card colour. |
| Labels | Reference label "April $1,280.00" (11px / 600, `$text-secondary`) above its dot (below it when the dot is within 14 units of the top). End value (11px / 700, `$text-primary`) above its dot, right-aligned. X ticks 10px, `$text-muted`: up to 7 labels, **5 when the labels carry a year**, evenly spread, first left-aligned, last right-aligned. A year ("Oct ’25") is added when the range crosses a year. |
| Legend | Dashed line "Savings in April", then "Above" and "Below" swatches, 12px, `$text-secondary`. Wraps. |
| Selecting a month | Tapping or clicking the plot selects the nearest month (tap it again to clear); hovering with a mouse previews one; with the plot focused, ← → move the selection and Esc clears it. The selection shows a vertical guide, a dot and a tooltip (month and year, savings, and the difference against the reference month: "+$110.00 vs Apr"). The end value label is hidden while the tooltip shows. The tooltip sits at the top of the plot, on the side away from the selected point. |

### Accessibility

- The plot wrapper is a focusable `role="group"` named by the chart label; the
  SVG is `aria-hidden`. A visually hidden table (month, savings) carries the
  data for screen readers.
- The headline card is a `role="group"` named by its sentence.
- Range buttons are `aria-pressed` buttons with full names ("Last 6 months").

### Strings (new i18n keys)

| Key | English | Spanish |
|---|---|---|
| `savingsTrend.pageTitle` | Savings trend | Tendencia del ahorro |
| `savingsTrend.link` | Trend | Tendencia |
| `savingsTrend.linkLabel` | Savings trend | Tendencia del ahorro |
| `savingsTrend.rangeGroup` | Range | Rango |
| `savingsTrend.range.1M` / `2M` / `3M` / `6M` | 1M / 2M / 3M / 6M | 1M / 2M / 3M / 6M |
| `savingsTrend.range.1Y` | 1Y | 1A |
| `savingsTrend.range.YTD` | YTD | YTD |
| `savingsTrend.rangeLabel.months_one` / `_other` | Last month / Last {{count}} months | Último mes / Últimos {{count}} meses |
| `savingsTrend.rangeLabel.ytd` | This year so far | Lo que va del año |
| `savingsTrend.customRange` | Custom range | Rango personalizado |
| `savingsTrend.compare` | {{end}} vs {{reference}} | {{end}} frente a {{reference}} |
| `savingsTrend.note` | Each point is one month's savings. Green where it beat {{reference}}, red where it fell short. | Cada punto es el ahorro de un mes. Verde donde superó a {{reference}}, rojo donde quedó por debajo. |
| `savingsTrend.key.reference` | Savings in {{reference}} | Ahorro de {{reference}} |
| `savingsTrend.key.above` / `below` | Above / Below | Por encima / Por debajo |
| `savingsTrend.chartLabel` | Monthly savings from {{from}} to {{to}}, ending at {{value}} | Ahorro mensual de {{from}} a {{to}}, terminando en {{value}} |
| `savingsTrend.table.caption` / `month` / `savings` | Monthly savings / Month / Savings | Ahorro mensual / Mes / Ahorro |
| `savingsTrend.tooltipVs` | {{difference}} vs {{month}} | {{difference}} frente a {{month}} |
| `savingsTrend.empty.title` | Not enough history yet | Aún no hay suficiente historial |
| `savingsTrend.empty.body` | A trend needs at least two months. Keep adding your incomes and expenses, or pick a later month. | Una tendencia necesita al menos dos meses. Sigue añadiendo tus ingresos y gastos, o elige un mes posterior. |
| `savingsTrend.sheet.title` | Custom range | Rango personalizado |
| `savingsTrend.sheet.hint` | Compare a month with any month before it. Whole months only. | Compara un mes con cualquier mes anterior. Solo meses completos. |
| `savingsTrend.sheet.from` / `to` | From / To | Desde / Hasta |
| `savingsTrend.sheet.show` | Show trend | Ver tendencia |
| `savingsTrend.sheet.close` | Close | Cerrar |

`{{month}}` in `savingsChange.vs` and `savingsChange.nothingToCompare` is now
the **short** month name (dayjs `MMM`: "Sep", Spanish "sep"); the spoken
`savingsChange.label.*` keep the full name. Month names inside sentences are
lower case in Spanish ("abril"); month names that start a line or sit in the
header are title case ("Octubre"). Cancel uses `common.cancel`.

### Edge cases

- **Long Spanish copy.** In the dashboard footer the badge may wrap onto two
  lines beside the Trend link (see `dashboard.up-es`,
  `dashboard.nothing-to-compare`); the link never shrinks.
- **The in-progress month.** The end month is usually partial; this is the same
  caveat as the savings badge and is out of scope.
- **January.** `YTD` is disabled when the end month is January (nothing earlier
  in the year); it uses the same dimmed look as the empty state.
- **Many months.** The chart and tick rules above hold for any range; keep the
  data table in the DOM for all of them.
- **Reference month with no entries.** The chart still draws (that month is
  $0.00) and the headline amount shows; only the percentage pill is dropped.
- No loading or error state: everything is computed from entries already in
  memory.

### Review

`fixtures.json` pins the app's clock with `now`. Dashboard screens compare only
the balance hero (`region`), since the donut is a Chart.js canvas; trend screens
compare the work-area card. The `.savings-trend-chart__area` element is the
plot (clicked at its centre, which selects the middle month).

## Approved screens

| Screen | State | File |
|---|---|---|
| Dashboard | Savings went up (default) | `approved/dashboard.up.html` |
| Dashboard | Savings went up, Spanish | `approved/dashboard.up-es.html` |
| Dashboard | Savings went down | `approved/dashboard.down.html` |
| Dashboard | First month with data: nothing to compare | `approved/dashboard.nothing-to-compare.html` |
| Savings trend | 6 months, up (default) | `approved/trend.up.html` |
| Savings trend | 6 months, up, Spanish | `approved/trend.up-es.html` |
| Savings trend | 6 months, down | `approved/trend.down.html` |
| Savings trend | 1 year (year labels, year in the headline) | `approved/trend.year.html` |
| Savings trend | A month selected (tooltip) | `approved/trend.tooltip.html` |
| Savings trend | Custom range sheet | `approved/trend.custom.html` |
| Savings trend | Not enough history | `approved/trend.empty.html` |

States that reuse the same pattern and are **not** drawn: the dashboard with an
unchanged (`0.0%`) badge and with a month that has no entries (both follow
`dashboard.up` with the grey pill / the same footer), a disabled `YTD` in
January, and the custom range applied (the calendar button selected, the
headline carrying both years like `trend.year`).
