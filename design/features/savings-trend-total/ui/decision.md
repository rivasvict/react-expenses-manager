---
title: Savings trend, total saved
summary: Three ways to show the total saved across a range next to the existing end-month-vs-reference change on the Savings trend screen.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Builds on the implemented
[`savings-trend`](../../savings-trend/ui/decision.md) screen; nothing there changes
except where an option says so.

## Options considered

**a-side-by-side.** The headline card becomes two equal columns: *Change*
(today's figure, pill and caption) and *Total saved* (the sum of every month in
the range, the span, and the monthly average). The chart is untouched.
Good at: both numbers visible at once, no new control, smallest build.
Costs: figures shrink from 2rem to 1.45rem to fit; the chart only explains the
change, so the total has no picture; long Spanish labels wrap inside a column.

**b-one-figure-switch.** A two-tab control (*Change* | *Total saved*) sits at the
top of the headline card. The headline and the chart both switch: the chart
becomes the running total (green above $0). Good at: keeps the full-size 2rem
figure and a matching chart for each question, so each is explained. Costs: only
one number is visible at a time (the other is a tap away, and the user may never
find it); a second control under the gold range switch; a second chart mode to
build and test.

**c-paired-blocks.** Two labelled blocks stacked: *Change* (figure + monthly
chart, as today) then *Total saved* (figure + a compact running-total
sparkline). Good at: both numbers always visible at full size, each with its own
picture, no hidden state. Costs: the screen grows by about 150px so the total
sits partly below the fold on a phone; two charts to build.

**d-headline-plus-total-row** (added after the design review). Today's headline
card and chart stay as they are; one compact neutral row under the headline
reads *Total saved $8,720.00* with the span, month count and monthly average,
and the chart note says the total adds up every month. Good at: both numbers
visible with the change keeping the lead, about +56px, no new control, no second
chart. Costs: the total has no picture of its own (the footnote explains it).

## Design review (one round)

A separate reviewer ranked **D (A+C hybrid) > C > A > B**. Main findings:
B hides the total behind a tab (undiscoverable) and stacks a second selector under
the gold range switch; its green running-total area also reuses the
"green = positive change" meaning for a plain amount. C is clear but adds about
150px and a second chart that can look like a repeat of the first. A's equal-weight
columns crowd the figure and wrap the caption. Applied in D: neutral total row,
year in the span, "avg per month", the no-entries footnote. Still open for
approval: negative-total wording ("net spent"), 1M ("2 months"), and
Spanish/French labels ("Ahorro total", "Total épargné").

## Other states

- *Not enough history* and *short range* use the existing notice card for all
  three options; the total is not shown in them.
- A month with no entries counts as $0.00 in the total, as in the chart.
- Negative total: the amount takes the expense tone with a true minus.
- Spanish and French run about 30% longer; each option wraps labels rather than
  truncating them.
