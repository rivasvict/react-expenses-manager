---
title: Theme showcase
summary: Every theme on the same six app screens, held in one approved option. The owner approved all fifteen on 2026-11-01; this is the catalog's review record, not a feature to build.
status: approved
chosen: a-all-themes
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). The picker is
[`../../theme-picker/`](../../theme-picker/ui/decision.md).

**All fifteen themes are approved** (owner, 2026-11-01) and ship with the
[theme picker](../../theme-picker/ui/decision.md).

## Decision

**a-all-themes**, chosen by the owner. The fifteen per-theme options were
merged into one option that holds every theme: six screens (dashboard,
entries, form, buckets, summary, sheet) for each of the fifteen themes, 90
mockups named `<screen>.<theme-id>.html`, in catalog order with the default
(Midnight Gold) first. The theme id is the *state* in the approved screens.

Why the others did not win:
- **b-dummy-one** and **c-dummy-two** are one-screen placeholders added only
  so there are alternatives to compare. Neither shows a theme.

## For the implementer

Nothing to build. The mockups are generated from `src/themes/catalog/*.json`
through `design/system/themes.css`, so they show the palettes the app ships.
There are no new components, tokens or strings. `fixtures.json` seeds each
screen with `settings.theme` set to the theme id.

## Approved screens

| Screen | States (theme ids) | File |
|---|---|---|
| `dashboard` | the fifteen theme ids | `approved/dashboard.<theme-id>.html` |
| `entries` | the fifteen theme ids | `approved/entries.<theme-id>.html` |
| `form` | the fifteen theme ids | `approved/form.<theme-id>.html` |
| `buckets` | the fifteen theme ids | `approved/buckets.<theme-id>.html` |
| `summary` | the fifteen theme ids | `approved/summary.<theme-id>.html` |
| `sheet` | the fifteen theme ids | `approved/sheet.<theme-id>.html` |

Theme ids: midnight-gold, all-hallows, catppuccin, digital-rain,
flexoki-light, gruvbox, moon-prism, nord, ocarina, pumpkin-king, snowglobe,
super-saiyan, tokyo-night, wisteria, yuletide.
