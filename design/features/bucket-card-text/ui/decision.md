---
title: Bucket card text
summary: Each bucket card shows Spent and a larger Left side by side, with Allowance and Carried in one footnote, so nothing staggers or breaks mid-amount on a phone.
status: implemented
chosen: e-compact
---

# Decision

**E · Compact**, with the carry label **Carried**, chosen by the owner.

Why E won: it keeps the clarity of the ledger (B and D) at about two thirds of
the height, puts the number people read first (what is left) at the largest
size, and keeps every amount whole. A (headline plus sentences) was close but
its carry sentence was long and wrapped; B's "Owed from earlier months" row
wrapped on 320px; C (quiet card) moved the allowance off the card; D is B with
a short label, which E also uses.

## For the implementer

Build to `approved/buckets.default.html` (English), `buckets.es.html` and
`buckets.stress.html` (the 320px behaviour), and the flow in `flow.json`.
Change only the text layout of `Bucket`
(`src/components/common/ExpensesManager/Buckets/components/Bucket/`); the list,
sorting, thresholds (65% / 85%), colors of the bar, link and test ids stay.

Card, top to bottom:

1. **Name** (left, wraps, `overflow-wrap: anywhere`) and **usage %** (right,
   whole number, `Math.round`, tone green / amber / red as today).
2. **Bar** as today (value capped at 100).
3. **Stats row** (`display: flex; flex-wrap: wrap; justify-content:
   space-between; align-items: flex-end; gap: .5rem .75rem; margin-top:
   .65rem`): **Spent** on the left (caption 0.72rem, 600, uppercase, 0.06em,
   `$text-muted`; value 1rem / 600), **Left** on the right (same caption; value
   1.3rem / 700; `margin-left: auto`). When Left is negative the caption is
   **Over**, the value is the absolute amount and takes `$expense`. Values are
   `white-space: nowrap`; when both do not fit on a row, Left drops to its own
   right-aligned line (see `buckets.stress`).
4. **Footnote**, under a hairline (`border-top: 1px solid $border-subtle`,
   `padding-top: .55rem`, `margin-top: .6rem`; 0.78rem, `$text-muted`;
   `display: flex; flex-wrap: wrap; gap: .1rem .9rem`). Always "Allowance
   CA$200.00"; when carry-over is not zero, also "Carried −CA$65.21" (amount in
   `$expense`) or "Carried +CA$8.71" (amount in `$income`). Each part is
   `white-space: nowrap` so a part never splits and parts wrap as units. The
   minus is a true minus (`−`, U+2212).

Use the existing `money-figures` mixin for tabular figures and the existing
tokens only; no new tokens or shared components. The amounts keep going
through `formatNumberForDisplay`.

### Strings (replace `bucket.spent`, `bucket.remaining`, `bucket.carryOver`)

| Key | English | Spanish | French |
|---|---|---|---|
| `bucket.spent` | Spent | Gastado | Dépensé |
| `bucket.left` | Left | Disponible | Restant |
| `bucket.over` | Over | Excedido | Dépassement |
| `bucket.allowance` | Allowance | Asignación | Montant alloué |
| `bucket.carried` | Carried | Arrastrado | Report |

The labels no longer carry `{{amount}}`: the amount is its own element.
Spanish "Disponible" is the app's existing wording for what is left.
Remove the three keys that are no longer used (and their es/fr text).

### Edge cases

- Over budget (remaining < 0): "Over", red, no minus sign; bar full.
- Carried debt larger than the allowance (availability <= 0): usage is
  `100 + (spent - availability) / allowance * 100` as today (900% in the
  stress screen); the card layout does not change.
- Zero carry: no "Carried" part. Zero spent: "Spent CA$0.00".
- Very long name, CA$50,000.00 allowance: see `buckets.stress`.
- The percentage drops its decimals (79%, not 78.75%); tests that read
  `-percentage` change accordingly.

## Approved screens

| Screen | State | File |
|---|---|---|
| Buckets | default (EN) | `approved/buckets.default.html` |
| Buckets | Spanish | `approved/buckets.es.html` |
| Buckets | long names and large amounts | `approved/buckets.stress.html` |
