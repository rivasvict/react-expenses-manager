# Settings UX

## Problem
`/settings` shows two cards, Language (3 rows) and Currency (12 rows), each with
every choice laid out as a full-width row. Currency alone is ~900px of scrolling
to change something most people set once, and the page reads as two long lists
rather than "my preferences". It also will not scale: every new setting or
currency adds more rows.

## Goal
Make the current choices visible at a glance, make changing one quick, and keep
room for more settings, without losing the existing behaviour (applies at once,
stored on this device only, nothing converted).

## Constraints
- Same behaviour and storage; Spanish/French strings run ~30% longer.
- Design-system components and tokens only; 375px first.
- Currency names/symbols as in `currency.ts`; language shown by native name.

## Out of scope
New settings, theme, changing what the preferences do.
