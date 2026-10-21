---
title: Category trends
summary: A Savings | Categories switch at the top of the trend screen opens a ranked list of category changes and a per-category trend that reuses the Savings trend's range, tabs and chart.
status: implemented
chosen: d-scope-switch-in-title
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**d-scope-switch-in-title**: C's ranked overview and category detail, reached
with a two-segment switch that replaces the "Savings trend" eyebrow.

- **Switch.** `Savings | Categories` (icons: trending-up, four squares). It sits
  where the eyebrow was, so the screen gains no height and the switch is in view
  on arrival. Selected = gold-soft wash + gold outline (the gold range switch
  stays the only solid gold control). Month and range carry over when flipping;
  the screen opens on Savings, as today. Both views share the month header and
  the 1M–YTD range switch.
- **Categories view** (`/category-trends`). Expenses / Incomes underline tabs
  (existing `UnderlineTabs`), a one-line subtitle, then rows ranked by the size
  of the change between the range's start month and the end month. Each row:
  name, "was $380.00", a sparkline, the end-month amount and a change pill.
  Tap a row to open the category.
- **One category** (`/category-trends/:type/:name`). The switch stays on
  Categories; "‹ All categories" returns to the list; a picker row (type
  chip, "Expense category", name, chevron) opens a "Choose a category" bottom
  sheet; then range switch, headline card with **Per month / Change** tabs and
  the line chart.
- **Colour meaning.** Expense categories: spending *less* than the start month
  is green, *more* is red hatched. Income categories flip (more is green).
  Per month uses a neutral gold line over a zero baseline, no good/bad tint.

Why D won over the others: **A** hides the feature inside a management sheet;
**B** puts the switch in a row below the title, which adds height to a screen
tuned to be light; **C** put the entry below the chart where it is easy to
miss. D keeps C's behaviour and fixes its discoverability at no height cost.

This **changes the existing Savings trend screen's top** (the eyebrow becomes
the switch). Its approved screens in `../../savings-trend/ui/` and
`../../savings-trend-total/ui/` keep their content; they gain the switch.
`approved/savings.default.html` shows the combination. Update those packages'
screens (or their fixtures) in the implementation PR.

## As built

Implemented in version 1.36.0. Where the build differs from the first draft of
these screens, the screens were updated to match the shipped components (the
design review compares the two):

- The month title is the **"Go to month" button** added by
  `../../month-year-picker/`, which shipped while this was designed.
- Change pills carry a **sign** as well as the arrow (`ChangePill`'s rule:
  colour is never the only cue), in the list as in the headline card.
- The tabs, list rows, history notice and picker sheet use the real
  `UnderlineTabs`, `HistoryNotice` and category-sheet sizes.
- The Spanish list subtitle starts with a capital ("Octubre frente a abril,
  mayor cambio primero."); chart ticks use the app's short month names
  ("abr"), as on the Savings trend.
- On Change, the legend reads **Less, More** for both types; the colours
  flip for incomes.
- A category that had nothing in the reference month shows a grey **New**
  pill instead of a percentage, and ranks first.

The Savings trend's own approved screens (`../../savings-trend/` and
`../../savings-trend-total/`) were updated to show the switch and the month
button. `savings-trend`'s `trend.up`, `trend.down`, `trend.year`,
`trend.tooltip` and `trend.custom` screens were already out of date before this
change (they predate the Total saved tab) and still differ.

## For the implementer

### Reuse

Month header (`NavigableMonthHeader`), `RangeSwitch`, `ViewTabs` /
`UnderlineTabs`, `TrendChart` (extend for a monthly series and an
inverted-colour mode), `TrendSummary`, `HistoryNotice`, `BottomSheet`,
`TypeChip`, `ChangePill`, `Callout`/`HistoryNotice` look for empty states,
`SelectableChip`-style radio rows in the sheet. Colours only from tokens.

### New shared components (add rows to `design/system/components.md`)

| Component | Where | Notes |
|---|---|---|
| Scope switch (two-segment pill tablist, 2.5rem tall, icon + label) | `src/components/common/SavingsTrend/ScopeSwitch/` | `role="tablist"` with arrow-key support like `UnderlineTabs`; each segment navigates (link semantics) to `/savings-trend` or `/category-trends`, keeping the end month and range in Redux/state. |
| Category mover row (name, "was" line, sparkline, amount, change pill) | `src/components/common/CategoryTrends/MoverRow/` | Whole row is a link. Pill shows whole percent; the headline pill shows one decimal. |
| Sparkline (60×26 SVG polyline, tone by good/bad/flat) | `src/components/common/CategoryTrends/Sparkline/` | Decorative (`aria-hidden`); the row's spoken label carries the figures. A flat series draws a flat line. |
| Category picker row + sheet | `src/components/common/CategoryTrends/CategoryPicker/` | Row is a button that opens a `BottomSheet`; rows grouped Expense / Income categories, each with the end month's amount; selecting closes the sheet and swaps the category in place. |
| Back link ("‹ All categories") | same folder | Gold, 2.5rem tall. |

