---
title: Bucket expenses
summary: Show a bucket's standing and its expenses for the month on the edit-bucket screen while keeping allowance editing.
status: exploring
---

# Decision

Not chosen yet. Data in every mockup: Eating out, October 2026, allowance
CA$300.00, carried −CA$43.37, spent CA$171.83, left CA$84.80, six expenses
(one with a very long description to test wrapping).

## Options considered

**A · Status, expenses, then the form** (`options/a-status-then-form`).
Today's form stays whole but moves to the bottom. Above it: a status card (the
Buckets-list card text: bar, Spent, Left, Allowance, Carried) and the first
four expenses with "Show all 6 expenses". Good: one scroll tells the whole story,
nothing is hidden, least new UI (reuses the bucket card text and money rows).
Cost: Submit sits below a long list, so editing needs a scroll; the longer the
month, the further away the form.
Empty state drawn (nothing spent). Error: the existing validation message
under the field, unchanged.

**B · Overview and Allowance tabs** (`options/b-overview-and-allowance-tabs`).
A two-segment switch (the app's segmented control). **Overview** (default):
status card plus all expenses. **Allowance**: a one-line status strip above the
unchanged form with Submit / Cancel. Good: each tab is short and focused, the
form keeps its place, and the strip keeps the effect of the change in view.
Cost: editing is one tap further, the edit state is a hidden second tab (needs
unsaved-value handling when switching), and a new tab pattern on this screen.
Empty state drawn on Overview.

**C · Read-first, edit in a sheet** (`options/c-read-first-edit-in-sheet`).
A hero card puts **Left** in large type with Spent, the bar, a small
weekly-spending chart, and an "Allowance CA$300.00 · Edit" row. Expenses below
are grouped by week with weekly subtotals. Tapping Edit opens a bottom sheet
with the same field, hint, Submit and Cancel. Good: the best answer to "what is
going on with this bucket" in one glance, and the edit stays one tap away.
Cost: the most to build (weekly chart, week grouping, a sheet; Submit now
closes a sheet instead of leaving the screen, which changes the current
"save then go back" behaviour).
Empty state drawn (no chart, empty note).

## Common to all options
- The Edit-bucket title and the month come from the app's selected month; the
  month label on the card is static (no stepper here).
- Rows reuse the money-row chip (rose up arrow, expenses only).
- Long descriptions wrap (`overflow-wrap: anywhere`); amounts never break.
- Error state for all: the allowance validation message, unchanged. A failure
  to load expenses would reuse the existing empty/error note card.

## Round 2: C with a pace reference (D, E, F)

The owner liked C but asked what the weekly bars mean and for the "expected
spending" level to be shown properly. D, E and F are C (hero card, week-grouped
list, Edit row and sheet unchanged) plus a pace reference. Data: viewed on
Oct 28 (default), Oct 14 (`bucket.ahead`, spending ahead of pace) and Oct 3
with nothing spent (`bucket.empty`). The allowance sheet is C's and is not
redrawn.

**Pace rule (proposed, all three):** available = allowance + carried
(CA$256.63). Expected by today = available × day ÷ days in month. A week's pace
= available × days in that week (inside the month) ÷ days in month, so partial
first and last weeks get a lower line. Under or at pace is green, ahead is
amber (a hint, never red). In a past month the pace is the whole month. If
available is zero or negative, hide the pace and show only Over.

All three add the same two things to C's hero: a **tick on the main bar** at the
expected-by-today position and a line under it, "CA$59.96 under pace" with
"Expected by Oct 28: CA$231.79". They differ in the weekly visualization.

**D · Weekly bars with pace** (`options/d-c-weekly-bars-pace`). C's bars made
legible: titled "Spent per week", each bar labelled with its amount and dates,
a dashed pace line across each bar, green within pace and amber above, a legend
and a one-sentence hint. Closest to C. Cost: five narrow columns with two-line
labels; a month with six weeks gets cramped on a 320px phone.

**E · Week rows** (`options/e-c-week-rows-pace`). No separate chart: each week's
header in the expense list gets a thin bar with a pace tick and "CA$45.65 of
CA$57.95". Labels have room, the number is next to the expenses that cause it,
the hero card stays short, and it scales to any number of weeks. Cost: weeks
are read one at a time, so the trend across weeks is harder to see.

**F · Month pace line** (`options/f-c-month-pace-line`). Drops weeks as a
chart: a cumulative line of spending through the month against a dashed
straight line of even pace up to the available amount, with today marked. Best
at answering "will this bucket last the month?" and it needs no week rule for
the chart (the list stays week-grouped). Cost: a chart type the app does not
use elsewhere, and more to build (SVG scales, step path); less direct for "how
much this week".
