---
title: Theme showcase
summary: Every theme on the same six app screens, one option per theme; a review aid for the theme catalog, not a feature to build.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). The picker is
[`../../theme-picker/`](../../theme-picker/ui/decision.md).

There is one option per theme, in catalog order (the default first). Each
option shows the same six screens recolored by that theme, so the gallery
compares the themes side by side, screen by screen.

## Options considered (one per theme)

- **a-midnight-gold**: today's look and the default; the reference the other
  themes are held to.
- **b-catppuccin**: Mocha pastels; mauve accent, green income, red expense.
- **c-flexoki-light**: the one light theme; ink on warm paper, blue accent.
- **d-gruvbox**: warm retro browns; Gruvbox's own mustard yellow as the accent
  (not the default's gold), orange warning. Its red is lifted so it stays
  readable on raised cards.
- **e-moon-prism** (Sailor Moon): moonlit navy, prism-pink accent, golden
  crescent as the warning and logo shade, and the senshi colors as the chart
  palette.
- **f-nord**: arctic polar night with a frost accent. The aurora red and green
  are lifted for contrast.
- **g-ocarina** (Zelda: Ocarina of Time): Hyrule at night; ocarina-blue
  accent, Kokiri green income, heart-red expense, Triforce gold, and rupee
  colors in the charts.
- **h-super-saiyan** (Dragon Ball Z): training-gi blue surfaces, turtle-school
  orange accent, Super Saiyan gold warning, Namekian green income.
- **i-tokyo-night**: neon blue accent on an indigo night.
- **j-wisteria** (Demon Slayer): corps-black night with a haori-green tint,
  a blue-violet wisteria accent, Nezuko pink, flame orange, Zenitsu yellow
  and water-breathing blue in the charts.

Every palette passes the contrast rules in the
[brief](../../theme-picker/feature-brief.md#constraints), enforced by
`src/themes/themeCatalog.test.js`.

## Design review

Each new theme was reviewed by a separate design reviewer in two rounds, judging
the six screens against the default for fidelity to its inspiration, harmony
and UX (surface hierarchy, primary-action salience, income/expense/accent and
warning/danger separation, chart legibility). All nine ended at **PASS**.

| Theme | Round 1 | Changes applied | Round 2 |
|---|---|---|---|
| Moon Prism | pass | chart 6 → cyan, chart 7 → paler yellow (no longer the warning color); logo shade → brighter "Usagi gold" | pass |
| Super Saiyan | pass | chart 5 → lime (no longer the income green), chart 6 bluer teal, accent hover toward Super Saiyan gold | pass |
| Ocarina | pass | chart 5 → tunic lime, chart 6 → green-teal, chart 8 → lighter magenta | pass |
| Wisteria | revise | accent → bluer wisteria violet (was too close to Catppuccin's mauve), chart 5 → lime | pass |
| Tokyo Night | pass | chart order: cyan, yellow, teal (green no longer next to teal) | pass |
| Catppuccin | pass | chart order: teal, yellow, green (canonical colors, reordered) | pass |
| Gruvbox | revise | accent → canonical mustard `#d79921` (was too close to the default gold), chart 8 → canonical gray | pass |
| Nord | pass | expense/danger → `#f0959c`, a redder lift of aurora red | pass |
| Flexoki Light | pass | chart warning → lighter amber, so a warning bucket separates from a healthy one | pass |

Declined: a forest-green income for Flexoki Light. The reviewer called it
optional; it is not a Flexoki color, and the olive passes every rule.
