# Theming

How the app is themed at runtime. To **add** a theme, follow the `create-theme`
skill (`.claude/skills/create-theme/SKILL.md`); it has the mandatory font and
performance rules and the checklist.

## Model

- Themes are CSS variables. One JSON file per theme in `src/themes/catalog/`
  (`id`, `name`, `scheme`, per-language `description` and `inspiration`, and the
  `color` / `chart` / `shadow` tokens). The default, Midnight Gold, takes its
  tokens from `src/styles/tokens.json`.
- `npm run tokens:build` generates `src/styles/themes.generated.css` (`:root`
  plus one `[data-theme="<id>"]` block per theme, imported once in
  `src/index.tsx`), `src/styles/fonts.generated.css` and
  `src/themes/catalog.generated.ts` (the typed `THEME_CATALOG`). Never edit
  them by hand; nothing lists themes by hand.
- A new theme must pass `src/themes/themeCatalog.test.js` (contrast rules, every
  token and language present).

## Preference and runtime

- The choice is `settings.theme` in `localStorage`: a device preference, never
  in the entries model, backup or sync, and it does not make anyone a "new
  user". Onboarding step 1 writes it immediately, so Skip setup keeps it.
- `applyStoredTheme()` sets `data-theme` on `<html>` and
  `<meta name="theme-color">` before the first render; `ThemeProvider` /
  `useTheme()` (`src/themes/`) keep them in step with every change.
- In JS/TSX get colors from `useTheme()` (Chart.js canvases must re-render when
  the theme changes) or use `var(--token)` in a DOM/SVG `style`. In SCSS use the
  generated variables, and `alpha($accent, 0.28)`, never `rgba($accent, 0.28)`.

## Personality (non-default themes)

- The theme file also carries `typography` (`{ display: { family, file },
  tracking }`) and `art` (name of `src/themes/art/<art>.svg`, a 96px monoline
  tile in `currentColor`). The build inlines the SVG and sets `--font-display`,
  `--display-tracking`, `--art` and `--art-opacity` (0 without art).
- The picture is the `theme-art($tile-size, $strength)` mixin in
  `src/variables.scss` (accent through a CSS mask on a `::before`). The headline
  typeface is the `display-font` mixin / `$font-display`: headings, page titles
  and the brand name only, never body text or money figures.
- Fonts are self-hosted Google Fonts latin subsets in `src/themes/fonts/`,
  fetched only when rendered and cached on first use by the service worker
  (`workbox-config.js`).
- `settings.themeArt` (`"off"` or absent) is a device preference read through
  `useTheme()` (`artEnabled`) and mirrored as `data-theme-art="off"` on
  `<html>`; its switch is at the top of the Theme sheet.

Designs: `design/features/theme-picker/` and `design/features/theme-personality/`.
