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
npm run lint:styles   # Stylelint: design-token rules for SCSS
npm run tokens:build  # Regenerate _tokens.scss / tokens.css from src/styles/tokens.json
npm run gallery:build # Validate design/features/*/ui/ packages; regenerate design/gallery.html and each ui/flow.html
npm run design:review -- --feature <slug>  # Compare a built feature with its approved design (needs `npm run build`, Playwright, Node 18+)
```

Node version is pinned in `.nvmrc`.

## Architecture

**Stack:** React 18, Redux (with redux-thunk), React Router v5, React Bootstrap, SCSS modules (design tokens in `src/styles/tokens.json`, see `design/system/`), TypeScript (partial — most files are `.js`, newer files use `.tsx`/`.ts`).

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
- `/settings` — Settings (device preferences such as the UI language; reached from the gear chip in the app bar)

**Authentication:** `AuthenticatedApp` is currently commented out in `src/App.js`. The app runs without auth, using `WithBalance` to load entries directly.

**Environment:** Copy `.env.template` to `.env` and set `REACT_APP_API_HOST` (defaults to `http://localhost:9000`) when backend is needed.

**Server (`server/`):** The local multi-user sync backend is written in strict TypeScript, compiled ahead of run rather than via `ts-node` (`server/tsconfig.json` → `server/dist/`, wired through `npm run build:server`/`sync-server`/`test:server`). The compiled output must stay dependency-free — only Node builtins, no npm packages at runtime — since it's what gets deployed. Tests are colocated (`core/crypto.ts` ↔ `core/crypto.test.ts`) and run with the Node built-in test runner, not Jest; CRA's Jest config does not scan `server/`.

## Key patterns

