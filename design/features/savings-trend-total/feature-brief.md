# Savings trend: total saved

## Problem

The Savings trend screen (`design/features/savings-trend/`) answers "is the
month I am looking at better or worse than an earlier one?". Its big figure is
the **change**: the end month's savings minus the reference month's savings
(`+$340.00`, ▲ 26.6%). That is a comparison of two months and nothing more.

It does not answer the other question people ask about their savings:

> **How much have I actually saved over this stretch?**

## Goal

Show the user **two pieces of data** on the same screen, without confusing them:

1. **Change** (exists today): end month vs reference month.
2. **Total saved** (new): the savings of every month in the range added
   together, i.e. what the range as a whole put aside.

## Definitions

- **Savings** of a month: incomes minus expenses (the dashboard hero figure).
  A month with no entries counts as $0.00.
- **Total saved** of a range: the sum of the savings of every month from the
  reference month through the end month, both included. It follows the range
  switch (1M ... YTD, custom) and the month header exactly like the change does.
- **Average per month** (supporting figure): total saved / number of months.
- A negative total is possible and is shown with a minus and the expense tone.

## Constraints

- Design system only; no new tokens. Sign is never colour alone.
- The two figures must not read as the same thing: the change is a *difference*
  (signed, green/red, with a percentage); the total is an *amount* (neutral
  when positive).
- Must fit the existing screen (month header, range switch, chart) and the
  existing "not enough history" states, which are unchanged.
- English, Spanish and French copy for every new string (Spanish runs ~30%
  longer).

## Out of scope

- A lifetime total ("since my first entry") independent of the range.
- Changing the dashboard or its savings card.
- Changing how savings, ranges or the percentage are computed today.
