---
title: Settings UX
summary: Settings becomes two value rows; Language opens a list sheet and Currency opens a symbol-and-code grid sheet.
status: implemented
chosen: d-sheet-list-and-grid
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**d-sheet-list-and-grid**, chosen by the owner. `/settings` shows one card with
two rows (label, short hint, current value, chevron). Tapping a row opens a
bottom sheet: **Language** holds today's option list, **Currency** holds a
3-column grid of symbol + code tiles. Picking a value applies it at once and
closes the sheet.

Why the others did not win: **a** needs two new routes and a page change per
setting; **b** keeps everything on the page but needs a 12-tile grid and a
segmented control on a screen that should stay calm; **c** has the right
landing page but its plain list makes the long currency list scroll inside the
sheet. D keeps C's page and sheet pattern and gives each control the shape that
fits its data.

## For the implementer

### Behaviour the screens do not show

- Tapping a row opens its sheet; only one sheet is open at a time.
- **Picking a value applies it immediately and closes the sheet** (the language
  and currency are stored on this device exactly as today). Picking the value
  that is already selected just closes the sheet.
- The sheet closes with the Close (x) button, the scrim, or Escape. On close,
  focus returns to the row that opened it. On open, focus goes to the sheet's
  heading (as in the Savings trend custom range sheet).
- The row's value follows at once: Language shows the language's own name
  (English, Español, Français); Currency shows `<symbol> · <code>`.
- Options are radios (`role="radio"` in a `radiogroup`) so a screen reader hears
  the selected one. Each currency tile's accessible name is its full name
  (for example "US Dollar"); the tile itself shows only the symbol and code.
- The language list keeps today's rows: native name, plus the name in the
  current language as a hint when it differs (Español with "Spanish"), and the
  gold-soft wash and a check on the current one.
- No error or empty state: an unreadable or unknown stored value falls back to
  English / US Dollar as today.
- Spanish text runs longer; row values stay on one line and the labels wrap.
  The currency sheet's description is long (5 lines in Spanish): the sheet
  scrolls (`max-height: 85vh`) rather than clipping.

### Reuse

- `MainContentContainer`, the settings card (`card` mixin) and `VersionLabel`
  stay; the bottom "Go Back" stays.
- The sheet follows `src/components/common/SavingsTrend/CustomRangeSheet/`
  (scrim, panel, grabber, heading, close chip, Escape, `$scrim`, `$shadow-pop`,
  z-index 110/111). Extract that chrome into a shared **Bottom sheet**
  component so Settings does not copy it.
- Option rows: today's `.settings-option` look (move its styles with the
  component). Money/figures mixins are not needed.

### New shared components (add a row to `design/system/components.md`)

| Component | Where |
|---|---|
| Bottom sheet (scrim + panel + grabber + heading + close chip) | `src/components/common/BottomSheet/` |
| Setting row (label, hint, value, chevron; opens a sheet) | `src/components/Settings/SettingRow/` |
| Option tile grid (symbol + code radio tiles) | `src/components/Settings/CurrencySheet/` |

No new token.

### New strings (`en.ts`, `es.ts`, `fr.ts`)

| Key | English | Spanish | French |
|---|---|---|---|
| `settings.language.hint` | Applies right away | Se aplica al instante | S'applique immédiatement |
| `settings.currency.hint` | Symbol and format only | Solo símbolo y formato | Symbole et format uniquement |
| `settings.sheet.close` | Close | Cerrar | Fermer |

The sheet headings reuse `settings.language.title` / `settings.currency.title`
and the sheet descriptions reuse `settings.language.description` /
`settings.currency.description`.

## Approved screens

| Screen | State | File |
|---|---|---|
| Settings | default (English) | `approved/settings.default.html` |
| Settings | Spanish | `approved/settings.es.html` |
| Language sheet | default | `approved/language-sheet.default.html` |
| Language sheet | Spanish | `approved/language-sheet.es.html` |
| Currency sheet | default | `approved/currency-sheet.default.html` |
| Currency sheet | Spanish | `approved/currency-sheet.es.html` |

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
