# Savings trend

## Problem

The dashboard's savings badge (`design/features/savings-delta/`) answers one
narrow question: did the selected month save more or less than the month
before? A single month-over-month figure is noisy (one big bill flips it red)
and says nothing about direction over time. The user's real question is:

> **Am I progressing towards growing my savings?**

## Goal

A separate **Savings trend** screen where the user:

- sees how the selected month's savings compare with an earlier month, or
  with a stretch of months/years, as an amount and a percentage;
- reads it from a **line chart** whose area is **green where the change is
  positive and red where it is negative**;
- picks the range with one tap from presets: **1M, 2M, 3M, 6M, 1Y, YTD**;
- can set a **custom range** in whole months (from month/year to month/year);
  never days or weeks;
- can move the end of the range to a previous month (not only "now").

It must be **easy to discover from the dashboard**, without adding a tab, a
pile of buttons or links, and must look like the rest of the app.

## Definitions

- **Savings** of a month: incomes minus expenses (the dashboard hero figure).
- **End month**: the selected month (the dashboard's month header); defaults to
  the current month.
- **Preset ranges** count back from the end month: `1M` compares with the month
  before, `6M` with six months before, `1Y` with the same month a year before,
  `YTD` with January of the end month's year (in January, YTD equals 1M's
  start: there is nothing earlier in the year, so YTD is disabled).
- **Delta**: `(end − reference) / |reference| × 100`, as the savings badge
  already defines it, plus the plain amount difference.

## Constraints

- Design system only (`design/system/README.md`). Green is `--income`, red is
  `--expense`; no new tokens. That pair fails colour-blind separation (ΔE 4.6
  deutan, measured), so the sign is **never colour-alone**: position against
  the baseline, a hatch texture on the red area, and ▲/▼ signs on figures.
- Every string in English and Spanish; Spanish month names run long.
- Computed from the entries already in Redux; no storage, backup or sync change.
- No new tab in the bottom bar (it already has five).

## Known caveat

The current month is usually in progress, so the end month may look worse than
it will be. The savings badge has the same caveat; a "month to date" mode stays
out of scope.

## Out of scope

- Daily or weekly ranges.
- Per-category trends, forecasts or goals.
- Changing the existing savings badge's rules.
