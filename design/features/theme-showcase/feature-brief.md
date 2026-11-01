# Theme showcase

A companion to [`theme-picker`](../theme-picker/feature-brief.md). It shows
**every theme in the catalog on the same six screens**, so each theme can be
judged against the real UI, not just as a palette. It is not a feature to
build: there is one option per theme, and the screens are those the app already
has, recolored.

The screens are chosen to exercise every token a theme sets:

| Screen | What it checks |
|---|---|
| `dashboard` | page, surface and raised surfaces; accent button and link; income and expense; the doughnut's chart-income and chart-expense |
| `entries` | the list, muted day labels, the accent badge and filter count, the search field |
| `form` | the focus ring (accent-soft), the danger border, validation text, the danger button |
| `buckets` | the warning callout, chart-income, chart-warning and chart-expense as text and bars, the track |
| `summary` | all eight categorical chart colors side by side |
| `sheet` | the scrim, shadow-pop and the selected-option wash |

The mockups are generated from `src/themes/catalog/*.json` through
`design/system/themes.css`, so they always show the palettes the app ships.
