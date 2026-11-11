---
title: Bucket expenses
summary: The edit-bucket screen shows how the bucket stands (Left, Spent, pace) and its expenses grouped by week, each week against its pace; the allowance is edited in a bottom sheet.
status: approved
chosen: e-c-week-rows-pace
---

# Decision

**E · Week rows** (the pace variant of C), chosen by the owner.

Why E won: the weekly number sits next to the expenses that cause it, labels
have room on a phone, the hero card stays short, and it scales to any number of
weeks. D crowded five narrow columns, F needed a new chart type. A and B hid the
expenses behind a long scroll or a second tab; C's unlabeled bars did not say
what they meant. The allowance editor moves from the page into a bottom sheet
(Edit on the hero card), as in C.

## For the implementer

Build to `approved/` and `flow.json`. Fixtures pin the clock, so the numbers are
reproducible: viewed on Oct 28, 2026, bucket Eating out, allowance CA$300.00,
carried −CA$43.37.

### Screen, top to bottom

1. **Eyebrow**: `editBucket.pageTitle` ("Edit bucket: Eating out").
2. **Hero card** (raised card, the Buckets card's text styles): month name and
   year with "67% used" (green / amber / red at the Buckets thresholds, same
   percentage as the Buckets card); **Left** large beside **Spent** (**Over**
   in red when negative, as on the Buckets card); the progress bar with a
   **pace tick** (2px, `$text-primary`) at expected ÷ available; the pace line;
   a hairline, then the **Monthly allowance** row: amount, "Carried −CA$43.37
   from earlier" (hidden when 0; amount red for debt, green for surplus), and an
   **Edit** secondary button (2.6rem tall) that opens the allowance sheet.
3. **Expenses by week**: section header with the "Weekly pace" legend (tick
   swatch). Per week, newest first, only weeks that have expenses: the week
   label and "**CA$45.65** of CA$57.95", a thin 6px bar with the pace tick, then
   a card listing that week's expenses (TypeChip `expense`, description, date,
   `−amount` in `$expense`). The first two weeks show; **Show earlier weeks**
   reveals the rest.
4. **Go Back** (secondary).
5. **Nothing spent**: hero as above, then a card with the TypeChip, "No expenses
   in {{name}} yet", the hint, and **Add an expense** (secondary, to
   `/add-expense`); no week section.

### Pace rule

