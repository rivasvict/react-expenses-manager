---
title: Category trends polish
summary: No add-entry CTA on an empty category list, a back link that belongs to the screen, and a red/green Per month chart.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Not chosen yet. Each option
bundles an answer to all three points; any point can be mixed across options.

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

## Notes for any option

- Per month colours compare with the **previous month**; Change keeps comparing
  with the reference month (hatched where worse). Colour is never the only cue:
  the legend and the screen-reader table state it.
- Equal to the previous month: grey.
- Other states: the no-entries category screen is unchanged.
