---
title: Savings trend
summary: A screen that answers "am I growing my savings?" with a green/red area line chart and 1M–YTD or custom month ranges, reached from the dashboard.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

All three options share the same building blocks so they can be compared on
what actually differs:

- **End month** is chosen with the existing month header (prev/next), exactly
  as on the dashboard, so "look at an earlier month" needs no new control.
- **Chart**: a 2px line, the area between it and a dashed baseline filled
  green (`--income`) above and red (`--expense`) below. Green/red fail
  colour-blind separation (ΔE 4.6 deutan, measured with the dataviz
  validator), so the red area is also **hatched**, the line sits above or
  below the baseline, and every figure carries ▲/▼ and a sign.
- Only the reference and the end values are labelled on the chart; tapping or
  hovering a month shows a tooltip (drawn in option C).

Options differ in **what the chart measures**, **how the range is picked**
and **how the screen is reached from the dashboard**. The entry points and the
screens can be mixed when approving.

## Options considered

### a-compare-with-a-month

The literal reading of the request. The headline compares the end month with
the month the range starts at ("October vs April: **+$340.00**, ▲ 26.6%"); the
chart plots each month's savings against that reference month's line. Range
is a single segmented control (`1M 2M 3M 6M 1Y YTD` + a calendar segment for a
custom from/to sheet with month and year selects).
**Entry:** a "Savings trend" row with a sparkline, between the hero and the
donut, styled like the Incomes/Expenses rows (the dashboard's existing
"tap a row to drill in" idiom).
**Good at:** direct, matches the existing badge's maths, every preset is one
tap. **Costs:** the dashboard grows ~60px (the donut is shrunk to keep the Add
buttons in place); a single noisy month (a big bill in the end month) can
make a healthy trend read red. Empty story drawn (`trend-empty.html`: fewer
than two months with entries, presets disabled). Error: none, computed in
memory.

### b-savings-pot

Answers "am I growing?" with **cumulative** savings: the line is the running
total saved since the range started, green while it is above $0.00 and red
while the user has spent more than they earned. Headline: "Saved in the last 6
months **$7,440.00**", with ▲ 122.1% against the previous period of the same
length; two small tiles (average a month, months saved). Same segmented
range control as A.
**Entry:** the existing hero is split by a hairline: the top still opens
Summary; the badge row becomes its own link with a gold "Trend ›".
**Good at:** the clearest "growing or not" signal; one bad month dents the
line instead of flipping the verdict; zero extra dashboard height to speak of
(~25px). **Costs:** the "compare with a month" wording of the request is
answered by the period-vs-period pill, not by picking a single month; it
changes the shipped hero (two links in one card). Down state drawn
(`trend-down.html`). Custom range (`trend-custom.html`): the calendar segment
opens the same from/to month-and-year sheet as A, with a live preview of what
the range saved; the range ends at the month in the header.

### c-verdict-first

Same metric as A, but leads with a plain-language **verdict** ("Yes, you're
saving more") and keeps controls to one: a "Last 6 months ▾" menu that lists
the presets as rows with the custom range behind a hairline at the bottom.
The **reference month is picked by tapping a point on the chart** (default:
the range's first month), so "compare with a previous month" is direct
manipulation rather than another control. Spanish drawn (`trend-es.html`)
to check the longer copy. Custom range (`trend-custom.html`, English only for
now; the Spanish version is drawn on approval): "Custom range…" in the menu
opens a sheet where the user taps the first and last month on a
year grid (months between fill in), instead of four selects.
**Good at:** the fewest visible buttons; reads as an answer before it reads
as a chart. **Costs:** presets take two taps instead of one and are less
discoverable; the verdict needs careful copy rules (up / down / mixed / not
enough data) in both languages; tap-to-compare must have a keyboard
equivalent. Same row entry as A, drawn in `dashboard.html`, but its second line carries the
verdict ("▲ You're saving more") instead of a mini chart; that keeps the row
as short as A's and the dashboard about 60px taller.

### d-trend-link-with-compare

A hybrid requested after the first round: **B's dashboard entry** (the hero is
split by a hairline; the badge row becomes its own link) with **everything
else from A** (the "October vs April" headline, the chart against April's
line, the 1M–YTD segmented control, the custom from/to sheet, the not-enough-
history state; `trend.html`, `trend-custom.html` and `trend-empty.html` are
A's screens). Two changes on the dashboard: the badge caption is shortened to
**"vs Sep"** (the spoken label keeps the full month name), and the "Trend ›"
link gets **A's trend icon** (the gold trending-up glyph in a small tinted
circle) to its left.
**Good at:** the least dashboard height of any option (about 25px), the
literal "compare with a month" reading, and one-tap presets. **Costs:** the
hero card now has two tap areas; "vs Sep" is shorter in English but Spanish
needs its own abbreviation rules ("frente a sep") and the month name has to be
abbreviated consistently, which the shipped badge ("vs September") does not
do today, so the badge's caption would change for every month in both
languages.

## Recommendation

**Either B, or D if the "compare with a month" headline matters more than the running total:** B's metric and entry with A's range control. Cumulative savings answers
the user's question ("am I progressing?") most honestly, and the badge-row
link is the most discoverable place: users already look at the badge to see
how they are doing, so "Trend ›" next to it is where they'll look for more,
without growing the dashboard. A's one-tap segmented presets beat C's menu
for a feature built around presets.
