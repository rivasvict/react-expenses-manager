# Privacy mode polish: brief

Follow-up to [`../privacy-mode/`](../privacy-mode/ui/decision.md) (implemented).

## Problems (owner feedback)

1. **The eye crowds the blurred Savings amount.** In the hidden dashboard the
   eye chip (2.2rem, absolutely positioned beside the "Savings" label) overlaps
   the top of the blurred hero figure. Simply adding space pushes the Add
   Income / Add Expenses buttons further down and needs more scrolling.
2. **The hidden chart feels like empty space.** A flat grey ring with grey
   legend dots at 214px tall says nothing; it reads as a blank gap.

## Goal

Remove the crowding and make the hidden chart area earn its place, **without
making the dashboard taller** (ideally shorter), and without changing the
approved privacy rules: only the dashboard hides; no real figure or digit
count in the DOM; off looks exactly like today.

## Out of scope

Settings, other routes, the hiding rules, the shown (revealed) state beyond
where the eye lives.
