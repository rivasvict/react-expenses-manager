---
title: Bucket card text
summary: Rework how a bucket card says what is spent, what is left and what was carried over, so nothing staggers or breaks mid-amount on a phone.
status: exploring
---

# Decision

Open. Five options on the same data (see the brief, `../feature-brief.md`).
Each has `buckets.html` (typical month: carried debt, carried surplus, over
budget) and `buckets.stress.html` (a very long name, CA$55,000.00 carried,
usage above 100%, a large carried debt).

Shared across all of them, because the old text is the problem:

- The percentage is shown whole (79%, not 78.75%).
- "Remaining" becomes **left** (or **over** when negative, in the red tone), and
  the over amount is shown without a minus sign.
- A carried debt is never written as `CA$0.00 (-CA$65.21)` again: it is
  "owed from earlier months", a surplus is "carried over".
- Every amount is kept whole (`white-space: nowrap` around each figure); when
  a line is too narrow, the next item drops to the next line instead of an
  amount splitting.

## Options considered

**A · Remaining first** (`options/a-remaining-first/`). The amount that is left
becomes the card's headline (1.45rem, with "left" / "over" beside it), under
the name. The bar follows, then one muted sentence: "CA$106.15 spent of
CA$134.79" (134.79 is the month's allowance after carry). A second, quieter
line appears only when something was carried: "CA$200.00 allowance, less
CA$65.21 owed from earlier months". Best at answering "am I OK?" at a glance
and at carrying the explanation in a full sentence. Costs: the tallest card
(about 20px more than today when a carry note shows), and three new strings
with plurals of nothing but amounts.

**B · Ledger** (`options/b-ledger/`). Name and %, the bar, then the card is a
small statement: label on the left, amount on the right, one row each for
**Allowance**, **Owed from earlier months** (red, with a minus) or **Carried
over** (with a plus) when there is any, and **Spent**, then a rule and a bold
**Left** (or **Over**, red). Every number is always shown and always in the
same place, so cards compare row against row down the list; an amount can never
wrap because it sits alone on the right. Costs: the tallest card (four or five
rows, about 60px more than today), and the most new short labels to translate;
on a list of many buckets it is the busiest.

**C · Quiet card** (`options/c-quiet-card/`). The least text. Name and %, the
bar, one line: "**CA$28.64** left" and "CA$106.15 spent". Carried money is only a
small tinted tag when there is any ("CA$65.21 owed from earlier months" in the
red wash, "CA$8.71 carried over" in the green wash). The allowance and the
available amount are not on the card: they are one tap away on the bucket's
edit page, which the card already links to. Shortest cards and the calmest
list, which matters most for people with many buckets. Costs: information
moved out of the list (allowance is no longer visible without a tap), so the
edit page should show "Available this month" in the same change.

**D · Ledger, short label** (`options/d-ledger-short/`). Option B with one
change: the carry row is just **Carried**, with the sign and the tone saying
what it is (red "−CA$65.21" for money owed from earlier months, green
"+CA$8.71" for a surplus). B's label "Owed from earlier months" wrapped onto two
lines on a phone and, next to a large amount, risked crowding it; "Carried" is
one short word (ES "Arrastrado", FR "Reporté") and one label serves both
cases, so there is also one string less to translate. The cost is a little
less self-explanatory for someone who has never seen a carried debt: the red
minus has to do the explaining.

**E · Compact** (`options/e-compact/`). The ledger squeezed to what a person
reads: under the bar, two figures side by side, **Spent** (left) and a larger
**Left** or **Over** (right, red when over). Everything else is one muted
footnote under a hairline: "Allowance CA$200.00" and, only when there is
carry, "Carried −CA$65.21" (red) or "Carried +CA$8.71" (green). That is two
short lines of text instead of four or five rows, about a third shorter than
B and D. Each footnote part is kept whole and wraps as a unit. When both
figures are too wide to share a row (a 320px screen with CA$50,000.00), Left
drops to its own right-aligned line instead of overflowing (drawn in the
stress file). Costs: the allowance and carry are small and muted, so a person
who wants to audit them reads a footnote rather than a row; "Available" is not
shown at all.

## What the other states look like

Empty (no buckets yet) is not touched. Loading: the app reads buckets from
local storage, so there is none. A bucket at 0% shows the full amount as left
and no tag in A and C (no carry), and a zero spent in B.

## Recommendation

**A** for most people: it answers the question in the first number, keeps all
the information of today's card, and gives carried money a real sentence. **B**
if the owner wants every figure visible at all times; **C** if the owner would
rather trade the allowance line for a calmer list.
