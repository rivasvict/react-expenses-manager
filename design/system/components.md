# Component inventory

Each component on the [reference board](reference/design-system.dc.html) and where it lives in
code. Before building UI, reuse what is listed here. A new shared component gets a row here in the
same PR that adds it.

| Component | Board section | Implementation |
|---|---|---|
| Card | Cards & tiles | `@mixin card` / `@mixin interactive-card` in `src/variables.scss` |
| Buttons (primary, secondary, danger) | Buttons | `@mixin buttons` in `src/variables.scss` (`.btn-primary`, `.btn-secondary`, `.btn-danger`); `src/components/common/ButtonLikeLink.js` for a router link styled as a button |
| Text input, select, checkbox, switch | Form controls | `.form-control` / `.form-check-input` in `src/global.scss`; `$select-chevron` in `src/variables.scss` |
| Validation message | Form controls | `.validation-message` in `src/global.scss` |
| Searchable category select | Form controls | `src/components/common/CategorySearchSelect/` |
| Slide-down / slide-up reveal (the amount keypad) | Motion | `src/components/common/SlideReveal/`; `$transition-slide` in `src/variables.scss` |
| Money row + icon chip | Money rows | `src/components/common/ExpensesManager/Summaries/EntriesSummary.scss`; `@mixin icon-chip`, `@mixin money-figures` in `src/variables.scss` |
| Budget bucket (progress card) | Budget buckets | `src/components/common/ExpensesManager/Buckets/components/Bucket/` |
| App navigation / bottom tab bar | Navigation | `.app-nav` in `src/components/common/Header.scss` |
| Month header (prev/next, with the month title as a pill that opens the month picker) | Navigation | `src/components/common/NavigableMonthHeader/` |
| Month picker sheet (bottom sheet with a year stepper over a 4x3 grid of months; months without data are dimmed, the selected one is gold; opened by the month title's pill) | Navigation | `src/components/common/NavigableMonthHeader/MonthPickerSheet/` (availability rules: `NavigableMonthHeader/utils/monthAvailability.ts`) |
| Doughnut chart | Categorical chart palette | `src/components/common/DoughnutChart/` |
| Version label (quiet app-version caption) | Masthead | `src/components/common/VersionLabel/`; version from `src/version.ts` |
| Brand mark | Masthead | `src/components/common/BrandMark/` |
| Dashboard composition | The dashboard, assembled | `src/components/Dashboard/components/DashboardContent/` |
| Sync server status note (offline dot + label + explanation, in place of an action that needs the server) | Sync unavailable | `src/components/common/SyncOfflineNote/` |
| Savings change badge (▲/▼ percentage pill + "vs <month>" caption, in the savings card's footer) | The dashboard, assembled | `src/components/common/SavingsChangeBadge/`; computed by `src/helpers/savingsChange/` |
| Savings change pill (arrow + signed percentage on a green / red / grey tint) | The dashboard, assembled | `src/components/common/ChangePill/` |
| Savings trend link (gold "Trend ›" with a trending-up chip, in the savings card's footer) | The dashboard, assembled | `src/components/common/SavingsTrendLink/` |
| Range switch (segmented control of 1M … YTD plus a calendar button; dimmed when out of reach) | Savings trend | `src/components/common/SavingsTrend/RangeSwitch/` |
| Trend chart (SVG line over a dashed baseline, green above and red hatched below, with a month tooltip; plots the running total over a zero line on the Total saved tab) | Savings trend | `src/components/common/SavingsTrend/TrendChart/` (tooltip: `TrendChart/ChartTooltip/`) |
| Trend summary (the headline card: tabs on top, then either the "October vs April" amount, percentage pill and caption or the total saved) | Savings trend | `src/components/common/SavingsTrend/TrendSummary/` |
| View tabs (underline tab pair, Total saved left / Change right, at the top of the headline card) | Savings trend | `src/components/common/SavingsTrend/ViewTabs/`, built on Underline tabs |
| Underline tabs (equal-width tabs over a rule, gold underline on the selected one, optional count badge; arrow keys, Home and End) | Savings trend, Categories | `src/components/common/UnderlineTabs/` |
| Total figures (label, total saved, month count and monthly average, inside the headline card) | Savings trend | `src/components/common/SavingsTrend/TotalFigures/` (maths: `src/helpers/savingsTrend/savingsTotal.ts`) |
| Custom range sheet (bottom sheet over a scrim with From / To month selects) | Savings trend | `src/components/common/SavingsTrend/CustomRangeSheet/` |
| Bottom sheet (scrim, panel, grabber, heading with an optional eyebrow, close chip; focuses its heading or a given field, closes on Escape or scrim). **Tall** variant: up to 92vh with a scrolling body; an optional **footer** stays fixed under the body, above a rule | Savings trend, Settings, Categories | `src/components/common/BottomSheet/` (`variant="tall"`, `footer`, `role="alertdialog"`); the category sheets' raised surface is `.category-sheet` in `src/components/common/ExpensesManager/Categories/styles.scss` |
| Setting row (label, hint, current value and chevron; opens a sheet) | Settings | `src/components/Settings/SettingRow/` |
| Currency tile grid (symbol + code radio tiles; 3 columns in the Settings sheet, 4 in the onboarding wizard) | Settings, Onboarding | `src/components/Settings/CurrencyTileGrid/`, placed in a sheet by `src/components/Settings/CurrencySheet/` |
| History notice (the card that replaces the headline and chart when a range cannot be drawn, with an optional gold action) | Savings trend | `src/components/common/SavingsTrend/HistoryNotice/` |
| Switch row (label, hint and an on/off switch in the same raised row as a setting row; the whole row is the switch) | Settings | `src/components/Settings/SwitchRow/` |
| Hidden figure (a blurred, fixed placeholder with a spoken label, in place of a money figure while Privacy mode hides it) | The dashboard, assembled | `src/components/common/HiddenFigure/`; the placeholders are in `src/privacy/hiddenFigures.ts` |
| Privacy eye (gold eye chip beside the "Savings" label that shows or hides the dashboard's figures; absent while Privacy mode is off) | The dashboard, assembled | `src/components/common/PrivacyEye/`; state from `src/privacy/` |
| Hidden balance chart (one uniform grey ring and a neutral legend in place of the savings doughnut) | The dashboard, assembled | `src/components/common/HiddenBalanceChart/` |
| Category row (type chip, name over its usage and bucket, chevron; the whole row is a button that opens the category sheet) | Categories | `src/components/common/ExpensesManager/Categories/CategoryRow/` |
| Type chip (the money-row chip for a category type: rose up arrow for expenses, green down arrow for incomes) | Categories, Sync review | `src/components/common/ExpensesManager/Categories/TypeChip/` |
| Usage figures (three-column strip of a bold value over a small label: entries, total, bucket) | Categories | `src/components/common/ExpensesManager/Categories/UsageFigures/` |
| Callout (tinted note with an icon: amber `warn` before a consequential save, red `danger` for an irreversible action) | Categories | `src/components/common/Callout/` |
| Category illustration (dashed card, two tags and a gold plus; empty categories and the blocked delete sheet) | Categories | `src/components/common/ExpensesManager/Categories/CategoryIllustration/` |
| Wizard shell (full-screen first-run frame: brand, a card with a pinned step bar, and a footer pinned to the bottom with a summary line, Back and the one gold primary action; a fade above the footer shows more content below, and the footer steps aside while a text field has the keyboard) | Onboarding | `src/components/Onboarding/WizardShell/` |
| Step bar ("Step N of M" eyebrow, Skip setup link and one gold/track segment per step) | Onboarding | `src/components/Onboarding/StepBar/` |
| Selectable chip (toggle pill, gold-soft wash and a check when selected, 2.5rem tall, wraps long names) | Onboarding | `src/components/common/SelectableChip/` |
| Segmented control (a few exclusive choices side by side on native radios, the chosen one in the gold-soft wash) | Onboarding | `src/components/common/SegmentedControl/` |
| Bucket row (checkbox, category name and a monthly limit field, with the validation message under the row) | Onboarding | `src/components/Onboarding/BucketRow/` |
| Summary row (title, small hint and an Edit link; the review step's one line per section) | Onboarding | `src/components/Onboarding/SummaryRow/` |
| Info note (quiet neutral note with an info icon, for reassurance rather than a warning) | Onboarding | `src/components/Onboarding/InfoNote/` |
