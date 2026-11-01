# Bucket card text

## Problem

On a real phone (CA$, about 390px) each bucket card on `/buckets` reads as
unfinished:

- "Spent: CA$106.15" and "Remaining: CA$28.64" no longer fit side by side, so
  Remaining drops to its own line, right-aligned, under a left-aligned Spent.
  The result looks staggered by accident.
- "Allowance CA$200.00 + carried CA$0.00 (-CA$65.21)" wraps mid-sentence
  ("carried / CA$0.00 (-CA$65.21)"), and the debt notation is cryptic: the
  card says `CA$0.00` and then a negative number in brackets.
- The number people care about most (how much is left) is the same size and
  weight as everything else.
- The percentage shows two decimals (78.75%), which is noise on a phone.

## Goal

A card that reads in one glance ("how much is left, am I OK?"), never wraps in
the middle of an amount or a phrase, and explains carried-over money in plain
words. Wording may change; nothing else about buckets does.

## Data on every card

name, usage %, spent, remaining, allowance (the monthly limit) and carried-over
(can be negative: debt from earlier months). Available = allowance + carried;
remaining = available - spent.

## Constraints

- 320-390px wide, every theme, EN/ES/FR (ES/FR run about 30% longer).
- Long bucket names, amounts up to CA$55,000.00, over-budget (remaining
  negative, usage above 100%), carried debt, carried surplus, 0% usage.
- The whole card stays one link to the bucket's edit page.
- Colors only from the design tokens (green / amber / red bar tones as today).

## Out of scope

The bucket data model, how remaining/carry are computed, the bar thresholds
(65% / 85%), the edit and add screens.
