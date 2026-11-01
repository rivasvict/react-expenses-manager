---
title: Privacy mode polish
summary: Stop the eye crowding the blurred Savings amount and give the hidden chart area a purpose, without making the dashboard taller.
status: implemented
chosen: d-hybrid-header-and-cta
---

# Decision

**D · Hybrid** chosen by the owner. The eye moves to the top-right of the
Savings tile (same place hidden and shown); the hidden doughnut is replaced by a
full-width **Show figures** button; the Add buttons stay pinned to the bottom.

## For the implementer

- Eye: absolutely positioned `top: 0.55rem; right: 0.55rem` over the tile (it
  cannot sit inside the Summary link); 2.2rem visual, invisible hit area
  `inset: -0.3rem` (>=44px). No label spacer any more. The chevron aligns to the
  amount line (`align-items: flex-end`); the amount does not move.
- Hidden chart area: one button (`min-height: 2.75rem`, `$accent-soft` fill,
  `$accent` text, eye-closed icon + `privacy.show` text, margin `0.2rem 0 1.1rem`)
  that reveals the figures, same action as the eye. The real chart is not
  rendered while hidden. When revealing with Privacy mode on, the chart slides
  in with `SlideReveal` (no animation under reduced motion). The old
  `HiddenBalanceChart` and the `privacy.chartHidden` key go away.
- No new strings: reuses `privacy.show` / `privacy.hide`.
- Privacy mode off: unchanged from today.

Approved screens: `approved/dashboard.hidden.html`, `dashboard.hidden-es.html`,
`dashboard.shown.html` (see `flow.json`, `fixtures.json`).


Brief: [`../feature-brief.md`](../feature-brief.md). Baseline: the hidden
dashboard of [`privacy-mode`](../../privacy-mode/ui/approved/dashboard.hidden.html).

## Options considered

**A · Eye by the amount** (`options/a-eye-by-the-amount/`). The eye moves out of
the label row to the *right of the amount*, vertically centred on it, with a
clear gap before the chevron. The label row is clean, so nothing overlaps and
the hero tile does not grow. The hidden ring becomes a **slim grey bar** with the
same legend (about 4rem instead of 13.4rem). *Good at:* biggest saving in
height (Add buttons move up ~150px only on short phones (the buttons are pinned to the bottom, so on a tall phone ~50px and a gap opens above them)), eye stays next to what it protects.
*Costs:* the eye position differs from the label-row spot the shown state uses
today (the shown eye moves too, to stay consistent); the page grows ~150px when
revealed (animate with `SlideReveal`).

**B · The chart is the reveal** (`options/b-chart-is-the-reveal/`). While hidden,
the hero tile has **no eye at all**: the ring shrinks to a calm placeholder and
its centre becomes a large **Show figures** button (eye + text). The empty space
now has a job and the hero has nothing to collide with. Revealed state is
exactly today's. *Good at:* zero collision, big friendly target, a smaller 38px jump on reveal, small saving (~38px). *Costs:* the
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

**D · Hybrid: header eye and Show figures button** (`options/d-hybrid-header-and-cta/`).
Added after the designer review. C's hero row (label left, eye right in both
states, with a larger invisible hit area and the amount pulled up so the tile
does not grow; the chevron drops beside the amount, away from the eye) plus B's
idea for the middle: the ring is replaced by one full-width **Show figures**
button (~56px instead of 214px). The Add buttons stay pinned to the bottom as on
every other screen. *Good at:* no collision, one toggle place in the hero in both
states, the middle area has a job, ~160px saved on short phones. *Costs:* the
reveal still jumps content on short phones (animate with `SlideReveal`, none
under reduced motion); two controls do the same thing.

## Designer review summary

Ranking C, A, B, then the D hybrid. Shared findings: the eye is 35px, below 44px
(give it a hit area); a note must not be `role="status"`; the eye should swap
its label (or `aria-pressed`); reveal jumps are unavoidable on short phones.

## Non-default states

- **Shown**: A and C draw it (`dashboard.shown`) with the eye in its new place;
  B's shown state is today's dashboard.
- **Long text**: B has a Spanish mockup (`dashboard.hidden-es`); labels are
  max-width constrained inside the ring. A and C add no text beyond C's note,
  which wraps to two lines.
- **Empty month / error**: unchanged from privacy-mode (same placeholders; the
  mask must not reveal "nothing here").
