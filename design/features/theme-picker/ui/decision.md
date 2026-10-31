---
title: Theme picker
summary: Pick one of ten themes from Settings or the first-run setup; the whole app recolors right away, Omarchy-style.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). The themes themselves
are shown screen by screen in [`../../theme-showcase/`](../../theme-showcase/ui/decision.md).

Every option adds a **Theme** row to Settings (between Currency and Privacy
mode) showing the current theme's name and four dots of its colors, plus a
**Theme** choice in onboarding step 1 ("Four quick choices"). Each option is
drawn in a different theme to show the picker under both dark and light
palettes.

## Options considered

The two proposals follow the two halves of Omarchy's picker: its preview
images (A) and its keyboard menu (B). Each has two variants.

### A. Preview grid (Omarchy's `preview.png`)
Each theme is a card holding a **live miniature of the app** drawn in that
theme (balance, an income row, an expense row, the buttons), with its name and
"Inspired by …" underneath. Tapping a card applies the theme to the whole app
at once and moves the check. Nothing needs confirming.

- **a1-grid-sheet**: a tall bottom sheet with a 2-column grid, the same sheet
  pattern as Language and Currency. Onboarding shows the cards in a
  horizontal strip. *Good:* the most visual, a one-tap change, and it reuses
  the sheet. *Cost:* ten cards scroll inside the sheet; one new component
  (the preview card).
- **a2-grid-screen**: the same grid on its own screen (`/settings/theme`) with
  Go Back. Onboarding shows four cards and "See all 10 themes". *Good:* room
  for the catalog to grow, and the picker is not covered by a sheet. *Cost:*
  one new route.

### B. Launcher (Omarchy's menu)
- **b1-launcher-list**: a bottom sheet with a **Search themes** field and a
  dense list. Each row has a small swatch (accent, income, expense, raised),
  the name and "Inspired by …". A tap applies the theme. *Good:* compact,
  scales to dozens of themes, and the search fits a growing catalog. *Cost:*
  the swatch says less about a theme than a preview does.
- **b2-spotlight**: a screen with a large live preview of the highlighted theme
  and a horizontal rail of theme pills. Tapping a pill only **tries** the theme;
  **Use this theme** applies it and Cancel leaves everything as it was.
  Onboarding shows the current theme in a row with "Change". *Good:* the
  richest preview and no surprise recolors. *Cost:* two steps instead of one,
  unlike Omarchy; a new route and a "trying" state to build.

## Recommendation
**a1-grid-sheet.** It is the closest to Omarchy (pick a preview, it applies),
it is one tap, and it reuses the sheet people already know from Language and
Currency. B1 is the fallback if the catalog grows past about 20 themes.

## States the options imply
- No empty or error state. An unknown or missing stored theme falls back to
  Midnight Gold, the same way an unknown currency falls back to USD.
- Spanish and French run longer. Theme names never wrap a card; the
  "Inspired by" line may wrap to two lines.
