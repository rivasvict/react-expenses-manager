# Privacy mode

## Problem
Opening the app in public puts the whole month on screen: savings, incomes,
expenses, the percentage change and the chart. The owner does not want to share
that with whoever is standing next to them.

## Goal
A **Privacy mode** setting. When it is on, the app opens with money figures
hidden by default and the user chooses when to show them. When it is off, the
app looks and behaves exactly as it does today.

## Constraints
- Stored on this device only (`localStorage`, like the language and currency),
  never in the entries model, the backup format or the sync server.
- Hidden means hidden: no real digits in the DOM text a screen reader or a
  screenshot of the page could pick up while masked, and the masked form must
  not leak the magnitude (same width for every amount) or the direction
  (no up/down arrow or green/red tint).
- Design-system components and tokens only; 375px first; every string in
  English, Spanish and French.

## Which figures
Savings, incomes and expenses totals, the change percentage and its arrow, the
doughnut split, and (when the design is approved) the same treatment on the
other screens that show money: the incomes/expenses lists, summary, savings
trend and buckets. The mockups draw the dashboard, the screen shown on open.

## Out of scope
A PIN or biometric lock, hiding descriptions or category names, hiding data in
the CSV export, and anything about the sync server.
