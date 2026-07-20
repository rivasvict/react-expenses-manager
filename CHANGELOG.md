# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-07-20

### Added
- Filters & sorting on the monthly summary (/summary): the shared toolbar
  (live search, sort, Filters button) and the Filters sheet/panel now render
  on the summary screen, and the ONE shared filter/sort state drives BOTH
  the incomes and the expenses lists simultaneously — a filter set on
  /expenses or /incomes is already active when navigating to /summary and
  vice versa
- Gold banner variant for /summary: "Filtered view · both lists" with the
  combined "N of M entries" across both lists and a signed net filtered
  total ("Filtered total · net", e.g. "+$3,125.02") — income-green when
  positive, expense-rose when negative, neutral at zero
- "Matching incomes" / "Matching expenses" section headers with per-list
  money totals while filtered (`ListSectionHeader` gained an optional
  `totalText` shown instead of the entry count)
- The sheet's category picker on /summary offers income AND expense
  categories, since one filter drives both lists
- Combined empty state on /summary when zero entries match across both
  lists; charts (type doughnut and per-type category charts) recompute
  against the filtered subsets

### Changed
- The Summary screen is now Redux-connected (`entryFilters` +
  setEntryFilters/clearEntryFilters); the "Show" entry-type select is
  untouched — filters apply within whatever it displays, and the banner
  keeps reporting both lists
- Both /summary lists now honor the shared sort key (date-newest-first by
  default), matching the /expenses and /incomes behavior

### Tests
- New integration suite `summaryFilters.test.tsx` (11 tests): both-list
  narrowing from one search, shared sort ordering across lists, income
  categories in the picker, signed net total with polarity (positive green
  / negative rose), per-list Matching headers with totals, chip removal
  and Clear restoring tile + default sort, cross-screen filter carryover
  from /expenses, "Show" select regression and interplay, and the combined
  empty state

## [1.4.0] - 2026-07-20

