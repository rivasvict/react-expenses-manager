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
- **b-all-hallows** (Halloween): a purple-black witching-hour night,
  jack-o'-lantern orange accent, slime-green income, candy-corn warning, and
  ghost, potion and bone in the charts.
- **c-catppuccin**: Mocha pastels; mauve accent, green income, red expense.
- **d-digital-rain** (The Matrix): a black screen with phosphor-green text
  and buttons, red-pill red for expense, and aqua-mint for income, since green
  is taken by the buttons.
- **e-flexoki-light**: a light theme; ink on warm paper, blue accent.
- **f-gruvbox**: warm retro browns; Gruvbox's own mustard yellow as the accent
  (not the default's gold), orange warning. Its red is lifted so it stays
  readable on raised cards.
- **g-moon-prism** (Sailor Moon): moonlit navy, prism-pink accent, golden
  crescent as the warning and logo shade, and the senshi colors as the chart
  palette.
- **h-nord**: arctic polar night with a frost accent. The aurora red and green
  are lifted for contrast.
- **i-ocarina** (Zelda: Ocarina of Time): Hyrule at night; ocarina-blue
  accent, Kokiri green income, heart-red expense, Triforce gold, and rupee
  colors in the charts.
- **j-pumpkin-king** (The Nightmare Before Christmas): Halloween Town by
  moonlight; the full moon behind Spiral Hill as the accent, bone-white text,
  Zero's orange nose as the warning, Sally's red hair as expense and her
  patchwork in the charts.
- **k-snowglobe** (Christmas in winter): the light sibling of Yuletide. Fresh
  snow and frost surfaces, a twilight-indigo accent, pine income, cranberry
  expense, and gingerbread and gold in the charts.
- **l-super-saiyan** (Dragon Ball Z): training-gi blue surfaces, turtle-school
  orange accent, Super Saiyan gold warning, Namekian green income.
- **m-tokyo-night**: neon blue accent on an indigo night.
- **n-wisteria** (Demon Slayer): corps-black night with a haori-green tint,
  a blue-violet wisteria accent, Nezuko pink, flame orange, Zenitsu yellow
  and water-breathing blue in the charts.
- **o-yuletide** (Christmas): a pine-green night with a star-gold accent,
  holly-green income, cranberry expense, a cranberry logo shade, and
  ornaments in the charts.

Every palette passes the contrast rules in the
[brief](../../theme-picker/feature-brief.md#constraints), enforced by
`src/themes/themeCatalog.test.js`.

## Design review

Each theme other than the default was reviewed by a separate design reviewer in two rounds, judging
the six screens against the default for fidelity to its inspiration, harmony
and UX (surface hierarchy, primary-action salience, income/expense/accent and
warning/danger separation, chart legibility). Every theme ended at **PASS**.

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
| Yuletide | revise | deeper fir surfaces (too close to Ocarina), tinsel-gold accent, holly income, cranberry expense and logo shade, icy-blue first chart color | pass |
| All Hallows | revise | chart 1 ↔ 3: witch purple leads the chart instead of Super Saiyan's cyan | pass |
| Pumpkin King | revise | moonlit teal-black surfaces and bone-white lines (too close to the default), mint income (too close to the moon accent), teal-tinted grey text and logo | pass |
| Snowglobe | revise | read as a generic light UI: glacier-cerulean accent instead of indigo, ice-blue ground with snow-white cards, winter-blue scrim, truer cranberry, icier chart teal | pass |
| Digital Rain | pass | kept phosphor-green buttons with aqua income (judged better than a pale or blue-pill accent); added a faint phosphor glow under bottom sheets | pass |

Declined: a forest-green income for Flexoki Light. The reviewer called it
optional; it is not a Flexoki color, and the olive passes every rule.
