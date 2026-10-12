---
title: Privacy mode
summary: A Settings switch that makes the app open with money figures hidden, revealed on demand; off looks exactly like today.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Not chosen yet.

## Options considered

**A · Masked in place** (`options/a-masked-in-place/`). The dashboard keeps its
layout, but every figure becomes a row of dots (`••••••`), the percentage pill
becomes `•••` on a neutral tint (no arrow, no green or red), the doughnut
becomes a plain grey ring and the row chips lose their tint. An **eye chip** in
the app bar (next to the settings gear, gold while figures are hidden) reveals
everything; tapping it again hides again. A reveal lasts until the app is
closed or sent to the background. Settings gets one **Privacy mode** switch row.
*Good at:* the screen still looks like the dashboard, one tap shows it all,
least new UI. *Costs:* an extra chip in the app bar on every screen; the
layout still hints that there is a balance, a chart and two rows.

**B · Cover card** (`options/b-cover-card/`). The figures, chart and rows are
replaced by one calm card with a lock icon, "Figures are hidden" and a single
gold **Show figures** button. Month stepper and the two Add buttons stay, so
entries can be added without revealing anything. Showing lasts until the user
leaves the screen. Settings gets the switch plus a **Hide again** row (a sheet:
when leaving the screen / after 1 minute / after 5 minutes).
*Good at:* strongest privacy (nothing about the shape of the month is shown)
and a very clear "this is deliberate" message. *Costs:* the dashboard no
longer looks like itself while hidden, a second setting with its own sheet,
and the other money screens need their own cover (a list of rows becomes the
same card).

**C · Blur and peek** (`options/c-blur-and-peek/`). Figures stay in place but
blurred; a one-line strip says how to use it. **Tapping a figure shows only
that one for 5 seconds**, then it blurs again; the chart is blurred too.
Settings gets one switch row. *Good at:* quick, per-figure glances without
exposing everything. *Costs:* weakest hiding (blur still shows how many digits
and where the figures are; the real text must not stay in the page, so the
blur needs a placeholder of fixed width in practice), a timer to build and to
explain, and tapping on the hero also navigates to Summary today, so peek
needs a rule for that tap.

## Non-default states

- **Revealed**: A draws it (`dashboard.revealed`: plain eye chip, real
  figures, identical to today's dashboard). B's revealed state is today's
  dashboard unchanged; C's is the peek state
  (`dashboard.peek`).
- **Empty month**: a month with no entries still masks `$0.00` (otherwise the
  mask would say "nothing here"); A and C keep the masked rows, B shows the
  same cover.
- **Error**: none; the preference reads from `localStorage` and an unreadable
  value falls back to off (as language and currency do).

## Open questions for the owner

1. Should the setting **default to on** for new installs, or off (matches
   "looks exactly like now" until chosen)?
2. Should hiding also cover the **incomes / expenses lists, Summary, Savings
   trend and Buckets**? The mockups assume yes; each option extends its own
   treatment (mask in place, cover card, or blur).
3. Should reveal survive a page reload, or always re-hide on open? The mockups
   assume it always re-hides on open, which is the point of the feature.

## Notes for building (if approved)

- New shared pieces: a **Masked amount** component (renders the mask, never the
  real value, when hidden), a **Privacy toggle chip** (A) or **Cover card**
  (B), and a **Switch row** in Settings (the switch already exists as
  `.form-check-input`); each gets a row in `design/system/components.md`.
- Strings needed in English, Spanish and French: "Privacy mode", its hint,
  "Show figures" / "Hide figures", "Figures are hidden", and each option's
  extras.
- The mask is a fixed-width run of dots so it never leaks the amount's
  magnitude; the spoken label is "Amount hidden".
