---
title: Privacy mode polish
summary: Stop the eye crowding the blurred Savings amount and give the hidden chart area a purpose, without making the dashboard taller.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Baseline: the hidden
dashboard of [`privacy-mode`](../../privacy-mode/ui/approved/dashboard.hidden.html).

## Options considered

**A · Eye by the amount** (`options/a-eye-by-the-amount/`). The eye moves out of
the label row to the *right of the amount*, vertically centred on it, with a
clear gap before the chevron. The label row is clean, so nothing overlaps and
the hero tile does not grow. The hidden ring becomes a **slim grey bar** with the
same legend (about 4rem instead of 13.4rem). *Good at:* biggest saving in
height (Add buttons move up ~150px), eye stays next to what it protects.
*Costs:* the eye position differs from the label-row spot the shown state uses
today (the shown eye moves too, to stay consistent); the page grows ~150px when
revealed (animate with `SlideReveal`).

**B · The chart is the reveal** (`options/b-chart-is-the-reveal/`). While hidden,
the hero tile has **no eye at all**: the ring shrinks to a calm placeholder and
its centre becomes a large **Show figures** button (eye + text). The empty space
now has a job and the hero has nothing to collide with. Revealed state is
exactly today's. *Good at:* zero collision, big friendly target, no layout jump
on reveal (same 176px footprint both ways), small saving (~38px). *Costs:* the
control to show lives far from the figure and moves to the hero label row
(today's spot) once shown, so show and hide are in two places; a new button
inside the placeholder.

**C · Collapse the chart** (`options/c-collapse-the-chart/`). The hidden chart is
removed and replaced by a one-line note ("Figures hidden · Privacy mode"). The
eye gets its **own right-aligned row** in the top of the hero tile (label left,
eye right), so there is generous space above the amount. *Good at:* simplest
build, largest net saving (~170px even after the extra 0.5rem of hero row),
honest about being hidden. *Costs:* the dashboard changes shape between hidden
and shown (content jumps ~210px on reveal), and the doughnut's "empty space"
disappears entirely rather than being reinterpreted.

## Non-default states

- **Shown**: A and C draw it (`dashboard.shown`) with the eye in its new place;
  B's shown state is today's dashboard.
- **Long text**: B has a Spanish mockup (`dashboard.hidden-es`); labels are
  max-width constrained inside the ring. A and C add no text beyond C's note,
  which wraps to two lines.
- **Empty month / error**: unchanged from privacy-mode (same placeholders; the
  mask must not reveal "nothing here").