New tokens: none.

### Behaviour and rules

- **Maths** (new, pure, colocated tests) in `src/helpers/categoryTrends/`:
  monthly total per category over the range, start→end change (amount and
  percent, same percent rule as `src/helpers/savingsChange/`), ranking by
  absolute percent change (ties: larger absolute amount, then name), and
  "good/bad" tone by category type. A category's amount in a month sums entries
  whose `categories_path` matches it (`pathMatchesCategory`).
- **Ranking list:** show every category with entries in the range; a category
  with none is omitted from the list (but stays in the picker, with $0.00).
  A start month of 0 has no percent: show the amount change only and a grey
  "new" pill.
- **Per month** headline: total in the range and the monthly average. **Change**
  headline: end month vs start month, signed amount, pill, "$540.00 vs
  $380.00". The tab stays selected while the month or range changes, and opens
  on **Per month**.
- **Empty list:** no entries of that type in the range → the "No expenses between
  April and October" card with a gold **Add expense** (Incomes: "Add income").
- **Category with no entries in the range** → "Nothing spent on Travel in this
  range" (Incomes: "Nothing earned on …") and a secondary **Choose another
  category**. A range reaching before the first recorded month uses the
  existing `HistoryNotice`.
- **Unknown category in the URL** (renamed or deleted) → redirect to
  `/category-trends`. Renaming a category in the sheet keeps working because the
  route name is the display name.
- **User data is never translated:** category names stay as stored in Spanish
  screens ("Eating out" in `category.es`).
- Privacy mode is dashboard-only; do not hide figures here.
- Long names wrap (`overflow-wrap: anywhere`) in rows and the picker; the row's
  sparkline and figures never shrink below 3.6rem / 5.5rem.
- Spanish months are lower-case in prose ("octubre frente a abril") and
  capitalised on chart axes ("Abr").

### New i18n keys (English / Spanish; French follows the same pattern)

| Key | English | Spanish |
|---|---|---|
| `categoryTrends.scope.group` | Trend of | Tendencia de |
| `categoryTrends.scope.savings` | Savings | Ahorro |
| `categoryTrends.scope.categories` | Categories | Categorías |
| `categoryTrends.subtitle` | {{end}} vs {{reference}}, biggest change first. | {{end}} frente a {{reference}}, mayor cambio primero. |
| `categoryTrends.was` | was {{amount}} | antes {{amount}} |
| `categoryTrends.hint` | Tap a category for its full trend. | Toca una categoría para ver su tendencia completa. |
| `categoryTrends.back` | All categories | Todas las categorías |
| `categoryTrends.view.perMonth` | Per month | Por mes |
| `categoryTrends.kind.expense` / `.income` | Expense category / Income category | Categoría de gasto / Categoría de ingreso |
| `categoryTrends.headline.perMonth` | {{category}}, {{span}} | {{category}}, {{span}} |
| `categoryTrends.headline.change` | {{category}}, {{end}} vs {{reference}} | {{category}}, {{end}} frente a {{reference}} |
| `categoryTrends.key.spent` / `.earned` | Spent in {{reference}} / Earned in {{reference}} | Gastado en {{reference}} / Ingresado en {{reference}} |
| `categoryTrends.key.spentMonth` / `.earnedMonth` | Spent that month / Earned that month | Gastado ese mes / Ingresado ese mes |
| `categoryTrends.key.less` / `.more` | Less / More | Menos / Más |
| `categoryTrends.note.perMonth.expense` | Each point is what you spent on this category in that month. | Cada punto es lo que gastaste en esta categoría ese mes. |
| `categoryTrends.note.perMonth.income` | Each point is what you earned in this category in that month. | Cada punto es lo que ingresaste en esta categoría ese mes. |
| `categoryTrends.note.change.expense` | Green where you spent less than in {{reference}}, red where you spent more. | Verde donde gastaste menos que en {{reference}}, rojo donde gastaste más. |
| `categoryTrends.note.change.income` | Green where you earned more than in {{reference}}, red where you earned less. | Verde donde ingresaste más que en {{reference}}, rojo donde ingresaste menos. |
| `categoryTrends.empty.title` | No expenses between {{from}} and {{to}} | Sin gastos entre {{from}} y {{to}} |
| `categoryTrends.empty.body` | Add an expense and its category will show up here with its trend. | Añade un gasto y su categoría aparecerá aquí con su tendencia. |
| `categoryTrends.none.title` | Nothing spent on {{category}} in this range | No hay gastos en {{category}} en este rango |
| `categoryTrends.none.body` | There are no expenses in this category between {{from}} and {{to}}. Pick a wider range or another category. | No hay gastos en esta categoría entre {{from}} y {{to}}. Elige un rango más amplio u otra categoría. |
| `categoryTrends.none.action` | Choose another category | Elegir otra categoría |
| `categoryTrends.picker.title` | Choose a category | Elige una categoría |
| `categoryTrends.picker.expenses` / `.incomes` | Expense categories / Income categories | Categorías de gasto / Categorías de ingreso |
| `categoryTrends.row.label` | {{name}}, {{amount}}, {{change}} vs {{reference}} | {{name}}, {{amount}}, {{change}} frente a {{reference}} |

