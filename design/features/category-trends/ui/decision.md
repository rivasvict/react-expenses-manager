---
title: Category trends
summary: Show a category's spending (or income) over time with the Savings trend's range switch, headline card and line chart, reached without adding anything to busy screens.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Nothing is chosen yet.

All options share one **category trend screen**: month header, a picker row
naming the category, the 1M–YTD range switch, a headline card with a
**Per month / Change** tab pair, and the line chart (accent line over a
baseline for *Per month*; dashed reference line, green where spending fell and
red hatched where it rose for *Change*; colours flip for income categories).
They differ in **how the user gets there** and what they see first.

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

## Other states

Every option needs, and the approved package will draw: **empty** (no entries
in the range; drawn in A as "Nothing spent on Travel yet"), a range that
reaches before the category's first entry (the Savings trend's history notice),
a category with a single month (no line, figures only), the Spanish layout
(longer labels: "Gasto por mes", "Cambio"), and an income category (colours
flipped, wording "Earned"). Spanish and French copy is added at build time.
