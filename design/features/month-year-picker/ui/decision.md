---
title: Month and year picker
summary: Jump to any month and year with data from the shared month header, on the Dashboard, Buckets, Fixed entries and Savings trend.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Nothing is chosen yet.

In every option the month title in `NavigableMonthHeader` becomes a pill with a chevron-down, between the existing Prev/Next steppers. Tapping it opens the picker. Months outside the data range are dimmed and disabled, as the steppers already are at the edges.

## Options considered

**A. Month grid sheet** (`a-month-grid`). A bottom sheet with a year stepper and a 4x3 grid of months. One tap on a month jumps there and closes the sheet. Fast and visual, and it reuses the Custom range sheet pattern from Savings trend. It gets tedious with many years, since the year is stepped one at a time. Costs one new sheet component and a short list of strings.

**B. Two selects with a confirm button** (`b-two-selects`). A bottom sheet with native Month and Year selects and a gold "Go to <month year>" button. Needs two taps plus a confirm, but it scales to any number of years, works with the OS pickers and screen readers, and handles long Spanish month names. The least new UI. The options for the selected year's month list are limited to the data range.

**C. Inline panel** (`c-inline-panel`). The header expands in place into a card with year chips, the month grid and a "Latest month" shortcut. There is no sheet or scrim, so the screen below stays visible and moves down. It is the quickest to use and gives a shortcut back to now, but it pushes content down and needs the most layout work on small screens.

## Other states

- **Empty / single month** (C shows it): with only one month of data nothing else can be chosen, so the grid is all dimmed with the note "Add entries in other months to jump between them." The pill still opens, so it does not look broken.
- **Error:** none. Only valid months can be picked.
- A and B show the first year with data (dimmed early months) or Spanish respectively. The remaining states follow the same patterns.

## Recommendation

**A.** The common case is a jump of a few months or into last year, which is one or two taps with a visual grid. It also matches the Custom range sheet. B is the safer fallback if the user expects many years of data.
