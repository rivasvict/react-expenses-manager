# Expenses Tracker design system

A calm, dark fintech system built on a single gold accent. A deep, low-contrast
neutral scale carries the interface; the warm gold accent marks the brand and
the **one primary action per screen**. Semantic green and rose separate money in
from money out, and always mean the same thing.

This folder is the design system's home in the repo. Agents and humans read it
before building or designing any UI.

| File | What it is |
|---|---|
| [`src/styles/tokens.json`](../../src/styles/tokens.json) | **The single source of truth** for every color, radius, shadow and font stack. |
| [`tokens.css`](tokens.css) | Generated: the tokens as CSS custom properties (`--accent`, `--radius-card`, …) for HTML mockups. |
| [`src/styles/_tokens.scss`](../../src/styles/_tokens.scss) | Generated: the tokens as SCSS variables (`$accent`, `$radius-card`, …), pulled in by `src/variables.scss`. |
| [`mockup.css`](mockup.css) | Shared base for UI mockups: the app shell, cards, buttons and text roles, built only from `tokens.css`. See [`../README.md`](../README.md). |
| [`components.md`](components.md) | Inventory: each design-system component → the code that implements it. |
| [`reference/design-system.dc.html`](reference/design-system.dc.html) | The visual reference board exported from Claude Design (snapshot — see below). |

## How tokens flow

```
src/styles/tokens.json ──npm run tokens:build──┬─▶ src/styles/_tokens.scss ─▶ src/variables.scss ─▶ every .scss
                                               └─▶ design/system/tokens.css ─▶ HTML mockups
src/styles/tokens.json ──import──▶ JS/TSX that needs a color at runtime (charts, SVG marks)
```

To change or add a token:

1. Edit `src/styles/tokens.json` (kebab-case names, unique across groups).
2. Run `npm run tokens:build`.
3. Commit the JSON **and** both generated files. A unit test
   (`src/styles/tokenFormats.test.js`) fails if they are out of sync.

A token change alters the app (`tokens.json` lives in `src/`), so its PR bumps
the version like any other. Editing only files under `design/` does not (see
[`../README.md`](../README.md)).

## The rules (enforced in CI)

- **No literal colors, radii or font stacks outside `tokens.json`.**
  - `npm run lint:styles` (stylelint): rejects hex and named colors, `rgb()`/`hsl()` with literal
    channels, literal `border-radius` lengths/percentages, and any `font-family` that isn't a token.
  - `npm run lint` (ESLint): rejects hex/`rgb()`/`hsl()` color strings in `src/` JS/TSX.
- **Deriving from a token is fine**: `rgba($accent, 0.28)` or a focus halo like `0 0 0 3px $income-soft`.
  A value that is genuinely new belongs in `tokens.json`, not inline.
- **Reuse before you create.** Check [`components.md`](components.md) and the mixins in
  `src/variables.scss` (`card`, `interactive-card`, `buttons`, `icon-chip`, `money-figures`,
  `focus-ring`) before writing new styles.
- The only exception is the `$select-chevron` data URI in `src/variables.scss`, whose fill is
  `$text-secondary` URL-encoded, because a data URI cannot reference a variable.

## Foundations

**Color** — surfaces stack page → surface → raised → raised-hover. Accent and semantic colors are
used sparingly. The categorical chart palette has a fixed order validated for the dark surface;
charts never generate colors.

**Typography** — the native system stack (`$font-sans`) with tabular figures, so amounts line up.
The reference scale (not yet tokenized):

| Role | Size / weight |
|---|---|
| Balance hero | 2rem / 700 / -0.02em |
| Screen title (`h1.title`) | 1.15rem / 700, centered (`$h1-size-title`) |
| Tile / card content | 1.05rem / 600 |
| Section eyebrow | 0.78rem / 700, uppercase, 0.1em |
| Form label | 0.8rem / 600, 0.02em |

**Radius & depth** — three radius steps for three container levels (`$radius-control` 0.65rem,
`$radius-card` 1rem, `$radius-shell` 1.4rem), plus `$radius-pill` for progress bars and
`$radius-round` for circles. Two shadows: `$shadow-card` for resting cards and `$shadow-pop` for
floating surfaces.

**Layout** — a single-column work area (`$shell-max-width`, 40rem). Below `$nav-breakpoint` (768px)
the navigation becomes a bottom tab bar.

## The reference board

`reference/design-system.dc.html` is the board as it was exported from Claude Design, kept so you
can see the system at a glance (open it in a browser; icons load from the Iconify CDN). It is a
**snapshot**: when it disagrees with `tokens.json`, `tokens.json` wins. After a token change worth
showing, update the board in Claude Design and re-export it here.
