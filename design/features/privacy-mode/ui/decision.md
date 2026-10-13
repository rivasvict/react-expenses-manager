---
title: Privacy mode
summary: A Settings switch that makes the app open with money figures hidden, revealed on demand; off looks exactly like today.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Not chosen yet.

## Owner's direction after round 1

Take **A's reveal-everything model with C's blur**, and keep the app bar as it
is: signed in, it already holds the brand, the gear and the account chip, so a
fourth item there is too much at 375px. Answers to the open questions:
**default off**; **only the dashboard hides** (the lists, Summary, Trend and
Buckets are reached on purpose, so hiding there would be a nuisance); figures
**always hidden on open while the switch is on**. The per-figure 5-second peek
of C is dropped in favour of one reveal for the whole screen; say so if you
want it back. Round 2 (D and E below) only decides *where the control lives*.

## Round 2: where the reveal control lives (blurred figures, nothing new in the app bar)

**D · Eye in the Savings card** (`options/d-eye-in-card/`). A small eye next to
the "Savings" label (gold on a soft wash while hidden, plain when shown). It
sits beside the figure it protects, like a bank app, and costs no vertical
space. *Costs:* a small touch target inside a card that is itself a link to
Summary (the chip needs its own tap area and must not navigate); the eye is
the only hint that figures can be shown.

**E · Status strip** (`options/e-status-strip/`). A full-width bar under the
month header: "Figures hidden · Tap to show" (gold wash) and, once shown,
"Figures shown · Tap to hide" (quiet outline). It explains *why* the numbers
are blurred and is a large target. Tapping a blurred figure also shows
everything. *Costs:* about 3rem of height, which pushes the Add Income/Expenses
buttons below the fold on a short phone (the page scrolls); it is the one
element that appears only while the switch is on.

Both: nothing is added to the app bar, and with the switch off the dashboard
is exactly today's (no eye, no strip).

**Recommendation: E.** It is self-explanatory to someone using the app for the
first time or in a hurry, and its target is generous. Choose D if the extra
row of height matters more than discoverability.

## Round 1 options (kept for reference)

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

## Decided

- Default **off** (nothing changes until the user switches it on).
- Only the **dashboard** hides; other routes always show their figures.
- While on, figures are **always hidden when the app opens**; a reveal lasts
  until the app is closed or sent to the background.

## Notes for building (if approved)

- New shared pieces: a **Masked amount** component (renders the mask, never the
  real value, when hidden), a **Privacy toggle chip** (A) or **Cover card**
  (B), and a **Switch row** in Settings (the switch already exists as
  `.form-check-input`); each gets a row in `design/system/components.md`.
- Strings needed in English, Spanish and French: "Privacy mode", its hint,
  "Show figures" / "Hide figures", "Figures are hidden", and each option's
  extras.
- The hidden figure is a fixed placeholder (for example `$8,888.88`, blurred)
  so neither the real digits nor their count are in the page; the spoken label
  is "Amount hidden". No arrow or green/red tint while hidden; the doughnut is
  a uniform grey ring.
