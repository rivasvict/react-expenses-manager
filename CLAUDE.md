# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:3000
npm test           # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
npm test -- -t "test name"    # Run a single test by name
npm test -- --testPathPattern="integrationTests"
npm run build      # Production build
npm run typecheck  # TypeScript type check (no emit)
npm run lint       # Check linting
npm run lint:fix   # Auto-fix lint issues
```

Node version is pinned in `.nvmrc`.

## Architecture

**Stack:** React 18, Redux (with redux-thunk), React Router v5, React Bootstrap, SCSS modules, TypeScript (partial — most files are `.js`, newer files use `.tsx`/`.ts`).

**State shape** (three Redux slices in `src/redux/`):
- `expensesManager` — entries (nested by `year → month → {incomes, expenses}`), selected date, buckets
- `userManager` — authenticated user
- `commonManager` — shared UI state

**Storage abstraction** (`src/services/storageSelector/`): a factory that returns either `LocalStorage` or `RemoteStorage` depending on `STORAGE_TYPES`. Currently hardcoded to `STORAGE_TYPES.LOCAL` in `src/redux/expensesManager/actionCreators.js` — backend integration is disabled. See the TODO comments throughout the codebase for the GitHub issues tracking reinstatement of remote storage and authentication.

**Data flow:**
1. Components dispatch action creators from `src/redux/expensesManager/actionCreators.js`
2. Action creators call `storage.*` methods (LocalStorage uses `window.localStorage`) and `dataParser` (CSV↔JSON conversion)
3. Results are dispatched as Redux actions and handled by the reducer

**Entry data model:** Each entry has `amount`, `description`, `type` (`"income"` or `"expense"`), `date` (Unix timestamp ms), and `categories_path` (comma-delimited string like `,eating out,`). The `categories_path` format is significant — bucket matching and category filtering rely on this exact format.

**Entries structure in Redux:** `entries[year][month][incomes|expenses]` — `getGroupedFilledEntriesByDate()` in `src/helpers/entriesHelper/entriesHelper.js` transforms a flat array into this nested tree and fills empty months.

**Buckets:** Spending limit containers keyed by category name. Stored in `localStorage` under key `"buckets"` as a flat object `{ [bucketName]: limitAmount }`. Bucket name ↔ `categories_path` matching uses `bucketName.toLowerCase()` against the second comma-delimited segment of `categories_path`.

**Routes** (all nested under `/`, handled in `src/components/Dashboard/index.js`):
- `/` and `/dashboard` — DashboardContent
- `/add-income`, `/add-expense` — AddEntry
- `/edit-income/:entryId`, `/edit-expense/:entryId` — EditEntry
- `/incomes`, `/expenses` — EntriesSummaryWithFilter
- `/summary` — Summary
- `/data-management` — CSV import/export
- `/buckets` — Buckets list
- `/edit-bucket/:bucketName` — EditBucket

**Authentication:** `AuthenticatedApp` is currently commented out in `src/App.js`. The app runs without auth, using `WithBalance` to load entries directly.

**Environment:** Copy `.env.template` to `.env` and set `REACT_APP_API_HOST` (defaults to `http://localhost:9000`) when backend is needed.

## Key patterns

- Components connect to Redux via `connect()` (class-style HOC pattern, not hooks)
- Action creators are injected via `mapActionToProps` — components never import storage directly
- Categories are hardcoded in `src/helpers/entriesHelper/entriesHelper.js` (`getEntryCategoryOption`) and must match the bucket names in the reducer's `initialState`
- Mixed JS/TS: existing JS files stay `.js`; new components use `.tsx`. TypeScript errors in JSX are sometimes suppressed with `{/* @ts-expect-error */}` or `{/** @ts-ignore */}`

## Integration test helpers (`src/integrationTests/helpers/`)

- **`renderApp.tsx`** — renders the full app in a `MemoryRouter` with a fresh Redux store; returns `{ user, store, ...RenderResult }`.
- **`seed.ts`** — `seedEntries(entries)` writes entries to `localStorage`; `ts(year, month, day?)` builds a Unix-ms timestamp; month constants `JANUARY`–`DECEMBER` (0-indexed).
- **`navigation.ts`** — `goToPrevMonth(user, expectedTitle)` and `goToNextMonth(user, expectedTitle)`: click the Prev/Next button and wait for the new month heading. Use these instead of inline `findByRole("button", …)` calls so the assertion pattern stays consistent across test files.
- **`categorySelect.ts`** — `selectCategory(user, categoryName)`: opens the searchable category dropdown (`CategorySearchSelect`) and clicks the matching option. Use this instead of inline `click(combobox)` → `click(option)` pairs whenever a test just needs to pick a category. Its internal `findByRole("option", …)` throws when the category is missing, so option presence is still asserted. Tests that exercise the dropdown *mechanics* (type-to-filter, empty state, keyboard nav) should still drive the control directly.

## General guidelines for development

* Make sure to run `npm test -- --testPathPattern="integrationTests"` on every edition such that we make sure no functionality is broken.
* Make sure to run `npm run typecheck` on every edition to catch TypeScript errors early.
* Use arrow functions by default. Only use regular `function` declarations when syntax requires it (e.g. generator functions, methods that need their own `this` binding in class components).
* In integration tests, verify behaviour through what the user sees on screen (`screen.findByText`, `screen.getByRole`, etc.) rather than inspecting Redux store state or `localStorage` directly. Raw data-structure checks are an implementation detail; UI assertions test what actually matters.
* Every pull request must bump the app version: update `"version"` in `package.json` (and `package-lock.json`) and add a corresponding entry to `CHANGELOG.md`, following the existing `Keep a Changelog` format used there.
