---
title: Category trends polish
summary: No add-entry CTA on an empty category list, a back link grouped with the category picker, and a red/green Per month chart.
status: approved
chosen: d-combined
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**d-combined**, the owner's mix of the explored options:

- **Empty list (a-quiet).** The "No expenses/incomes between X and Y" card stays; its
  button is removed and the body reads "Nothing to compare in this range yet." Trends is a
  place to read, not to record.
- **Back link (c-grouped).** "‹ All categories" and the category picker share one raised
  card: the link is a quiet header strip (`--bg-surface`, hairline below), the picker row
  is the lower half. The screen keeps today's height; the pair reads as "where am I".
- **Per-month chart (b-guided).** One tone for the whole line, its fill and the end dot,
  taken from the first month to the end month: an expense category that is up is red,
  down is green; an income category is the reverse; no change is grey. Replaces the gold
  line. The legend names the direction ("Spending is up from April"), so colour is never
  the only cue.

Why not the others: a's joined chevron is icon-only; b's ‹ inside the selected scope
segment is the least discoverable; a's per-segment colouring and c's bars are busier than
a single tone that matches the headline.

The **Change** tab is unchanged (green/red hatched against the reference month). The Per month
tone and the Change tab's dot therefore agree on the end month.

This **supersedes** screens of `../../category-trends/ui/approved/`: its
`category.per-month` and `categories.empty` are replaced by the ones here, and the
back-link/picker group is applied to its other detail screens
(`category.change`, `.income-change`, `.es`, `.no-entries`, `category-picker.default`).

## For the implementer

### Reuse

`BackLink`, `CategoryPicker` (both restyled to sit inside the group), `HistoryNotice`
(without `action`), `CategoryTrendChart`, `ChartKey`. Tokens only; no new tokens.

### New shared component (add a row to `design/system/components.md`)

| Component | Where | Notes |
|---|---|---|
| Category location (one raised card holding the back-link strip over the category picker row, hairline between) | `src/components/common/CategoryTrends/CategoryLocation/` | Wraps `BackLink` + `CategoryPicker`; owns the card border, radius (`$radius-control`), background and overflow. Inside it the picker has no border, radius, margin or own background, and the back link is 2.5rem tall on `$bg-surface` with a bottom hairline. Margin below: 0.75rem. |

The components.md rows for "Back link" and "Category trend chart" are updated (the chart is a
single tone on Per month, not gold).

### Behaviour

- **Per month tone** = the trend's `tone` (end vs reference). `up`/`down` copy comes from the sign of
  `difference`. Flat (equal): grey line and dot, legend "Spending is the same as in April".
- Area fill uses the same tone at the existing tint opacities (`good` 0.2, `bad` 0.16 on Change; Per month
  uses 0.16 for both and grey 0.14 for flat; match the mockup).
- Remove the gold Per month styles (`--month` classes) and the "Spent that month" keys.
- **Empty list:** no button, no navigation to Add entry.
- Long category names wrap in the picker (`overflow-wrap: anywhere`); the back strip never wraps.

### i18n (English / Spanish; French follows the same pattern)

| Key | English | Spanish |
|---|---|---|
| `categoryTrends.empty.expense.body` / `.income.body` (changed) | Nothing to compare in this range yet. | Nada que comparar en este rango todavía. |
| `categoryTrends.key.spendingUp` | Spending is up from {{reference}} | El gasto ha subido desde {{reference}} |
| `categoryTrends.key.spendingDown` | Spending is down from {{reference}} | El gasto ha bajado desde {{reference}} |
| `categoryTrends.key.spendingFlat` | Spending is the same as in {{reference}} | El gasto es igual que en {{reference}} |
| `categoryTrends.key.incomeUp` | Income is up from {{reference}} | Los ingresos han subido desde {{reference}} |
| `categoryTrends.key.incomeDown` | Income is down from {{reference}} | Los ingresos han bajado desde {{reference}} |
| `categoryTrends.key.incomeFlat` | Income is the same as in {{reference}} | Los ingresos son iguales que en {{reference}} |
| `categoryTrends.note.perMonth.expense` (changed) | Red when you spent more in {{end}} than in {{reference}}, green when you spent less. | Rojo cuando gastaste más en {{end}} que en {{reference}}, verde cuando gastaste menos. |
| `categoryTrends.note.perMonth.income` (changed) | Green when you earned more in {{end}} than in {{reference}}, red when you earned less. | Verde cuando ingresaste más en {{end}} que en {{reference}}, rojo cuando ingresaste menos. |

Removed: `categoryTrends.empty.*.action`, `categoryTrends.key.spentMonth`, `categoryTrends.key.earnedMonth`.

## Approved screens

| Screen | State | File |
|---|---|---|
| Categories | No expenses in range | `approved/categories.empty.html` |
| Categories | No incomes in range | `approved/categories.empty-incomes.html` |
| One category | Per month, spending up (red) | `approved/category.per-month.html` |
| One category | Per month, spending down (green) | `approved/category.per-month-down.html` |
| One income category | Per month, income up (green) | `approved/category.per-month-income.html` |

Not drawn separately: Spanish per month (same layout, longer legend, one line at 375px);
the no-entries state and the sheet are unchanged apart from the grouped back link, shown in
`../../category-trends/ui/approved/`.

## Options considered

### a-quiet

- **Empty:** the same card, button removed, one line: "Nothing to compare in this
  range yet." Pure removal, what was asked.
- **Back:** a chevron button joins the left edge of the category picker, one
  split control, no extra row (saves about 3rem). Label is "All categories" for
  screen readers; the picker's end icon becomes a swap icon so the two chevrons
  do not clash.
- **Chart:** each segment is coloured by the month against the month before it
  (red up / green down for expenses, flipped for incomes). Legend explains it.
  *Costs:* the back affordance is icon-only.

### b-guided

- **Empty:** button removed; a **secondary** "Show the last 12 months" widens the
  range (the thing that actually helps) and is not an add action. Pushback: if a
  range is empty the user's next question is "is there data elsewhere?".
- **Back:** the selected "Categories" segment of the scope switch shows a ‹ and
  returns to the list; no extra row or control. *Costs:* least discoverable; a
  selected tab doing "up" is unusual.
- **Chart:** one colour for the whole line and its fill: the direction from the
  first to the last month, matching the headline pill. *Costs:* hides the
  month-by-month ups and downs.

### c-grouped

- **Empty:** no card; a compact info line under the tabs, so the screen stays calm.
- **Back:** "‹ All categories" and the picker share one card, the link as its
  quiet header strip. Text stays visible, the pair reads as "where am I".
  *Costs:* keeps the extra height of today.
- **Chart:** bars per month, each coloured against the month before; the first
  month is grey. Bars suit "amount per month" and make colour unambiguous.
  *Costs:* different look from the Savings trend line.

## Notes

- Per month colours compare with the **previous month**; Change keeps comparing
  with the reference month (hatched where worse). Colour is never the only cue:
  the legend and the screen-reader table state it.
- Equal to the previous month: grey.
- Other states: the no-entries category screen is unchanged.
