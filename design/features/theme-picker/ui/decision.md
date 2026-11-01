---
title: Theme picker
summary: Pick one of fifteen themes from a preview grid in a bottom sheet (Settings) or a swipeable strip (setup step 1); the whole app recolors at once, Omarchy-style.
status: approved
chosen: a1-grid-sheet
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). The themes are shown
screen by screen in [`../../theme-showcase/`](../../theme-showcase/ui/decision.md);
the owner approved **all fifteen** for the app.

## Decision

**a1-grid-sheet**, chosen by the owner on 2026-11-01. A **Theme** row in
Settings opens a bottom sheet with a two-column grid of **preview cards**. Each
card is a live miniature of the app drawn in that theme, with the theme's name
and what inspired it. Tapping a card applies the theme to the whole app at
once, as Omarchy's picker does. The first-run setup shows the same cards in a
sideways-scrolling strip.

Why the others did not win:
- **a2** needs a new route for the same grid.
- **b1**'s swatches say less about a theme than a preview does.
- **b2** adds a try-then-confirm step that Omarchy does not have.

## For the implementer

### Behaviour the screens do not show

- **Storage.** The choice is a device preference in `localStorage` under
  `settings.theme`, holding the theme's `id`. Like the language and currency,
  it is never in the entries model, backups or sync. A missing, unknown or
  unreadable value means the default theme, `midnight-gold`. It does not make
  someone a "new user" (`isNewUser()` ignores it).
- **Applying.** The active theme is set as `data-theme="<id>"` on `<html>`.
  It is applied **before the first render** (no flash of the default) and again
  on every change. `<meta name="theme-color">` follows the theme's `bg-page`.
- **The sheet stays open after a tap**, unlike the Language and Currency
  sheets. The app behind it recolors at once, so a person can try several
  themes. The check and accent ring move to the tapped card. The sheet closes
  with Close, the scrim or Escape; focus then returns to the Theme row. On open,
  focus goes to the sheet's heading. The grid scrolls inside the sheet
  (`max-height: 85vh`); the heading and hint stay put.
- **Setup step 1.** Tapping a card in the strip applies and stores the theme
  at once, like the language. **Skip setup keeps it.** The strip scrolls
  sideways with touch, trackpad or the keyboard (arrow keys move between radios).
- **Setup review.** The Preferences summary's second line becomes
  `<theme name> · <privacy text>` (`Midnight Gold · Privacy mode off`).
- **Accessibility.** The grid and the strip are each a `radiogroup` labelled
  "Theme". Each card is a `radio` whose accessible name is the theme's name,
  with `aria-checked`. The miniature is `aria-hidden`; the "Inspired by" line is
  the radio's description (`aria-describedby`). Theme names are proper names and
  are never translated; the "Inspired by" line and the default theme's line are.
- **The miniature** shows fixed sample figures (1,620.00 savings, 4,200.00 in,
  2,580.00 out) formatted with `formatCurrency` in the user's currency. They are
  an illustration, not the user's data, so Privacy mode does not hide them.
- **Order.** The default theme first, then the others alphabetically by `id`,
  exactly as `readThemeCatalog` returns them. The picker never lists themes by
  hand: a theme added to `src/themes/catalog/` appears everywhere after
  `npm run tokens:build`.
- **Long text.** Theme names stay on one line in the Settings row (the label and
  hint wrap instead). On a card the name wraps if it must, and the "Inspired by"
  line may take two or three lines (Spanish and French run longer).
- No empty or error state: the catalog always has its fifteen themes, and an
  unknown stored theme falls back to the default.

### Theming architecture (what makes the picker possible)

- Color, chart and shadow tokens become **CSS custom properties** in the app.
  `_tokens.scss` emits `$accent: var(--accent);` for the `color`, `chart` and
  `shadow` groups; radius and font tokens stay literal.
- A generated stylesheet holds `:root, [data-theme="midnight-gold"] { … }` and
  one `[data-theme="<id>"] { color-scheme: …; --…; }` block per theme. It is
  imported once.
- SCSS that derives a color, such as `rgba($accent, 0.28)`, cannot work on a
  custom property. Replace each one with a Sass function in `variables.scss`
  that emits `color-mix(in srgb, <color> <n>%, transparent)`.
- JS that needs a real color value (Chart.js canvases, Recharts props, SVG
  attributes) reads the **active theme's palette** from a `useTheme()` hook, not
  `tokens.json`, and re-renders on a change. DOM and SVG `style` can use
  `var(--token)` directly.
- **Catalog JSON change.** `inspiration` becomes a per-language object (table
  below), so a theme stays self-contained: adding a theme touches only its own
  file. The test in `src/themes/themeCatalog.test.js` checks all three
  languages.

### Reuse

- `SettingRow` for the Theme row, with a value of the dots and the name. The
  four dots are the theme's page, accent, income and expense.
- The shared bottom-sheet chrome that the Language and Currency sheets use
  (scrim, grabber, heading, close chip, Escape, z-index).
