---
title: Savings trend, total saved
summary: A Total saved / Change tab pair on the Savings trend screen. Total saved (the savings of every month in the range added up) is on the left and opens by default; Change (end month vs reference month) is on the right.
status: implemented
chosen: b-one-figure-switch
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Extends the implemented
[`savings-trend`](../../savings-trend/ui/decision.md) screen; everything there
that is not changed below stays as built.

## Decision

**b-one-figure-switch**, with two changes the owner asked for:

1. The tabs are ordered **Total saved** (left), **Change** (right).
2. **Total saved is the default tab.** The screen opens on it every time it is
   entered; the choice lives in component state, so it survives moving the month
   header or the range, but not leaving the screen.

Both questions get a full-size figure and a chart that explains it; one tab is
shown at a time so the headline card stays the same height as today.

Why the others did not win: **a-side-by-side** shrinks both figures and the chart
only explains one; **c-paired-blocks** adds ~150px and a second chart;
**d-headline-plus-total-row** (the reviewer's first pick) leaves the total
without a picture. A separate design review (one round) raised two concerns about
B, handled here: the tab bar is an underline style, deliberately unlike the gold
segmented range switch so the two controls read as different levels; and the
running-total chart keeps green/red only for above/below the zero line (never a
"change"), labelled by its key.

## For the implementer

### What to build

| Piece | Where | Notes |
|---|---|---|
| Totals maths | `src/helpers/savingsTrend/savingsTotal.ts` + colocated test | Pure: `getTotalSaved(points)` → `{ total, months, average }` and `getRunningTotals(points)`. Months without entries count as 0 (the points already do). |
| View tabs | `src/components/common/SavingsTrend/ViewTabs/` | `role="tablist"` named "Show"; two `role="tab"` buttons with `aria-selected`; underline style (2px `$accent` under the selected one, hairline `$border-subtle` under the row). Min height 2.5rem. Arrow keys move between tabs. |
| Headline | `TrendSummary` + a new `TotalSummary` (same folder pattern) | Both render inside one card (`.trend-summary`) with the tabs on top. `TotalSummary`: label "Total saved, Apr – Oct" (span carries the year on both ends when the range crosses years: "Oct 2025 – Oct 2026"), the total at 2rem/700 (neutral `$text-primary`; `$expense` with a true minus when negative), then "7 months · $1,245.71 avg per month". No pill. |
| Chart | `TrendChart` gains a `mode: "total" \| "change"` prop | `total`: the line is the **running total** over a dashed **zero** baseline, green above / red hatched below (existing clips), first month's label **below** its dot, end value above the last dot. Tooltip (tap/hover/arrow keys): month and year, the running total, then that month's own savings "+$1,390.00 that month" (green or red by sign). Key: dashed "Zero line", "Above", "Below". |
| Screen | `SavingsTrend/index.tsx` | `view` state defaults to `"total"`. The custom-range sheet, range switch, notices (`empty`/`short`) are unchanged; the tabs are shown only when a chart is (not in the notice states). |
| Docs | `design/system/components.md` | Rows for **View tabs** and **Total summary**. |

Reuse: `card`, `money-figures`, `focus-ring`; `ChangePill` is not used by the
total. **No new tokens.**

### Rules

| Rule | Value |
|---|---|
| Total saved | Sum of every month's savings from the reference month through the end month, both included. It follows the range switch and month header exactly like the change. |
| Months | `points.length`; always 2 or more, so the copy is "N months" (the plural pair still ships `_one`). |
| Average | Total / months, formatted like every amount. |
| 1M | Two months: "2 months · … avg per month". |
| Negative total | Minus (U+2212) and the expense tone; the label stays "Total saved". |
| Change tab | Unchanged from `savings-trend` (headline, pill, chart, key, note). |
| Colour is never the only signal | Sign on every figure; the area below zero is hatched. |

### Accessibility

- Tabs: `role="tablist"` / `role="tab"` / `aria-selected`, and the headline card
  is a `role="group"` named by its sentence ("Total saved, Apr – Oct" or
  "October vs April"). The panel below is `aria-live` free; switching tabs moves no focus.
- The chart's hidden table gains a third column "Total so far" in total mode.
- Chart label: "Total saved from April 2026 to October 2026, ending at $8,720.00".

### Strings (new i18n keys; English / Spanish / French)

| Key | English | Spanish | French |
|---|---|---|---|
| `savingsTrend.view.group` | Show | Mostrar | Afficher |
| `savingsTrend.view.total` | Total saved | Ahorro total | Total épargné |
| `savingsTrend.view.change` | Change | Cambio | Variation |
| `savingsTrend.total.label` | Total saved, {{span}} | Ahorro total, {{span}} | Total épargné, {{span}} |
| `savingsTrend.total.months_one` / `_other` | {{count}} month / {{count}} months | {{count}} mes / {{count}} meses | {{count}} mois / {{count}} mois |
| `savingsTrend.total.average` | {{amount}} avg per month | {{amount}} de media al mes | {{amount}} en moyenne par mois |
| `savingsTrend.total.note` | Each point is what you have saved so far in this range. It rises in months you save and falls in months you overspend. | Cada punto es lo que has ahorrado hasta ese mes en este rango. Sube en los meses que ahorras y baja en los que gastas de más. | Chaque point est ce que vous avez épargné jusque-là dans cette période. Il monte les mois où vous épargnez et baisse ceux où vous dépensez trop. |
| `savingsTrend.total.key.zero` | Zero line | Línea cero | Ligne zéro |
| `savingsTrend.total.tooltipMonth` | {{amount}} that month | {{amount}} ese mes | {{amount}} ce mois-ci |
| `savingsTrend.total.chartLabel` | Total saved from {{from}} to {{to}}, ending at {{value}} | Ahorro total de {{from}} a {{to}}, terminando en {{value}} | Total épargné de {{from}} à {{to}}, pour finir à {{value}} |
| `savingsTrend.table.total` | Total so far | Total hasta ese mes | Total à ce jour |

## Approved screens

| Screen | State | File |
|---|---|---|
| Savings trend | Total saved, 6 months (default) | `approved/trend.total.html` |
| Savings trend | A month selected on the total chart | `approved/trend.total-tooltip.html` |
| Savings trend | Change tab | `approved/trend.change.html` |
| Savings trend | Total saved, Spanish | `approved/trend.total-es.html` |
| Savings trend | Total saved, negative | `approved/trend.total-negative.html` |

The empty and short-range notices are the existing `savings-trend` states and do
not change (no tabs there).

## Exploration

Options explored (kept for reference in `options/`): **a-side-by-side**,
**b-one-figure-switch** (chosen), **c-paired-blocks**,
**d-headline-plus-total-row**. The option mockups show Change first; the approved
screens are the binding spec (Total saved first).