### Added
- "Filters & sort" sheet on the incomes/expenses report: a Filters button
  (funnel icon) on the toolbar opens a bottom sheet over a scrim on narrow
  screens and an inline bordered panel on wide ones (same markup, pure CSS
  switch at the nav breakpoint). It holds the shared search field, a
  "Search in" segmented toggle ("All text" matches category + description;
  "Description only" scopes to the entry's description, with hint copy),
  the searchable category picker, the shared "Sort by" options ("same as
  toolbar"), a "Clear all" button and a primary "Show N results" button
  with a live count that simply dismisses (filtering is live — no Apply)
- Gold "Filtered view" banner that replaces the total tile whenever any
  filter is active: funnel indicator, "N of M entries", one removable chip
  per active filter (quoted search term, "Category: X", "Description
  only"), a dashed gold divider, the "Filtered total" in expense-rose /
  income-green, and an outlined Clear button that removes every filter AND
  resets the sort to Date. Count and total sit in `aria-live="polite"`
  regions
- Gold count badge on the Filters button for active filters beyond search
- List section header above the rows: uppercase tinted "Expenses"/"Incomes"
  ("Matching expenses/incomes" while filtered) with a right-aligned entry
  count
- Dashed-border empty state for zero matches ("No entries match your
  filters", "Try a different search term or a broader category.", and a
  "Clear all filters" button) while the banner keeps showing "$0.00" and
  "0 of M entries"
- Accessibility: focus moves to the sheet heading on open and back to the
  Filters button on close; Escape and the scrim close the sheet; chip
  removers are real labelled buttons; scope and sort options in the sheet
  are native radios

### Changed
- The standalone "Filter by category" control moved from the report screen
  into the Filters sheet/panel (same searchable dropdown, same semantics)
- `EntriesSummary` accepts a `hideHeader` prop and `SummaryWithChart` a
  `listHeader` node so the new section header can replace the built-in list
  heading without affecting `/summary`

### Tests
- New integration suite `filterSheet.test.tsx` (14 tests): sheet
  open/close with focus management, shared search/sort state between
  toolbar and sheet, live "Show N results" count, scope-toggle semantics,
  banner replacing the tile with chips/count/total, per-chip removal,
  Clear resetting the sort, badge counting, section headers, empty state,
  and symmetric /incomes coverage
- New helper `integrationTests/helpers/filters.ts` (`openFilterSheet`,
  `searchEntries`), registered in the CLAUDE.md helper list; category
  filter tests now open the sheet before picking a category

## [1.3.0] - 2026-07-20

### Added
- Live search and sorting on the incomes/expenses monthly report: a slim
  toolbar under the total tile with a "Search entries" field (matches
  description and category name, case-insensitive, narrows the list as you
  type) and a "Sort: <key>" button opening a single-select popover menu
  ("Date — newest first" (default), "Amount — highest first",
  "Name — A → Z" tie-broken by description) with full keyboard support
  (arrows, Enter, Escape) and a gold check on the selected option
- The visible total and the category doughnut chart now recompute from the
  searched/sorted/filtered subset
- Filters and the sort key are shared app state (`entryFilters` in the
  `expensesManager` slice) persisted to `localStorage`, so they survive
  month navigation and a page reload; new `filterSortHelper` module holds
  the pure filter/sort/descriptor logic

### Changed
- The incomes/expenses "Filter by category" control now drives the shared
  `entryFilters.category` state instead of the legacy `category` field
  (the old field and its `CATEGORY_CHANGE` action remain in the reducer,
  unused, pending a follow-up removal)

### Tests
- New unit suites for `filterSortHelper` (search scopes, literal category
  match incl. regex-special names, sort orders, ties, immutability,
  descriptors) and for the new `entryFilters` reducer cases
- New integration suite `filterSortEntries.test.tsx`: live search
  narrowing/restoring, category-name matches, total updates, row-order
  assertions for every sort key, keyboard operation of the sort menu,
  category-filter regression (incl. "House (Rent)"), persistence across
  month navigation and across a fresh app render, and symmetric /incomes
  coverage
- Lint gate restored to green: the skipped legacy TODO(#116) suites now
  carry targeted `eslint-disable` comments for their false-positive
  Testing Library rules, and a duplicated describe title in the skipped
  AddEntry suite was corrected

## [1.2.1] - 2026-07-19

### Fixed
- Category filter on the incomes/expenses report no longer breaks for
  categories whose name contains regex-special characters (e.g.
  "House (Rent)"). `getFilteredEntriesByCategory` used
  `categories_path.match(category)`, which treated the selected category
  value as a regular expression, so the parentheses in "House (Rent)" were
  parsed as a capture group and never matched the stored
  `,house (rent),` path. It now matches the category value literally with
  `String.prototype.includes`

## [1.2.0] - 2026-07-18

### Added
- Searchable category dropdowns: every category select (entry form,
  incomes/expenses category filter, Add bucket) is now a hand-built
  type-to-filter combobox (`CategorySearchSelect`) with a search box inside
  the popup, case-insensitive substring filtering, full keyboard support
  (open with Enter/Space/arrows, navigate with ArrowUp/ArrowDown, commit
  with Enter, dismiss with Escape), click-outside close, and a
  "No matching categories" empty state. The closed trigger keeps the exact
  look of the previous native select and the ARIA 1.2 combobox + listbox
  pattern; no new dependencies were added

### Changed
- `CategorySelector` is now a thin adapter over `CategorySearchSelect`,
  preserving its props contract (`handleChange` still receives an
  event-like `{ currentTarget: { value, name } }`, values keep the
  `,category,` format and `""` for the empty option)

### Tests
- New unit suite for `CategorySearchSelect` (open/close, filtering,
  selection, keyboard navigation with clamping, empty state, click-outside,
  empty-option reset) and new integration tests for type-to-filter entry
  creation and the no-match empty state
- Integration tests that drove the old native select via
  `user.selectOptions` now open the combobox and click the option instead;
  assertions and intent are unchanged
- `CategorySelector.test.js.snap` regenerated for the new markup

## [1.1.0] - 2026-07-10

### Changed
- Complete UX/UI overhaul on a new design-token system (`variables.scss`):
  refined dark "calm fintech" palette, consistent card surfaces, radii,
  focus-visible rings, and semantic income (green) / expense (rose) colors
  used across rows, totals, icon chips and charts
- Navigation: the Bootstrap navbar was replaced by an app bar with an
  icon+label nav — inline at the top on wide screens, a fixed bottom tab bar
  on narrow ones — with active-route highlighting; the same links (Home,
  Categories, Buckets, Fixed Entries, Data Management) stay in the DOM in
  both layouts
- Dashboard: savings now lead as a hero balance card (tone-colored by sign),
  followed by the month navigator, balance donut and tappable income/expense
  stat rows; Add Income / Add Expenses sit side by side
- Month navigation: Prev/Next became round chevron buttons with
  "Previous month" / "Next month" accessible names
- Buckets: each bucket is a card with a rounded progress bar (green → amber
  at 65% → red past 85%), a colored usage percentage and clearer
  Spent / Remaining / Allowance rows
- Forms: visible field labels (Amount, Description, Category, Monthly
  allowance…), helper hints, a styled recurring toggle, and the entry
  category select now prompts "Select a category" instead of "All categories"
- Summary tiles show plain text totals ("July total: …", "Expenses total: …")
  instead of the meaningless "remote" glyph; entry rows and totals use
  money-in/money-out arrow chips
- Data Management: reorganized into explanatory cards ("Keep your data
  safe" / "Danger zone"); clearing all data now asks for confirmation first
- Charts: doughnuts use a CVD-validated categorical palette with
  surface-colored slice gaps, softer legend, and a semantic green/red pair
  for income-vs-expense charts
- Data disclaimer modal restyled and reworded; button label fixed
  ("I Aknowledge" → "Got it")

### Fixed
- Refreshing (or landing directly) on `/summary` no longer shows an empty
  $0.00 report: the Summary screen derives its data from the store at render
  time instead of freezing whatever was loaded at mount
- Link-styled primary buttons no longer inherit the global link color, which
  washed out the gold "Add …" buttons with light text

### Tests
- `entryCreation.test.tsx`: the income-creation assertion now tolerates the
  same amount appearing in both the savings hero and the incomes row (the
  seeded scenario has no expenses, so both legitimately read $1,000.00)
- `CategorySelector.test.js.snap`: refreshed — the empty option renders the
  same DOM from a single template string
- `fixedEntries.test.tsx`: the "no Prev/Next on a single-month tree"
  assertions now match the buttons' new accessible names (`/prev/i`,
  `/next/i`) so the guard is no longer vacuous

## [1.0.4] - 2026-07-10

### Added
- CI: `unit-tests` and `integration-tests` GitHub Actions workflows, running
  on push to `master` and on pull requests targeting `master`. Both pin
  Node via `.nvmrc`, install with `npm ci`, and split the suite using the
  existing `testPathPattern="integrationTests"` convention

## [1.0.3] - 2026-07-10

### Fixed
- `App.test.js`: pass a real Redux store to `<App />` so the test no longer
  crashes inside `Provider`
- `CategorySelector.test.js`: refreshed a snapshot that predated the
  `categories_path` comma-delimited format and the added `className` prop
- `entriesHelper.test.js`: `getGroupedFilledEntriesByDate` fixture dates were
  stored as `Date#toString()` strings instead of Unix-ms timestamps, so every
  entry was silently grouped under `"NaN"/"NaN"`; converted the fixture and
  froze the system clock in the test so the "fill empty months up to now"
  behavior stays deterministic

### Changed
- Skipped 4 unit test suites (`Dashboard/index.test.js`,
  `AddEntry/index.test.js`, `Summaries/EntriesSummary.test.js`,
  `Summaries/EntrySummaryWithFilter.test.js`) that exercise component APIs
  removed in earlier refactors; each carries a `TODO(#116)` pointing at the
  tracking issue for their rewrite
- Removed the orphaned `Dashboard.test.js.snap`, left over from the
  now-fully-skipped Dashboard suite

## [1.0.2] - 2026-07-09

### Added
- Fixed Entries: section totals for the Incomes and Expenses lists, showing
  the sum of the recurring entries applying to the viewed month (#113)

## [1.0.0] - 2026-07-05

First stable release. This version consolidates the buckets, categories,
fixed-entries, and backup/restore work into a single supported release.

### Added
- Single-file backup & restore for the entire app's data (#109)
- Fixed Entries: mark incomes/expenses as recurring per category, with a
  dedicated Fixed Entries page and the ability to promote a regular entry
  to recurring from the edit screen (#103)
- Custom categories: create new categories together with their bucket (#100)
- Buckets: per-category budgeting buckets with per-month limits and
  carry-over of remainders/debt across months (#102, buckets exploration
  and management)
- Backup & restore for buckets data
- Integration test suite covering the core expense-manager flows (#89, #91)
- `typecheck` npm script for TypeScript checking
- `CLAUDE.md` project documentation for contributors

### Changed
- Per-month bucket limit edits now apply from the edited month forward
  instead of retroactively (#102)
- Negative bucket availability is now shown as `$0.00 (-deficit)` instead
  of a raw negative number
- Bucket card UI simplified per design feedback
- Internal categories state renamed to `unbudgetedCategories` for clarity (#100)

### Fixed
- New entries are now stamped with the selected month/year instead of the
  wall-clock date (#93)
- Cross-year month filling and a missing entry UUID after creation (#91)
- Leading zero re-appearing when re-entering a value after clearing the
  edit-bucket input
- Prev navigation no longer enabled when no user data exists
- Restore now navigates to the dashboard on success and hardens `FileReader`
  cleanup (#109)
- Dashboard `PropTypes` corrected for entries; recurring-entry coverage
  strengthened
- Various spacing/sizing fixes across the Buckets, Categories, and Fixed
  Entries pages
- Stale personal references and ESLint warnings removed; license file fixed

[1.0.2]: https://github.com/rivasvict/react-expenses-manager/releases/tag/v1.0.2
[1.0.0]: https://github.com/rivasvict/react-expenses-manager/releases/tag/v1.0.0
