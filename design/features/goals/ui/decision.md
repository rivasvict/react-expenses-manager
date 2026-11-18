---
title: Goals
summary: Put part of each month's savings towards goals with a target and a date, in Strict (by priority) or Relaxed (by %) mode, and see progress, projection and On track / Behind.
status: exploring
---

# Decision

Exploring. Brief: [`../feature-brief.md`](../feature-brief.md). Every option
uses the same example household so they can be compared screen for screen:
Strict mode, evaluated month **October 2026** (saved $1,240.00 of $5,200.00
income), three open goals and one completed, and **September 2026** as a month
that fell short (saved $620.00, goals needed $950.00).

| Goal | Rule | Priority | Saved | Target | Projection |
|---|---|---|---|---|---|
| Emergency fund | $400.00 a month (+$1,000.00 starting) | 1 | $4,200.00 (70%) | $6,000.00 by Jun 2027 | Mar 2027, On track |
| Trip to Japan | 8% of income | 2 | $1,404.00 (40%) | $3,500.00 by Aug 2027 | May 2027, On track |
| New laptop | $150.00 a month | 3 | $450.00 (25%) | $1,800.00 by Feb 2027 | Dec 2027, Behind |
| Winter tires | — | 4 | $900.00 (100%) | $900.00 | Completed |

## What all options share

- **Settings → Goals mode** (Strict / Relaxed) is a setting row that opens a
  bottom sheet, like Language and Currency. While any goal exists the row
  shows a lock and the sheet disables the other mode, with a callout saying
  why and how to switch (remove every goal). Drawn once, in
  `a-goal-cards/settings-mode.html`; it is the same in B and C.
- The same rules (`feature-brief.md`): month savings fund goals when the month
  ends, the current month is "in progress", funding is recomputed from the
  entries, rule edits apply from the month they are made in (D4), pace is the
  last 3 evaluated months (D5).
- Status is a word with an icon, never colour alone: **On track** (check,
  green), **Behind** (clock, amber), **Completed** (flag, gold).
- The add-goal form shows a **live preview** (what the rule puts aside, what
  the target needs, the resulting status) so a goal is never set up blind.
- History of setup changes is listed on each goal ("Target raised from … to
  …").

## Options considered

### A · Goal cards (`options/a-goal-cards/`)

A `/goals` screen built like Buckets: a month header, a summary strip of the
month (Saved / To goals / Free), then one **bucket-style card per goal** with
the progress bar and the bucket screen's **pace tick** (where a straight line
to the target date would put you now), the status pill, the projection and
the month's funding. A goal opens a **full detail screen** (Saved so far /
Left, projection sentence, Setup with Edit, month-by-month funding, Changes,
Remove). Adding is a full form screen.

- **Good at:** feels like a screen the user already knows (Buckets), so it
  needs the least new learning; everything about a goal is on one screen;
  short months are explained in place on each card.
- **Costs:** needs a way in. It is drawn as its own route and would need a
  tab-bar entry (the bar is already full: Home, Categories, Buckets, Fixed
  Entries, Data) or a link from the dashboard; long list once there are many
  goals; the split of the month is only a thin bar.
- **States drawn:** list (October, all funded), September short, empty (with
  the 3-step explanation and the mode note), detail, add form, Settings sheet
  locked.

### B · Monthly split (`options/b-monthly-split/`)

Centres the feature on **where this month's savings went**. The dashboard gets
a small **Goals card** under the savings card (stacked bar of the month's
split, "All 3 goals funded · $274.00 free", a "Behind" warning). `/goals`
shows the month's savings as one stacked bar and the goals as an **ordered
waterfall** (priority, funded / short / not funded) ending in **Free
savings**, with Reorder for priorities. A goal opens in a **tall bottom
sheet**; adding is a tall sheet too.

- **Good at:** makes the Strict and Relaxed mechanics visible: you see the
  savings pour down the priority list and stop, or be shared in proportion,
  which is the hardest part of the feature to understand. Good entry point
  (dashboard) without a new tab.
- **Costs:** projection and history are secondary (inside the sheet); a new
  dashboard card must follow Privacy mode (hidden figures); four categorical
  colours per goal cap legibility at about 6 goals; drag-to-reorder is new
  interaction to build.
- **States drawn:** dashboard card, October split, September short (Strict),
  September short (Relaxed, proportional), goal sheet (Behind), add sheet.

### C · Projection first (`options/c-projection/`)

Treats a goal as **a trend towards a target**: Goals becomes a third segment
of the existing **Savings | Categories** switch on the trend screens. The list
shows each goal with a sparkline (saved, projected, target date) and its
status. A goal's screen is a **chart**: saved line, dashed projection at the
recent pace, the target as a gold line, the target date and "Now" marked, with
Progress / By month tabs. A Behind goal offers two **one-tap fixes** (raise
the monthly amount to $338.00, or move the date to Dec 2027). Adding is a
**3-step guided sheet** with a projection preview; the empty screen lets the
user pick the mode before the first goal (Settings keeps the same choice).

- **Good at:** answers "when will I get there?" best and turns Behind into an
  action; reuses the trend screens' chart, tabs and scope switch; no new tab.
- **Costs:** the month's split (why a short month funded less) is one level
  down (By month tab); charts need more build and test work; the mode pick on
  the empty screen duplicates Settings (two places to explain).
- **States drawn:** list, goal On track, goal Behind with fixes, guided setup
  step 2, empty with the mode choice.

## Open questions for the owner

See "Decisions taken for the design" in the brief: D1 (S ≤ 0 funds nothing),
D2 (a goal stops at its target), D3 (Relaxed shortfall is proportional), D4
(rule edits apply from the edit month), D5 (pace = last 3 months), D6 (shared
model), D7 (starting amount), D8 (free savings is not a goal).

## Not drawn yet (for whichever option is approved)

- Spanish and French (longest strings: "Not funded this month", "Strict mode ·
  by priority").
- The Closed goals list, the Remove confirmation (deletes history; the last
  goal's removal unlocks the mode), the Close goal confirmation.
- Edit goal (same form as Add, with the "applies from November" note).
- Error states: target below what is already saved, a date in the past, % over
  100 in total.
