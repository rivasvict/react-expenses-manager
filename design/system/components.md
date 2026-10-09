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
| Month header (prev/next) | Navigation | `src/components/common/NavigableMonthHeader/` |
| Doughnut chart | Categorical chart palette | `src/components/common/DoughnutChart/` |
| Version label (quiet app-version caption) | Masthead | `src/components/common/VersionLabel/`; version from `src/version.ts` |
| Brand mark | Masthead | `src/components/common/BrandMark/` |
| Dashboard composition | The dashboard, assembled | `src/components/Dashboard/components/DashboardContent/` |
| Sync server status note (offline dot + label + explanation, in place of an action that needs the server) | Sync unavailable | `src/components/common/SyncOfflineNote/` |
| Savings change badge (▲/▼ percentage pill + "vs <month>" caption under the savings amount) | The dashboard, assembled | `src/components/common/SavingsChangeBadge/`; computed by `src/helpers/savingsChange/` |