- available = allowance + carried (the Buckets card's `availability`).
- Month viewed is the current month: expected by today = available × today's
  day ÷ days in the month. A past month: the whole month. A future month: no
  pace at all (hide the tick, the pace line and every "of …").
- Week = Monday to Sunday, clipped to the month and to today. Its pace =
  available × the days it covers ÷ days in the month.
- Tone: spent ≤ pace → `$chart-income` bar and "under pace" in `$income`;
  above → `$chart-warning`, "ahead of pace" in `$chart-warning`. Never red.
- available ≤ 0: no pace anywhere (nothing to pace); keep Over, the weeks and
  their totals without a bar tick or "of …".
- The bar scale in the week list is shared (the largest of any week's spent or
  pace, plus 8% headroom so a tick never sits on the bar's end), so bars compare across weeks; the tick is positioned on that scale.
- Expenses are those whose `categories_path` is exactly `,<bucket>,` (the match
  `getMonthSpendingByBucket` uses), so the weeks add up to Spent.
- No description: show the bucket name as the row title (user data).

### Allowance sheet

`BottomSheet` titled "Monthly allowance": the existing hint
(`editBucket.hint`), the number field (same placeholder, validation and
`getBucketAllowanceValidationError` as today), **Submit** (primary) and
**Cancel**. Submit with a valid amount saves for the viewed month onward
(unchanged `editBucket` action), closes the sheet and **stays on the screen**,
now showing the new numbers; the invalid case keeps the sheet open with the
message under the field. Closing returns focus to Edit.

### Reuse

`BottomSheet`, `TypeChip` (Categories), the Buckets card's figure styles and
`bucket-card` tokens (`$chart-income`, `$chart-warning`, `$chart-expense`,
`$track`), `formatDayMonth` (`helpers/shortDate`), `formatNumberForDisplay`.
New shared components: none (the hero, week row and allowance sheet are local to
`EditBucket/`).

### Strings (new keys; Spanish and French in `es.ts` / `fr.ts`)

| Key | English | Spanish |
|---|---|---|
| `editBucket.used` | {{percent}}% used | {{percent}}% usado |
| `editBucket.underPace` | {{amount}} under pace | {{amount}} por debajo del ritmo |
| `editBucket.aheadOfPace` | {{amount}} ahead of pace | {{amount}} por encima del ritmo |
| `editBucket.expectedBy` | Expected by {{date}}: {{amount}} | Previsto hasta el {{date}}: {{amount}} |
| `editBucket.carriedFromEarlier` | Carried {{amount}} from earlier | Arrastrado {{amount}} de meses anteriores |
| `editBucket.edit` / `editBucket.editLabel` | Edit / Edit monthly allowance | Editar / Editar asignación mensual |
| `editBucket.expensesByWeek` | Expenses by week | Gastos por semana |
| `editBucket.weeklyPace` | Weekly pace | Ritmo semanal |
| `editBucket.weekOf` | of {{amount}} | de {{amount}} |
| `editBucket.weekRange` / `editBucket.weekDay` | {{month}} {{start}} – {{end}} / {{month}} {{day}} | {{start}} – {{end}} {{month}} / {{day}} {{month}} |
| `editBucket.showEarlier` | Show earlier weeks | Mostrar semanas anteriores |
| `editBucket.emptyTitle` | No expenses in {{name}} yet | Aún no hay gastos en {{name}} |
| `editBucket.emptyMessage` | Expenses with the category {{name}} in {{month}} will show up here. | Los gastos con la categoría {{name}} de {{month}} aparecerán aquí. |
| `editBucket.addExpense` | Add an expense | Añadir un gasto |
| `editBucket.close` | Close | Cerrar |

### Edge cases

Long descriptions wrap (`overflow-wrap: anywhere`) and amounts never break; a
bucket with no expenses this month shows the empty card; Over shows the
absolute amount; the error state is the existing validation message.

### Approved screens

| Screen | State | File |
|---|---|---|
| Edit bucket | default (Oct 28, under pace) | `approved/bucket.default.html` |
| Edit bucket | Spanish | `approved/bucket.es.html` |
| Edit bucket | ahead of pace (Oct 14) | `approved/bucket.ahead.html` |
| Edit bucket | nothing spent (Oct 3) | `approved/bucket.empty.html` |
| Allowance sheet | default | `approved/allowance-sheet.default.html` |
| Allowance sheet | invalid value | `approved/allowance-sheet.error.html` |

French is not drawn: it follows the Spanish layout.

## Weekly spending view (a device setting)

Added after approval, at the owner's request: Settings lets the user choose
how the weekly spending is drawn, and **E stays the default**. Everything else
on the bucket screen (hero, pace line, allowance row and sheet, week lists,
empty state) is identical in all three views; only the weekly visualization
changes. The two other views are options D and F, promoted to approved with
the data of `bucket.default`.

### The setting

- **Settings row** "Weekly spending" (hint "How a bucket draws its weeks", value
  = the current view's name), placed after Theme and before the Privacy mode
  switch. A `SettingRow` like Language and Currency; no new row component.
- **Sheet** "Weekly spending" (`BottomSheet`), built like the Language sheet:
  the description as the legend, then three radio rows (`settings-option`: name
  over a one-line hint, gold-soft wash and a check on the current one). Picking
  one applies at once and closes the sheet. No preview thumbnails: the hint line
  says what each looks like, which keeps the sheet as light as its siblings.
- **Storage:** `localStorage` key `settings.weeklyView` = `rows` | `bars` |
  `line`; missing or unknown reads as `rows`. Device-only: never in the entries
  model, a backup or sync.
- **Not in onboarding:** the wizard does not mention it and its draft never
  carries it; a new user starts on Week rows and can change it in Settings.

### The views

| View | Hero card | Week list |
|---|---|---|
| `rows` (E, default) | pace tick and line | "Expenses by week" header with the Weekly pace legend; each week has its bar, tick and "of pace" |
| `bars` (D) | adds **Spent per week (CA$)**: a column per week so far (quiet weeks as "0"), amount and dates under each, a dashed pace line per column (a partial week's sits lower), green within pace and amber above, a legend and a one-sentence hint | no section header; each week is a plain label with its subtotal over its card |
| `line` (F) | adds **Spending through the month**: running total as a step line against a dashed even-pace line to the available amount, "Available" rule, today marked, legend and hint | as `bars` |

With no expenses this month, or no pace (nothing available, a future month), the
chart views draw no chart: the empty card or the plain week list stands alone.
`line` needs a pace to mean anything and is omitted without one; `bars` still
draws the columns but without pace lines or hint.

### Strings (new keys; Spanish and French in `es.ts` / `fr.ts`)

| Key | English | Spanish |
|---|---|---|
| `settings.weeklyView.title` / `.hint` | Weekly spending / How a bucket draws its weeks | Gasto semanal / Cómo muestra un límite sus semanas |
| `settings.weeklyView.description` | Choose how a bucket's week-by-week spending is drawn. Everything else on the bucket screen stays the same. | Elige cómo se dibuja el gasto semana a semana de un límite. El resto de la pantalla del límite no cambia. |
| `settings.weeklyView.rows` / `.rowsHint` | Week rows / A bar and a pace mark on every week | Filas por semana / Una barra y una marca de ritmo en cada semana |
| `settings.weeklyView.bars` / `.barsHint` | Weekly bars / A column for each week above the list | Barras semanales / Una columna por semana sobre la lista |
| `settings.weeklyView.line` / `.lineHint` | Month line / One line of spending through the month | Línea del mes / Una línea con el gasto a lo largo del mes |
| `editBucket.chartWeeklyTitle` | Spent per week ({{currency}}) | Gastado por semana ({{currency}}) |
| `editBucket.chartLineTitle` | Spending through the month | Gasto a lo largo del mes |

(the chart hints, legends, labels and `editBucket.weekRangeShort` are in `en.ts`,
`es.ts` and `fr.ts`.)

### Approved screens (setting and views)

| Screen | State | File |
|---|---|---|
| Settings | with the Weekly spending row | `approved/settings-view.default.html`, `settings-view.es.html` |
| Weekly spending sheet | default | `approved/weekly-sheet.default.html`, `weekly-sheet.es.html` |
| Edit bucket | Weekly bars | `approved/bucket.bars.html` |
| Edit bucket | Month line | `approved/bucket.line.html` |

# Options considered (round 1 and 2)


**A · Status, expenses, then the form** (`options/a-status-then-form`).
Today's form stays whole but moves to the bottom. Above it: a status card (the
Buckets-list card text: bar, Spent, Left, Allowance, Carried) and the first
four expenses with "Show all 6 expenses". Good: one scroll tells the whole story,
nothing is hidden, least new UI (reuses the bucket card text and money rows).
Cost: Submit sits below a long list, so editing needs a scroll; the longer the
month, the further away the form.
Empty state drawn (nothing spent). Error: the existing validation message
under the field, unchanged.

**B · Overview and Allowance tabs** (`options/b-overview-and-allowance-tabs`).
A two-segment switch (the app's segmented control). **Overview** (default):
status card plus all expenses. **Allowance**: a one-line status strip above the
unchanged form with Submit / Cancel. Good: each tab is short and focused, the
form keeps its place, and the strip keeps the effect of the change in view.
Cost: editing is one tap further, the edit state is a hidden second tab (needs
unsaved-value handling when switching), and a new tab pattern on this screen.
Empty state drawn on Overview.

**C · Read-first, edit in a sheet** (`options/c-read-first-edit-in-sheet`).
A hero card puts **Left** in large type with Spent, the bar, a small
weekly-spending chart, and an "Allowance CA$300.00 · Edit" row. Expenses below
are grouped by week with weekly subtotals. Tapping Edit opens a bottom sheet
with the same field, hint, Submit and Cancel. Good: the best answer to "what is
going on with this bucket" in one glance, and the edit stays one tap away.
Cost: the most to build (weekly chart, week grouping, a sheet; Submit now
closes a sheet instead of leaving the screen, which changes the current
"save then go back" behaviour).
Empty state drawn (no chart, empty note).

## Common to all options
- The Edit-bucket title and the month come from the app's selected month; the
  month label on the card is static (no stepper here).
- Rows reuse the money-row chip (rose up arrow, expenses only).
- Long descriptions wrap (`overflow-wrap: anywhere`); amounts never break.
- Error state for all: the allowance validation message, unchanged. A failure
  to load expenses would reuse the existing empty/error note card.

## Round 2: C with a pace reference (D, E, F)

The owner liked C but asked what the weekly bars mean and for the "expected
spending" level to be shown properly. D, E and F are C (hero card, week-grouped
list, Edit row and sheet unchanged) plus a pace reference. Data: viewed on
Oct 28 (default), Oct 14 (`bucket.ahead`, spending ahead of pace) and Oct 3
with nothing spent (`bucket.empty`). The allowance sheet is C's and is not
redrawn.

**Pace rule (proposed, all three):** available = allowance + carried
(CA$256.63). Expected by today = available × day ÷ days in month. A week's pace
= available × days in that week (inside the month) ÷ days in month, so partial
first and last weeks get a lower line. Under or at pace is green, ahead is
amber (a hint, never red). In a past month the pace is the whole month. If
available is zero or negative, hide the pace and show only Over.

All three add the same two things to C's hero: a **tick on the main bar** at the
expected-by-today position and a line under it, "CA$59.96 under pace" with
"Expected by Oct 28: CA$231.79". They differ in the weekly visualization.

**D · Weekly bars with pace** (`options/d-c-weekly-bars-pace`). C's bars made
legible: titled "Spent per week", each bar labelled with its amount and dates,
a dashed pace line across each bar, green within pace and amber above, a legend
and a one-sentence hint. Closest to C. Cost: five narrow columns with two-line
labels; a month with six weeks gets cramped on a 320px phone.

**E · Week rows** (`options/e-c-week-rows-pace`). No separate chart: each week's
header in the expense list gets a thin bar with a pace tick and "CA$45.65 of
CA$57.95". Labels have room, the number is next to the expenses that cause it,
the hero card stays short, and it scales to any number of weeks. Cost: weeks
are read one at a time, so the trend across weeks is harder to see.

**F · Month pace line** (`options/f-c-month-pace-line`). Drops weeks as a
chart: a cumulative line of spending through the month against a dashed
straight line of even pace up to the available amount, with today marked. Best
at answering "will this bucket last the month?" and it needs no week rule for
the chart (the list stays week-grouped). Cost: a chart type the app does not
use elsewhere, and more to build (SVG scales, step path); less direct for "how
much this week".