Reuse existing keys: `categories.tabExpenses` / `categories.tabIncomes`,
`savingsTrend.view.change`, `savingsTrend.total.months_*` and `.average`,
`savingsTrend.range.*`, `savingsTrend.rangeLabel.*`, `savingsTrend.sheet.close`.
Income variants of `empty.*` / `none.*` ("No incomes between …", "Nothing
earned on …", "Add income") need their own keys. Add French alongside.

## Approved screens

| Screen | State | File |
|---|---|---|
| Savings trend with the switch | Savings (opens here) | `approved/savings.default.html` |
| Categories | Expenses ranked | `approved/categories.expenses.html` |
| Categories | Incomes ranked | `approved/categories.incomes.html` |
| Categories | No expenses in range | `approved/categories.empty.html` |
| Categories | Spanish | `approved/categories.es.html` |
| One category | Per month | `approved/category.per-month.html` |
| One category | Change | `approved/category.change.html` |
| One income category | Change (colours flipped) | `approved/category.income-change.html` |
| One category | Spanish, Change | `approved/category.es.html` |
| One category | No entries in range | `approved/category.no-entries.html` |
| Category picker | Sheet open | `approved/category-picker.default.html` |

Flow: Dashboard › Trend › **Savings | Categories** › ranked list › category ›
Per month / Change; the category row opens the picker.

## Options considered

### a-trend-from-category-sheet

Each category's existing sheet (Categories screen) gets one quiet row under
the usage figures: "$540.00 this month, up from $520.00" and a gold
**Trend ›** link, the same chip-word-chevron the dashboard uses. Nothing is
added to any list. *Good at:* zero crowding, the entry sits where the user is
already looking at one category; tiny build (one row, one route).
*Costs:* two taps from the dashboard (Categories, then a category), and the
sheet is a management place, so discovery depends on users opening it.

### b-scope-on-trend-screen

The existing Savings trend screen gets a "Showing: Savings ▾" row. It opens a
bottom sheet that lists Savings plus every expense and income category, with
the month's amount; picking one swaps the headline and chart in place and
keeps the range, month and tab. *Good at:* one place for every trend, no new
route, nothing new on other screens, easy to flip between categories.
*Costs:* adds a row (about 3rem) to a screen that was tuned to be light, and
a long category list needs search once users have many.

### c-ranked-overview

The Savings trend screen ends with a "By category ›" row. It opens an
overview of the same month and range: Expenses / Incomes tabs and a short
list ranked by biggest change, each row with a sparkline, amount and a change
pill. Tapping a row opens the category trend. *Good at:* answers "why did my
savings change?" without choosing a category first and surfaces what the user
did not know to look for. *Costs:* one more screen, the most copy, and a
list that needs a cap and an empty story.

### d-scope-switch-in-title

C's overview and detail, with a more noticeable way to move between the two
views. The static "SAVINGS TREND" eyebrow becomes a compact two-segment
switch, **Savings | Categories**, with a small icon on each segment. It
takes the eyebrow's slot, so the screen gains no height, and it is always
visible without scrolling (C's link sat below the chart). The selected
segment uses the gold-soft wash with a gold outline, so the gold range
switch below stays the only solid gold control. Month and range carry over
when the user flips, and the screen opens on Savings as today. Inside a
category, the switch stays on Categories and an "‹ All categories" link
returns to the list. *Good at:* the second view is discoverable at a glance
and costs one tap each way. *Costs:* it changes the existing screen's top
(a small risk to Savings trend's design review) and the category detail is
the tallest screen (switch, back link, picker, range, card, chart).
