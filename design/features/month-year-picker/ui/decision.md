---
title: Month and year picker
summary: Jump to any month and year with data from the shared month header, on the Dashboard, Buckets, Fixed entries and Savings trend.
status: approved
chosen: a-month-grid
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**A. Month grid sheet.** The month title in the shared `NavigableMonthHeader` becomes a pill with a chevron-down between the Prev/Next steppers. Tapping it opens a bottom sheet with a year stepper and a 4x3 grid of months; one tap on a month jumps there and closes the sheet. It covers the four screens that use the header (Dashboard, Buckets, Fixed entries, Savings trend).

Why it won: the common jump (a few months back, or into last year) is one or two taps; it reuses the bottom sheet and the stepper look the app already has; it needs no confirm step. B (two selects and a confirm) was slower for the common case and C (inline panel) pushed the screen down on small phones.

## For the implementer

- **Reuse:** `BottomSheet` (`src/components/common/BottomSheet/`), the `month-header__step` look for the year stepper buttons, `getMonthLabel` (`src/helpers/savingsTrend/monthLabels.ts`) for month names, `focus-ring` and the tokens already in `NavigableMonthHeader/styles.scss`.
- **New shared component:** `MonthPickerSheet` in `src/components/common/NavigableMonthHeader/MonthPickerSheet/`, plus a row in `design/system/components.md` ("Month picker sheet"). The pill is part of `NavigableMonthHeader`.
- **Pill:** the `h1` keeps the month title and now wraps a button. The button's accessible name is the visible month ("October 2026"); no extra `aria-label`, so the heading and `findByText` still read the title. `aria-haspopup="dialog"`. Focus returns to the pill when the sheet closes.
- **Behaviour:**
  - The sheet opens on the selected month's year. Years offered are the years that exist in `entries`; the year stepper is disabled at the first and last year.
  - A month is enabled only when `entries[year][month]` exists (the rule Prev/Next use); the others are dimmed and `disabled`. The selected month is gold with `aria-pressed="true"`.
  - Tapping a month dispatches `setSelectedDate({ year, month })` and closes. The close button, the scrim and Escape close without changing anything.
  - Single month of data: every other month is dimmed; the pill still opens (no error state exists, only valid months can be picked).
- **Month labels:** short names (`Jan`, `Ene`, `janv.`) with the first letter upper-cased; each month button's accessible name is the full month and year ("March 2025").
- **New strings (English / Spanish):**
  - `monthHeader.picker.title`: Go to month / Ir a un mes
  - `monthHeader.picker.close`: Close / Cerrar
  - `monthHeader.picker.previousYear`: Previous year / Año anterior
  - `monthHeader.picker.nextYear`: Next year / Año siguiente
  - `monthHeader.picker.legendSelected`: Selected / Seleccionado
  - `monthHeader.picker.legendDimmed`: Dimmed: no data yet / Atenuado: aún sin datos
  - French text goes in `fr.ts` as well.
- **Version:** this is an app change, so bump the version and add a changelog entry in the implementation PR.

## Approved screens

| Screen | State | File |
|---|---|---|
| Month header | default (closed) | `approved/header.default.html` |
| Month picker | default | `approved/picker.default.html` |
| Month picker | first year with data | `approved/picker.first-year.html` |
| Month picker | Spanish | `approved/picker.es.html` |
| Month picker | one month of data | `approved/picker.one-month.html` |

## Options considered

See the explored mockups under `options/` (A, B, C).
