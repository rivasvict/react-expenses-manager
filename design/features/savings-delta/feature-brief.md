# Savings change from the previous month

## Problem

The dashboard shows how much the user saved in the selected month (the
**Savings** figure in the balance hero) and how that splits against expenses
(the donut). It does not say whether that is better or worse than the month
before. To find out, the user has to step back a month with the month header,
remember the number and step forward again.

## Goal

At a glance on the dashboard, the user sees how the selected month's savings
changed against the previous month:

- as a **percentage** (this first version shows only the percentage);
- **green with an up arrow** when savings went up, **red with a down arrow**
  when they went down.

## Definitions

- **Savings** of a month: incomes minus expenses, exactly the figure the
  balance hero already shows (`calculateTotal(incomesSum, expensesSum)` in
  `src/components/Dashboard/components/DashboardContent/index.js`).
- **Previous month**: the calendar month before the **selected** month in the
  month header (not "before today"). Stepping the header back moves both.
- **Change**: `(current − previous) / |previous| × 100`, one decimal
  (`12.5%`). Dividing by the absolute value keeps the sign honest when the
  previous month was negative: going from −$200.00 to $100.00 is `+150.0%`,
  green, up.
- **Nothing to compare**: the previous month has no entries, or its savings
  are exactly $0.00 (a percentage of zero is undefined).
- **No change**: the change rounds to `0.0%`. Neutral colour, no arrow.

## Constraints

- Follow `design/system/README.md`: tokens only. Green is `--income`, red is
  `--expense`, the same semantic pair the rest of the app uses for money in
  and money out, so no new colours are needed.
- Colour is never the only signal: the arrow and the sign carry the meaning
  for colour-blind users, and the indicator has a full spoken label
  ("Savings up 12.5% compared with September").
- Every visible string needs English and Spanish (`src/i18n/`). Spanish month
  names run long ("septiembre"), so the layout must survive them.
- The dashboard must not grow taller than it needs to: the add buttons are
  already near the bottom tab bar on a phone.
- Computed from entries already in Redux; no storage, backup or sync change.

## Known caveat

The current month is usually still in progress, so early in the month its
savings compare a partial month against a full one (often a large drop that
is not real). This first version shows the plain figure; a "month to date"
comparison is a possible follow-up and is out of scope here.

## Out of scope

- Showing the amount difference ($) next to the percentage (a later step).
- Comparisons other than month over month (year over year, averages).
- Deltas on the Summary, Incomes or Expenses screens.
- Changing the donut, the balance hero's link to Summary, or the month header.
