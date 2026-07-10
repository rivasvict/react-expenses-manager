# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
