---
name: create-theme
description: Create a new app theme (colors, headline Google Font, background picture) the way the existing 14 were made. Use whenever asked to add, design or change a theme in src/themes/catalog/. Covers the catalog file, contrast rules, the mandatory font rules (Google Fonts only, self-hosted and offline, performance kept), the SVG motif, translations, tests, design review and the release steps.
---

# Create a theme

A theme is **one JSON file + one SVG + one font file**, then `npm run tokens:build`.
Nothing else in the app lists themes by hand. How theming works: `docs/theming.md`. Read `design/features/theme-picker/feature-brief.md`
("Constraints") and `design/features/theme-personality/ui/decision.md` first; they are the
approved spec. Look at a finished theme (e.g. `src/themes/catalog/all-hallows.json`) as the model.

## Mandatory rules (never break these)

### Fonts
1. **Google Fonts only.** The headline typeface must be a family published on
   Google Fonts (SIL OFL / Apache). No other foundry, no paid or system-only font, no
   font from an unofficial mirror.
2. **Always available offline.** Never link to `fonts.googleapis.com` / `fonts.gstatic.com`
   at runtime, never add a `<link>` or `@import`. Download the **latin subset** once, as
   `.woff2`, into `src/themes/fonts/<file>.woff2` and commit it. The build emits a
   self-hosted `@font-face` (`src/styles/fonts.generated.css`) that points at it, so the
   app also works with no network and sends no IP to a third party.
3. **The service worker caches it.** `workbox-config.js` caches every `.woff2` cache-first
   (`theme-fonts`, max 20 entries). A new font must keep working with that rule: do not
   change the pattern, and raise `maxEntries` if the number of distinct fonts would exceed it.
4. A font failure must degrade gracefully: `font-display: swap` and the system stack
   fallback (already generated); never hide text until a font loads.
5. The face is used **only** for headings, page titles, the brand name and sheet
   headings (`display-font` mixin / `$font-display`). Never body text, never money
   figures (display faces break tabular alignment).

### Performance (keep it)
- Fonts are **not precached**: a device downloads only the active theme's face (the rest
  only while the picker is open). Do not import a theme's font in JS/CSS by hand, do not
  preload it, and do not precache `.woff2`.
- One font file per theme, **latin subset only**, woff2, ideally under ~30 KB (the largest
  existing is ~58 KB; justify anything bigger in the PR). One weight/variable file; no
  extra styles or italics.
- The motif SVG stays **under 3000 bytes** (most are under 600) and is inlined as a
  data URI into `themes.generated.css`; no `<image>`, no scripts, no filters or gradients.
- The picture is drawn with the `theme-art()` CSS mask on a `::before`; add no extra
  elements, JS, animation or `will-change`. Do not add images or fonts anywhere else.
- A theme only swaps tokens: no layout, spacing, radii or font-size changes, and no
  theme-specific component code.
- Check `git diff --stat` at the end: the diff should be the JSON, the SVG, the woff2,
  generated files and docs, nothing heavier.

## Steps

1. **Pick the identity.** id (kebab-case, equals the file name), proper `name` (not
   translated), `scheme` (`dark` or `light`), and the inspiration (a game, show, editor
   palette, season). Use no trademarked logos or shapes (no Triforce, no Dragon Ball
   symbols): evoke, do not copy.
2. **Create `src/themes/catalog/<id>.json`** with: `id`, `name`, `scheme`, `inspiration`
   and `description` each in `en`/`es`/`fr` (one short sentence; proper names stay
   untranslated), `typography: { display: { family, file }, tracking }`, `art`, and the
   full `color`, `chart` and `shadow` groups. Keys must match `src/styles/tokens.json`
   exactly: same set, none missing, none extra (a test enforces it). Never set `default`.
   - `typography.family` is the exact Google Fonts family name; `file` is the woff2 file
     name without extension. `tracking` is `"0"` or an `em` value like `"0.04em"`
     (existing: 0 to 0.06em).
   - `art` is the name of the SVG in `src/themes/art/`.
