---
title: Settings UX
summary: Replace the two long radio lists on /settings with something that shows current choices at a glance and scales to more settings.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Not chosen yet.

## Options considered

**a-drill-in: summary rows, one picker page per setting.** Settings becomes one
short card of rows (label, current value, chevron); tapping a row opens a
full-page picker (`/settings/language`, `/settings/currency`) with the existing
option rows, then Back. Best at: a calm landing page, room for many future
settings, the familiar mobile pattern, and the long currency list gets a full
page. Costs: two new routes/screens, one extra tap and a page transition to
change a value; the picker rows can reuse today's `settings-option`.

**b-compact-controls: everything on one screen, densely.** Language is a
3-way segmented control (native names), currency a 3-column grid of symbol +
code tiles with the full name shown under the grid. Best at: no navigation,
one tap to change, all choices visible; page shrinks from ~15 rows to ~7 rows
of height. Costs: a new segmented-control and tile-grid component, symbols like
`CLP$`/`COL$` are tight at 375px (the grid is 3 columns for that reason), and
it does not scale past ~15 currencies or many more languages. Spanish layout is
drawn in `settings.es.html`.

**c-bottom-sheet: value rows that open a sheet.** The same landing page as A
(rows with the current value), but tapping opens a bottom sheet with the
options, like the Savings trend custom-range sheet and the Filters sheet. Best
at: staying on the page, fast in/out, consistent with existing sheets. Costs:
a long currency list scrolls inside a sheet (sheet needs a sticky title and
`max-height`), and sheets are harder for keyboard/screen-reader users than a
page; reuses the existing sheet pattern so little new CSS.

**d-sheet-list-and-grid: C's rows and sheets, language as a list, currency as a
grid.** The landing page is C's two value rows. Tapping Language opens a short
sheet with today's option list (three rows, native names); tapping Currency
opens a sheet holding B's 3-column symbol + code tile grid with the selected
currency's full name and the "nothing is converted" note under it. Best at: each
control matches its data (a list for 3 languages with readable names, a compact
grid for 12 currencies that fits the sheet without scrolling), one tap to
change, no new routes. Costs: the tile grid is a new component (as in B) and the
sheet pattern's accessibility cost applies (focus trap, Escape to close, return
focus to the row).

## Empty / error story

Preferences are always readable: a missing or unknown stored value falls back to
English / US Dollar (`getStoredCurrency`), and an unreadable `localStorage`
just means the choice is not remembered; there is no error screen.
