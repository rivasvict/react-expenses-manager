# Theme personality

## Problem
The 15 themes change color only. Each one is "inspired by" something (Zelda,
Halloween, The Matrix…) but every theme looks and reads the same apart from its
palette. They need more character.

## Goal
Two additions to the existing theme picker, both driven by the theme catalog:

1. **Background pictures.** A sober, subtle drawing behind the content that
   quietly evokes each theme's inspiration. One coherent drawing language
   across all themes, matching the brand. Optional: a switch in the Theme sheet
   turns them off. The default theme, Midnight Gold, has none.
2. **Typography.** Each theme gets a typeface that expresses its mood. Only
   free and safe fonts, with Google Fonts as the only external source.

## Constraints
- A theme still cannot hurt the UX: text contrast, tabular money figures and
  layout never change. Art sits behind opaque cards and never behind a figure
  or a form field on its own.
- Cheap: small assets (SVG), cached, nothing blocking first paint.
- A new theme stays "one JSON file + `npm run tokens:build`": the art and the
  fonts become optional fields of that file.
- The art is painted with the theme's own accent through a CSS mask, so it
  recolors itself and needs no per-theme palette.
- The choice stays on the device (`localStorage`, a new `settings.themeArt`);
  never in the entries model, backup or sync.
- English, Spanish and French for every new string (switch label and hint).

## Out of scope
User-uploaded pictures, animated backgrounds, per-screen art, a font picker
independent of the theme, a typography on/off switch (see decision.md).
