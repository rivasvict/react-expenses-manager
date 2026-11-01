# Theme picker

## Problem
The app has one look: the dark "calm fintech" theme with a gold accent. People
want the app to feel like theirs, and there is no way to change its colors.

## Goal
Let a person **pick** one theme from a fixed catalog, from Settings and during
the first-run setup. The picker works like Omarchy's: open the menu, pick a
theme, and the whole app changes right away. Each theme has a preview, so the
person can see what they are choosing. The choice stays on the device
(`localStorage`).

## The catalog (initial themes)
One JSON file per theme in `src/themes/catalog/`. This is the single source of
truth for the app, for `design/system/themes.css` and for these mockups.

| Theme | Inspired by | Scheme |
|---|---|---|
| Midnight Gold (default) | today's look | dark |
| Moon Prism | Sailor Moon | dark |
| Super Saiyan | Dragon Ball Z | dark |
| Ocarina | The Legend of Zelda: Ocarina of Time | dark |
| Wisteria | Demon Slayer | dark |
| Yuletide | Christmas | dark |
| All Hallows | Halloween | dark |
| Pumpkin King | The Nightmare Before Christmas | dark |
| Snowglobe | Christmas in winter | light |
| Digital Rain | The Matrix | dark |
| Tokyo Night | Omarchy | dark |
| Catppuccin | Omarchy (Mocha) | dark |
| Gruvbox | Omarchy | dark |
| Nord | Omarchy | dark |
| Flexoki Light | Omarchy | light |

## Constraints
- **Pick only, never edit.** No color controls, no custom themes.
- **Adding a theme changes only the theme.** A new theme is a new file in
  `src/themes/catalog/`, followed by `npm run tokens:build`. The picker,
  Settings, onboarding, storage and charts read the catalog and never list
  themes by hand.
- **A theme cannot hurt the UX.** It only swaps the color, chart and shadow
  tokens. Radii, fonts, spacing and layout never change. Income stays green,
  expense stays red, and danger stays red. Every theme passes the same contrast
  rules as the default: text-primary 7:1; secondary and muted text, the accent,
  money colors and validation text 4.5:1 on surface and raised; chart colors
  3:1; text on the accent 4.5:1. These rules are enforced by a test.
- Every visible string is in English, Spanish and French. Theme names are
  proper names and are not translated; their one-line descriptions are.
- 375px first; design-system components only.

## Out of scope
A theme editor, user-made themes, per-screen themes, following the OS
light/dark setting, syncing the theme to the server or putting it in backups.
