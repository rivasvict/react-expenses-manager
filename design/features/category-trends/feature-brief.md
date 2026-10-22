# Category trends

## Problem

The Savings trend screen (`design/features/savings-trend/`) shows whether the
user's *savings* are growing, but not **why**. Spending on one category (eating
out) can creep up while the total looks fine, and nothing in the app shows a
single category over time. The Summary only shows the selected month.

## Goal

For any category the user can see the same kind of information as on the
Savings trend screen:

- the selected month compared with an earlier month, as an amount and a
  percentage (the **Change** view);
- a month-by-month line over a range (**1M … YTD** or custom, whole months);
- the end month moved with the existing month header.

It must be **easy to reach, but add nothing to screens that are already
busy** (dashboard, Summary, category list), and reuse the Savings trend
look (range switch, headline card with tabs, line chart).

## Definitions

- Expense category: the amount spent per month; **less than the reference is
  good** (green), more is bad (red). Income category: the reverse.
- Reference month: the month the range starts at, as on the Savings trend.

## Out of scope

Comparing two categories side by side, budgets/forecasts, per-day views,
changing how buckets work.
