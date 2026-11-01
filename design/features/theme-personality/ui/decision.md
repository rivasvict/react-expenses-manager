---
title: Theme personality
summary: Faint per-theme drawings behind the app (switch in the Theme sheet) and a headline typeface per theme, shown inside the approved picker previews.
status: implemented
chosen: d-live-preview
---

# Decision

**Approved: option D, the live preview**, which is the approved Theme picker
with each miniature carrying its theme's picture and typeface, paired with
**art model A** (an all-over tile on the app's work area) and **type model a**
(headline voice only).

## Why

- The picker's miniature previews were the best part of the theme picker; D
  keeps them untouched and makes them sell the new personality too (picture and
  headline font are visible before a theme is picked).
- A's tile is the calmest and the cheapest: one SVG mask per theme, no layout,
  nothing behind the header or a figure that is not an opaque card.
- Type model a ships one display face per theme, only on headings and the brand
  name; body text and every money figure keep the system font, so forms, tables
  and tabular figures are unaffected. A (crest) and C (frieze, display figures)
  were rejected in the design review: the crest sits behind the balance and
  crops motifs, the frieze collides with the last card and the tab bar, and
  display faces on money break column alignment.

Options A, B, C (`options/`) stay as the record of the exploration.

## For the implementer

Built to `approved/` and `flow.json`. Decisions taken when approving (flag
them in the PR if the owner wants otherwise):

- **Fonts are self-hosted.** The files are the Google Fonts latin subsets
  (SIL OFL) downloaded once into `src/themes/fonts/`, hashed by the build and
  fetched on demand: a device downloads the active theme's face (and the rest
  only while the picker is open). No runtime request to Google, so no IP is
  sent to a third party and the service worker can cache them
  (`workbox-config.js`, `theme-fonts`, cache-first).
- **No separate "Theme fonts" switch** (out of scope in the brief). The one
  switch, **Background pictures**, controls the pictures only.
- **The 14 motifs are final** (`ui/shared/motifs/*.svg`, copied to
  `src/themes/art/<id>.svg`): monoline, 96px tile, 1.5px round stroke,
  `currentColor`, no trademark shapes (no Triforce, no Dragon Ball). Midnight
  Gold has none.
- **Catalog fields** (`src/themes/catalog/<id>.json`, optional, absent for the
  default theme): `typography: { display: { family, file }, tracking }` and
  `art: "<svg file name>"`. `npm run tokens:build` turns them into
  `--font-display`, `--display-tracking`, `--art` (the SVG inlined as a data
  URI) and `--art-opacity` (0 without art; 0.11 on dark, 0.2 on light) in
  `themes.generated.css`, and the `@font-face` rules in `fonts.generated.css`.
  A new theme still means one JSON file (plus its SVG and font file).
- **Picture layer:** the `theme-art($tile-size, $strength)` mixin
  (`src/variables.scss`) paints the accent through a CSS mask on a `::before`
  behind the content. Used on the work area (112px tile) and on each
  miniature's surface (36px tile, strength 3.8). `data-theme-art="off"` on
  `<html>` hides it everywhere. It is decorative: `pointer-events: none`, not
  in the accessibility tree (pseudo-element).
- **Headline voice:** the `display-font` mixin / `$font-display` on page
  titles (`h1.title`, the eyebrow above them), the brand name in the app bar,
  bottom-sheet headings, the wizard and Categories titles, and the theme
  card's name. Nothing else; never money figures.
- **Preference:** `settings.themeArt` (`"off"` or absent = on) in
  `localStorage`, read by `src/themes/artPreference.ts` and exposed by
  `useTheme()` (`artEnabled`, `setArtEnabled`); device-only, never in the
  entries model, backup or sync.
- **Switch row:** reuse `SwitchRow` (new optional `className`), placed in the
  Theme sheet between the hint and the scrolling grid, slimmer than a Settings
  row (`.theme-sheet__art`). It stays usable on a plain theme; the hint then
  adds "{{theme}} stays plain."
- **Preview:** `ThemePreview` shows the app name as text (`header.appName`) in
  the theme's headline font in place of the grey bar, and the "Savings" label
  in the headline font; its figures stay system.

### New strings

| Key | English | Spanish | French |
|---|---|---|---|
| `settings.themeArt.title` | Background pictures | Imágenes de fondo | Images d'arrière-plan |
| `settings.themeArt.hint` | Faint drawings from each theme's world. | Dibujos tenues del mundo de cada tema. | Dessins discrets de l'univers de chaque thème. |
| `settings.themeArt.plain` | {{theme}} stays plain. | {{theme}} se queda sin dibujos. | {{theme}} reste sobre. |

### Edge cases and states not drawn

- **Font fails to load or is blocked:** the stack falls back to the system
  font (`font-display: swap`); nothing breaks.
- **Art off or a plain theme:** no picture, no empty frame (opacity 0 / layer
  hidden).
- **Light themes** (Snowglobe, Flexoki Light) use a stronger ink so the picture
  reads the same.
- **Long Spanish/French text** is unaffected: only headings change family, and
  they already wrap.
- **Onboarding step 1** shows the same previews (pictures and typeface) with
  no switch; the switch lives only in Settings.
- Known risk, accepted: Mountains of Christmas (Yuletide) has decorative
  digits in the month title; revisit if it reads poorly.

## Approved screens

| Screen | State | File |
|---|---|---|
| Theme sheet | Ocarina selected, pictures on | `approved/theme-sheet.default.html` |
| Theme sheet | pictures off | `approved/theme-sheet.off.html` |
| Theme sheet | Midnight Gold selected (plain) | `approved/theme-sheet.plain.html` |
| Theme sheet | Spanish | `approved/theme-sheet.es.html` |
| Dashboard | Ocarina, pictures on | `approved/dashboard.art.html` |
| Dashboard | pictures off | `approved/dashboard.off.html` |

The theme wall (all 15 themes) is in `options/a-tile/theme-wall.html`.