3. **Colors** (follow the existing themes):
   - Layers: `bg-page` darkest/lightest, then `bg-surface`, `bg-raised`, `bg-raised-hover`
     stepping toward the foreground. Borders/track/highlight are translucent versions of
     the text hue (`rgba`), `scrim` is black translucent.
   - `accent` is the theme's signature; `accent-hover` a step lighter (darker on light
     schemes); `accent-soft` is the accent at ~0.12 alpha; `text-on-accent` must read on
     both accent and accent-hover.
   - **Semantics never change**: `income` is green, `expense` red/pink-red, `danger` red,
     `warning` yellow/amber, even in a purple or blue theme. The `*-soft` tokens are the
     same colour at ~0.12 to 0.14 alpha.
   - `brand-mark-shade` is a second hue for the logo mark. `text-validation` is a light
     salmon/red readable on the surfaces.
   - `chart-income` / `chart-expense` / `chart-warning` and eight `chart-categorical-N`
     colors that stay distinguishable from each other and keep the theme's mood.
   - Shadows: `shadow-card` and `shadow-pop`, black-based, softer on light themes.
   - Only hex or `rgb()/rgba()` values (the contrast test parses nothing else).
4. **Contrast is enforced** by `src/themes/themeCatalog.test.js`, on both `bg-surface`
   and `bg-raised`: `text-primary` 7:1 (also on `bg-page`); `text-secondary`,
   `text-muted`, `accent`, `income`, `expense`, `danger`, `text-validation`,
   `chart-income`, `chart-expense`, `chart-warning` 4.5:1; `warning` and the eight
   categorical colors 3:1; `text-on-accent` on `accent` and `accent-hover` 4.5:1. Muted
   text is the usual failure: lighten it rather than loosen a rule. Never edit the test
   to make a theme pass.
5. **Picture:** `src/themes/art/<id>.svg`, `viewBox="0 0 96 96"`, `fill="none"
   stroke="currentColor" stroke-width="1.5"` with round caps and joins, a monoline
   drawing of 2 to 4 motifs from the theme's world on a 96px seamless tile. No colors of
   your own (no hex/rgb/hsl), under 3000 bytes. The build sets its opacity (0.11 dark,
   0.2 light).
6. **Font:** fetch the family's latin subset woff2 from Google Fonts (the CSS API with a
   modern user agent gives the `/* latin */` `src: url(...)`; use the proxy-configured
   `curl`). Save as `src/themes/fonts/<file>.woff2`. Confirm the licence is OFL/Apache
   and note the family in the PR.
7. **Build:** `npm run tokens:build`. Commit the JSON, SVG, woff2 and the regenerated
   `src/styles/themes.generated.css`, `src/styles/fonts.generated.css` and
   `src/themes/catalog.generated.ts` together (`tokenFormats.test.js` fails on drift).
   Never hand-edit generated files.
8. **Update the hard-coded theme counts** in tests (`src/themes/themePreference.test.ts`
   `toHaveLength(N)`, `src/integrationTests/themePicker.test.tsx` two `toHaveLength(N)`),
   and `CLAUDE.md` ("Fifteen themes") plus the docs that name the number.
9. **Translations:** theme names are proper names (not translated); `description` and
   `inspiration` must exist in en/es/fr. No new UI strings are needed for a theme.
10. **Design record (own PR, `design/` only):** per the project convention, a theme is
    reviewed in `design/features/theme-showcase/ui/` (six screens: dashboard, entries,
    form, buckets, summary, sheet, generated from the catalog JSON). Get the owner's
    approval of the look before shipping if asked to design it; run
    `npm run gallery:build`. Design-only PRs get no version bump.
11. **Verify:** `npm test -- --testPathPatterns="themes|tokenFormats"`,
    `npm test -- --testPathPatterns="integrationTests"`, `npm run lint`,
    `npm run lint:styles`, `npm run typecheck`, `npm run build`. Open the picker
    (`/settings` → Theme) and check the new card, its picture and heading font in the
    app, in Spanish and French, with background pictures on and off, and offline
    (DevTools offline after one load: the font must still render).
12. **Release:** bump `version` in `package.json` and `package-lock.json` and add a
    `CHANGELOG.md` entry (Keep a Changelog; Added: the theme, its inspiration and font).
    Open a PR only when the user asks.

## Never

- Link, `@import` or preload Google Fonts at runtime; use a non-Google font; precache fonts.
- Use a font for body text or money figures.
- Change tokens that are not themed (radius, font stacks, spacing) or add per-theme CSS/JS.
- Lower a contrast threshold, skip the test, or hand-edit generated files.
- Ship a motif with colors, raster images or more than 3000 bytes.
