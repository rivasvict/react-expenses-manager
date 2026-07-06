# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-07-05

A mature beta. This version consolidates the buckets, categories,
fixed-entries, and backup/restore work into a single supported release,
but is not yet declared stable.

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

[0.2.0]: https://github.com/rivasvict/react-expenses-manager/releases/tag/v0.2.0