- `formatCurrency`, `useTranslation`, the `card` and `focus-ring` mixins.

### New shared components (add a row each to `design/system/components.md`)

- **ThemePreview**: the miniature, scoped with `data-theme={id}` so it draws
  in that theme whatever the app's theme is.
- **ThemeCard**: a preview, the name, the Default badge or the "Inspired by"
  line, and the check when it is selected. It is a `radio`.
- **ThemeDots**: the four dots in the Settings row.

### New and changed strings

| Key | English | Spanish | French |
|---|---|---|---|
| `settings.theme.title` | Theme | Tema | Thème |
| `settings.theme.hint` | Colors of the app | Colores de la app | Couleurs de l’app |
| `settings.theme.description` | Tap a theme to use it. The app changes right away. | Toca un tema para usarlo. La app cambia al instante. | Touchez un thème pour l’utiliser. L’app change aussitôt. |
| `themes.inspiredBy` | Inspired by {{source}} | Inspirado en {{source}} | Inspiré de {{source}} |
| `themes.original` | The original look | El aspecto original | L’apparence d’origine |
| `themes.default` | Default | Predeterminado | Par défaut |
| `onboarding.themeHint` | the whole app changes as you pick | toda la app cambia al elegir | toute l’app change dès que vous choisissez |
| `onboarding.prefsLead` (changed) | Four quick choices. You can change all of them later in Settings. | Cuatro elecciones rápidas. Puedes cambiarlas después en Ajustes. | Quatre choix rapides. Vous pourrez tous les modifier plus tard dans les Réglages. |

The onboarding label reuses `settings.theme.title`.

### `inspiration` per theme (`{{source}}` above)

| Theme | en | es | fr |
|---|---|---|---|
| all-hallows | Halloween | Halloween | Halloween |
| catppuccin | Omarchy’s Catppuccin Mocha | Catppuccin Mocha de Omarchy | Catppuccin Mocha d’Omarchy |
| digital-rain | The Matrix | Matrix | Matrix |
| flexoki-light | Omarchy’s Flexoki Light | Flexoki Light de Omarchy | Flexoki Light d’Omarchy |
| gruvbox | Omarchy’s Gruvbox | Gruvbox de Omarchy | Gruvbox d’Omarchy |
| midnight-gold | Expenses Tracker | Expenses Tracker | Expenses Tracker |
| moon-prism | Sailor Moon | Sailor Moon | Sailor Moon |
| nord | Omarchy’s Nord | Nord de Omarchy | Nord d’Omarchy |
| ocarina | The Legend of Zelda: Ocarina of Time | The Legend of Zelda: Ocarina of Time | The Legend of Zelda: Ocarina of Time |
| pumpkin-king | The Nightmare Before Christmas | Pesadilla antes de Navidad | L’Étrange Noël de monsieur Jack |
| snowglobe | Christmas in winter | la Navidad en invierno | Noël en hiver |
| super-saiyan | Dragon Ball Z | Dragon Ball Z | Dragon Ball Z |
| tokyo-night | Omarchy’s Tokyo Night | Tokyo Night de Omarchy | Tokyo Night d’Omarchy |
| wisteria | Demon Slayer | Demon Slayer | Demon Slayer |
| yuletide | Christmas | la Navidad | Noël |

The default theme's card shows `themes.original` instead of an "Inspired by"
line.

## Approved screens

| Screen | State | File |
|---|---|---|
| Settings | default (Midnight Gold) | [`settings.default.html`](approved/settings.default.html) |
| Settings | after picking All Hallows | [`settings.picked.html`](approved/settings.picked.html) |
| Settings | a light theme (Flexoki Light) | [`settings.light.html`](approved/settings.light.html) |
| Settings | Spanish | [`settings.es.html`](approved/settings.es.html) |
| Theme sheet | default | [`theme-sheet.default.html`](approved/theme-sheet.default.html) |
| Theme sheet | All Hallows tapped | [`theme-sheet.picked.html`](approved/theme-sheet.picked.html) |
| Theme sheet | Spanish | [`theme-sheet.es.html`](approved/theme-sheet.es.html) |
| Setup step 1 | default | [`preferences.default.html`](approved/preferences.default.html) |
| Setup step 1 | All Hallows tapped | [`preferences.picked.html`](approved/preferences.picked.html) |
| Setup step 1 | Spanish (EUR) | [`preferences.es.html`](approved/preferences.es.html) |
| Setup review | default | [`review.default.html`](approved/review.default.html) |

## Options considered

The two proposals followed the two halves of Omarchy's picker: its preview
images (A) and its keyboard menu (B).

- **a1-grid-sheet** (chosen): a preview grid in a bottom sheet; a sideways strip
  in setup.
- **a2-grid-screen**: the same grid on its own screen.
- **b1-launcher-list**: a searchable list with swatches.
- **b2-spotlight**: a large preview with a confirm step.
