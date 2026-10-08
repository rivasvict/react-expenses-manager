---
title: Savings change from the previous month
summary: The dashboard shows how much this month's savings rose or fell against the previous month, as a green-up or red-down percentage.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

Nothing is chosen yet. Each option is drawn in four states, using the same
data: October 2026 against September 2026, where September saved $1,440.00.

| File | State |
|---|---|
| `dashboard.html` | Savings went up: $1,620.00, **+12.5%** |
| `dashboard-es.html` | The same in Spanish (the longest copy) |
| `dashboard-down.html` | Savings went down: $1,260.00, **−12.5%** |
| `dashboard-nothing-to-compare.html` | September has no entries (the first month with data), so there is no percentage |

In every option the indicator uses the existing semantic pair: `--income`
(green) with an up arrow and a `+` sign, or `--expense` (red) with a down arrow
and a `−` sign. Because of the arrow and the sign, the meaning does not depend
on colour alone. The indicator is read aloud as one phrase ("Savings up 12.5%
compared with September"). No new tokens are needed.

## Options considered

### a-badge-in-hero: a badge inside the savings card

A small tinted pill (`↑ +12.5%`) and a "vs September" caption sit right
under the savings amount, inside the existing balance hero card. The change
stays with the number it describes. Banking and brokerage apps usually show
it this way ("$1,620.00 · ↑ 12.5%"), so users already know how to read it.

- **Good at:** one glance reads both the figure and its trend; adds about 30px
  of height and no new card; the donut and the rest of the screen stay as
  they are. The pill shape and its soft tint match the money chips' tinted
  circles.
- **Costs:** the hero card is a link to Summary, so the badge sits inside a
  tap target (fine, since the badge is display-only, but the spoken label must
  read well within the link). It is the smallest of the three, so the trend
  is less prominent than in B.
- **Nothing to compare:** the pill is left out and only the caption is shown:
  "Nothing to compare with September".

### b-strip-above-chart: a strip between the savings card and the donut

This is the placement the request suggested. A thin full-width card under the
hero reads "Compared with September" on the left and `↑ +12.5%` on the right.
The whole strip is tinted green or red, the same way the app already tints
the Summary total tiles (`content-title-selection--total` with
`tile-tone--income` / `--expense`).

- **Good at:** the most prominent of the three, and it has room to grow: a
  later "+$180.00" amount fits on the left without redesigning anything.
  Reuses an existing tinted-tile pattern.
- **Costs:** adds a card (about 65px), which pushes the Add buttons further
  down toward the tab bar. When savings go up, two green blocks sit on top of
  each other. The trend is separated from the figure it describes by a card
  border.
- **Nothing to compare:** the strip stays, untinted, and reads "Nothing to
  compare with September". It could also be hidden, but then the screen would
  jump when the user moves between months.

### c-inside-donut: inside the donut's hole

The percentage (`↑ +12.5%`) and "vs September" fill the empty centre of the
donut chart.

- **Good at:** adds no height at all, and fills space that is empty today.
- **Costs:** mixes two unrelated ideas: the ring shows how *this* month
  splits, while the centre compares with *last* month. Users tend to read a
  donut's centre as the ring's total. The donut is hidden when the month has
  no incomes or expenses (`shouldShow` in `BalanceChart`), so the indicator
  would disappear with it. That is exactly when a −100% drop matters. The
  build is also the most involved: an overlay positioned over the ring only,
  not the Chart.js legend, which shares the canvas.
- **Nothing to compare:** the centre reads "No September data".

## Recommendation

**a-badge-in-hero.** It answers the question where the user is already
looking (the savings figure), follows a convention people already know from
banking apps, and costs the least screen space on a dashboard whose buttons
already sit near the tab bar. Choose **b** if the trend should be the most
prominent thing after the balance, or if the amount difference ($) is planned
soon.

## States every option must cover (for the approval step)

- **Up / down:** as drawn. The percentage has one decimal place. From
  1,000% upward, show `>999%` so the badge never grows wider.
- **No change** (rounds to 0.0%): neutral `--text-secondary`, a flat dash
  instead of an arrow, and no sign: "0.0% vs September".
- **Nothing to compare** (the previous month has no entries, or its savings
  are exactly $0.00): as drawn.
- **Current month has no entries:** the savings are $0.00, so the change is
  shown as normal (for example −100.0%). This is meaningful, not an error.
- **Error:** none. The value is calculated from entries already in memory, and
  nothing is loaded.
- **Spanish:** the month name is lowercase inside the sentence ("frente a
  septiembre"), unlike the month header ("Octubre 2026").