- **Every piece of UI text is translated.** The app ships in English (default) and Spanish (`src/i18n/`). Whenever you add or change text the user can see or hear — JSX text, `placeholder`, `aria-label`, `title`, `alt`, page titles, button labels, `window.confirm` messages, validation/error messages, chart labels — add a key to `src/i18n/translations/en.ts` **and** its Spanish text to `src/i18n/translations/es.ts`, then render it with `t("key")` from `useTranslation()` (or `withTranslation(Component)` for class components). Never hardcode an English string in a component. `es.ts` is typed against `en.ts`, so `npm run typecheck` fails on a missing key, and `src/i18n/translations/translations.test.ts` fails on a dropped `{{placeholder}}`. See the conventions at the top of `en.ts`: `{{name}}` placeholders, `_one`/`_other` plural pairs via `plural(key, count)`, `<link>…</link>` spans via `<Trans>`, and short `nav.*` labels (the mobile tab bar is narrow). Pure helpers that produce text take an optional `Translator` defaulting to English (`defaultTranslator`), e.g. `getBucketAllowanceValidationError(value, translator)`.
- **User data is never translated.** Category and bucket names, descriptions and amounts are shown exactly as stored; the language preference lives only in `localStorage` (`settings.language`, see `src/i18n/languagePreference.ts`) and never touches the entries model, the backup format or the sync server. Sync-server error text is mapped by error code with `getSyncErrorMessage` (the server's own English wording is kept in English).
- Integration tests run in English by default; to exercise Spanish, pick it on `/settings` (see `src/integrationTests/languageSettings.test.tsx`).
- **Every piece of UI follows the design system** (`design/system/README.md`). Read it and `design/system/components.md` before building or changing UI, and reuse the listed components and the mixins in `src/variables.scss` (`card`, `interactive-card`, `buttons`, `icon-chip`, `money-figures`, `focus-ring`) before writing new styles. Colors, radii, shadows and font stacks come only from `src/styles/tokens.json`: in SCSS use the generated variables (`$accent`, `$radius-card`, …, or derive one with `rgba($accent, 0.28)`), and in JS/TSX import `tokens.json`. Never write a literal hex, named, `rgb()` or `hsl()` color, a literal `border-radius` or a font stack anywhere else; `npm run lint:styles` and `npm run lint` fail CI on them. A value that is genuinely new is added to `tokens.json`, followed by `npm run tokens:build`, and the JSON and both generated files are committed together (`src/styles/tokenFormats.test.js` fails when they drift). A new shared component gets a row in `components.md` in the same PR.
- **A feature's UI is designed before it is built, and the approved design is the visual spec.** All design work lives in `design/` (proposals, evaluations and the design system); `docs/` is only for shipped, production-usable parts of the app, so never put a proposal there. The convention is in `design/README.md`; a feature's designs live in `design/features/<feature>/ui/` (`decision.md` with a `status` of `exploring` / `approved` / `implemented`, alternatives under `options/`, final screens under `approved/<screen>.<state>.html`). When you **design**, use the `/ui-explore` skill (2–3 options) and, once the user names one, the `/ui-approve` skill (approved screens, `flow.json`, `fixtures.json`, implementer notes); work only inside `design/` (never edit `src/` to try a design), build mockups from `design/system/tokens.css` and `mockup.css` with no literal colors and no external resources, and run `npm run gallery:build`, committing the regenerated `design/gallery.html` (a unit test fails when it is stale). When you **implement** a feature whose `decision.md` says `approved`, build to `ui/approved/` and `ui/flow.json` exactly; where they are silent or conflict with the app, flag it in the PR instead of improvising, and before opening the PR run the `design-reviewer` agent (or `npm run design:review`) and fix what it reports. Packages with `example: true` are demonstrations, never built. Mockup text never replaces translation: every visible string still needs English and Spanish.

- Components connect to Redux via `connect()` (class-style HOC pattern, not hooks)
- Action creators are injected via `mapActionToProps` — components never import storage directly
- Categories are hardcoded in `src/helpers/entriesHelper/entriesHelper.js` (`getEntryCategoryOption`) and must match the bucket names in the reducer's `initialState`
- Mixed JS/TS: existing JS files stay `.js`; new components use `.tsx`. TypeScript errors in JSX are sometimes suppressed with `{/* @ts-expect-error */}` or `{/** @ts-ignore */}`

## Integration test helpers (`src/integrationTests/helpers/`)

- **`renderApp.tsx`** — renders the full app in a `MemoryRouter` with a fresh Redux store; returns `{ user, store, ...RenderResult }`.
- **`seed.ts`** — `seedEntries(entries)` writes entries to `localStorage`; `ts(year, month, day?)` builds a Unix-ms timestamp; month constants `JANUARY`–`DECEMBER` (0-indexed).
- **`navigation.ts`** — `goToPrevMonth(user, expectedTitle)` and `goToNextMonth(user, expectedTitle)`: click the Prev/Next button and wait for the new month heading. Use these instead of inline `findByRole("button", …)` calls so the assertion pattern stays consistent across test files.
- **`categorySelect.ts`** — `selectCategory(user, categoryName)`: opens the searchable category dropdown (`CategorySearchSelect`) and clicks the matching option. Use this instead of inline `click(combobox)` → `click(option)` pairs whenever a test just needs to pick a category. Its internal `findByRole("option", …)` throws when the category is missing, so option presence is still asserted. Tests that exercise the dropdown *mechanics* (type-to-filter, empty state, keyboard nav) should still drive the control directly. On `/expenses`/`/incomes` the category picker lives inside the Filters sheet, so call `openFilterSheet(user)` first.
- **`filters.ts`** — `openFilterSheet(user)`: opens the "Filters & sort" sheet/panel from the entry-list toolbar and waits for its heading. `searchEntries(user, term)`: types into the toolbar's live "Search entries" field. Use these instead of inline queries whenever a test just needs to open the sheet or narrow the list; tests exercising the sheet/search mechanics themselves should drive the controls directly.

## General guidelines for development

* Make sure to run `npm test -- --testPathPattern="integrationTests"` on every edition such that we make sure no functionality is broken.
* Make sure to run `npm run typecheck` on every edition to catch TypeScript errors early.
* Use arrow functions by default. Only use regular `function` declarations when syntax requires it (e.g. generator functions, methods that need their own `this` binding in class components).
* In integration tests, verify behaviour through what the user sees on screen (`screen.findByText`, `screen.getByRole`, etc.) rather than inspecting Redux store state or `localStorage` directly. Raw data-structure checks are an implementation detail; UI assertions test what actually matters.
* Colocate unit test files with the file they test (e.g. `Foo.ts` → `Foo.test.ts` in the same directory), matching the existing convention under `src/`. This is distinct from `src/integrationTests/`, which stays a separate suite by design — see the helpers above.
* Code under `server/` is TypeScript, compiled ahead of run (see the Server note under Architecture) — write new server code as `.ts`, not `.js`, and add its test file beside it.
* A file's responsibilities should feel cohesive: someone opening it should be able to state what it is *for* in one sentence. This is **not** a one-function-per-file rule — helpers that serve a single concern belong together. Split a file once it has accumulated several unrelated jobs. For example: `server/core/handlers/responses.ts` holds four related functions and stays one file, while each endpoint gets its own module under `server/core/handlers/` with a colocated test, leaving `server/core/handlers.ts` as just the wiring.
* In `server/`, when a file declares **more than two** types (`interface`/`type`), move them into a sibling `*.types.ts` file, which becomes the place those types are exported from — consumers import them from there directly. The implementation file imports what it needs and stays about behaviour; it re-exports a type only when callers need it alongside the behaviour they already import from that module, since re-exporting the rest just gives a type two import paths. Files with two or fewer types keep them inline; splitting those is noise. For example: `handlers.ts` → `handlers.types.ts`, `crypto.ts` → `crypto.types.ts`; `router.ts` re-exports `App` because callers of `createApp` need it, while `handlers.ts` re-exports nothing, as `createHandlers` is used on its own.
* When creating **new files** — components, helpers, services, reducers — add their tests in the same PR, colocated as described above. When you only **edit an existing file** that lacks coverage, do *not* backfill its tests as part of that PR: add a `TODO` comment at the top of the file stating the gap, create (or reuse) a GitHub issue tracking it, and reference that issue's URL in the comment. This keeps a feature PR from turning into a test-backfill project while making sure the debt is written down rather than forgotten.
* When a comment cites project documentation by tag or section — `DESIGN §2.1`, `RFC §3`, `AC-1.6`, `NFR-5` — it must also give the **path to the document**, so a reader can actually find it (e.g. `docs/multi-user-sync/DESIGN.md §2.1`). A bare tag is untraceable for anyone who does not already know where it lives. Give the full path at a file's *first* such reference; later mentions in that same file may use the short tag, since the path is already established at the top. Do not cite a PR by number for future work (`lands in PR 2`) — PR numbering shifts as branches are split and reordered; say "a later PR" instead.
* A component defined inside another component's file must not exceed **5 lines**. Past that, move it into its own module (a directory with an `index.tsx`, matching `GlyphIcon`/`BrandMark`/`AccountChip` under `src/components/common/`, with a colocated `styles.scss` when it has styles of its own). The 5 lines are a ceiling to design comfortably under, **not** a target to hit: do not cut identifiers short, strip comments, or cram JSX just to get under the number. Use however many lines the implementation needs to stay clean and clear — and if that is more than 5, that is the signal it belongs in its own file.
* Every pull request must bump the app version: update `"version"` in `package.json` (and `package-lock.json`) and add a corresponding entry to `CHANGELOG.md`, following the existing `Keep a Changelog` format used there. **The one exception is a pull request that changes only files under `design/`**: that is a proposal or an evaluation, not a change to the app, so it gets no version bump and no changelog entry. If a PR touches `design/` and anything else, the usual rule applies to the whole PR, so keep design work in its own PR.

## GitHub issue creation

When creating a new issue via `gh issue create`:
* Always add it to the `x-track` project using the `-p x-track` flag
* Ask the user which existing milestone (if any) the issue should be added to, and include it with `-m` if specified
* Example: `gh issue create --title "..." --body "..." -p x-track -m "v1.8.0"`
