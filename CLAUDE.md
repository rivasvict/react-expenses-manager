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
npm run design:review -- --feature <slug>  # Compare a built feature with its approved design (needs `npm run build`, Node 18+ and a Chromium: `npx playwright install chromium`)
```

Node version is pinned in `.nvmrc`.

## Architecture

**Stack:** React 18, Redux (with redux-thunk), React Router v5, React Bootstrap, SCSS modules (design tokens in `src/styles/tokens.json`, see `design/system/`), TypeScript (partial — most files are `.js`, newer files use `.tsx`/`.ts`).

**State shape** (three Redux slices in `src/redux/`):
- `expensesManager` — entries (nested by `year → month → {incomes, expenses}`), selected date, buckets, `categoryLists`
- `userManager` — authenticated user
- `commonManager` — shared UI state

**Storage abstraction** (`src/services/storageSelector/`): a factory that returns either `LocalStorage` or `RemoteStorage` depending on `STORAGE_TYPES`. Currently hardcoded to `STORAGE_TYPES.LOCAL` in `src/redux/expensesManager/actionCreators.js` — backend integration is disabled. See the TODO comments throughout the codebase for the GitHub issues tracking reinstatement of remote storage and authentication.

**Data flow:**
1. Components dispatch action creators from `src/redux/expensesManager/actionCreators.js`
2. Action creators call `storage.*` methods (LocalStorage uses `window.localStorage`) and `dataParser` (CSV↔JSON conversion)
3. Results are dispatched as Redux actions and handled by the reducer

**Entry data model:** Each entry has `amount`, `description`, `type` (`"income"` or `"expense"`), `date` (Unix timestamp ms), and `categories_path` (comma-delimited string like `,eating out,`). The `categories_path` format is significant — bucket matching and category filtering rely on this exact format.

**Entries structure in Redux:** `entries[year][month][incomes|expenses]` — `getGroupedFilledEntriesByDate()` in `src/helpers/entriesHelper/entriesHelper.js` transforms a flat array into this nested tree and fills empty months.

**Buckets:** Spending limit containers keyed by category name. Stored in `localStorage` under key `"buckets"` as a flat object `{ [bucketName]: limitAmount }`. Bucket name ↔ `categories_path` matching uses `bucketName.toLowerCase()` against the second comma-delimited segment of `categories_path`. A bucket mirrors its expense category: renaming the category renames the bucket (limit history kept), and deleting the category deletes the bucket.

**Categories:** User-managed, in two separate lists by type, stored in `localStorage` under `"categoryLists"` as `{ expense: string[], income: string[] }` (display names) and held in Redux as `expensesManager.categoryLists`. Names are unique within a type (case-insensitive, trimmed); the same name may exist once in each type. Every category picker (entry forms, filter sheet, Summary, AddBucket, the sync Modify form) reads these lists (most through `getEntryCategoryOption(type, categoryLists)`; AddBucket through `getUnbudgetedCategories`); nothing reads a hardcoded list any more. Helpers live in `src/helpers/categoryLists/` (types, `categoryPathOf`/`pathMatchesCategory`, `getCategoryNameError`, `sortCategoryNames`). Key rules:
- **Migration:** when `categoryLists` is absent, `buildCategoryListsFromLegacy` builds it once from the seeds (`EXPENSE_CATEGORIES`/`INCOME_CATEGORIES` in `entriesHelper.js`, now used only for this), the legacy `"categories"` key (expense categories without a bucket, read-only now), the bucket names, and any category found in entries' or fixed entries' `categories_path`. Existing data is never rewritten; restoring a backup without lists runs the same migration.
- **Rename / delete** go through `renameCategory` / `deleteCategory` action creators → `storage.applyCategoryChange`, which uses the pure step in `src/helpers/categoryChanges/` to rewrite every matching entry and fixed entry's `categories_path`, the bucket and the lists at once (one `CATEGORY_CHANGED` reducer update). A delete takes a target category per affected entry; a category in use that is the only one of its type cannot be deleted. Renaming or deleting the category the entry list is filtered by updates or clears `entryFilters`.
- **Sync:** each rename/delete is also appended to the `"categoryChanges"` log, which travels inside the backup data (both keys optional, schema version 1; the server never reads them). The sync diff replays missing changes on each side before comparing, and the review wizard shows a remote change as a `category` item: an informational note card (`src/components/SyncReview/CategoryNoteCard`) whose only action is Continue — it can never be rejected or modified (`docs/multi-user-sync/RFC.md` §4.1).
- UI design: `design/features/category-management/`.

**Routes** (all nested under `/`, handled in `src/components/Dashboard/index.js`):
- `/` and `/dashboard` — DashboardContent
- `/add-income`, `/add-expense` — AddEntry
- `/edit-income/:entryId`, `/edit-expense/:entryId` — EditEntry
- `/incomes`, `/expenses` — EntriesSummaryWithFilter
- `/summary` — Summary
- `/savings-trend` — Savings trend (range picker, a Total saved / Change tab pair that opens on Total saved, line chart; reached from the "Trend" link in the dashboard's savings card). A **Savings | Categories** switch at the top moves to the category trends; the picked range is shared across these screens (`TrendRangeProvider` in `src/components/common/SavingsTrend/TrendRangeContext/`)
- `/category-trends` — Category trends: Expenses / Incomes tabs, categories ranked by how much they changed between the range's first month and the end month (opens on the tab in router state `{ type }`)
- `/category-trends/:type/:name` — One category's trend (category picker sheet, Per month / Change tabs, line chart); `:name` is the display name, URL-encoded (`categoryTrendPath` in `src/helpers/categoryTrends/`); an unknown category redirects to the list. Design: `design/features/category-trends/`
- `/data-management` — CSV import/export
- `/categories` — Categories (Expenses / Incomes tabs; add, rename and delete happen in bottom sheets on this screen); navigating here with router state `{ addCategory: "expense" | "income" }` opens the add sheet (AddBucket's "Add a new category" link does this)
- `/buckets` — Buckets list
- `/edit-bucket/:bucketName` — EditBucket
- `/welcome` — the first-run **onboarding wizard** (see below); only a new user is ever sent here, and it takes over the whole screen (no app bar or tab bar)
- `/settings` — Settings (device preferences, all stored only in `localStorage`: the UI language and the display currency, each a row that opens a bottom sheet — see `src/helpers/currency/currency.ts` — and **Privacy mode**, a switch row; reached from the gear chip in the app bar)

**Onboarding wizard (new users only):** `WithOnboarding` (`src/components/Onboarding/WithOnboarding/`, wrapped around `Dashboard` in `src/App.js`) reads `isNewUser()` (`src/onboarding/onboardingStatus.ts`) **once, on its first render** — before `WithBalance`'s effects write the default `categoryLists` — and redirects every route to `/welcome` while the user is new. A new user is one with no `onboarding.completed` flag and no data under `balance`, `buckets`, `fixedEntries` or `categoryLists`; anyone who has used the app, or restored a backup, never sees it. The wizard (`src/components/Onboarding/`: Preferences, Expenses, Incomes, Buckets, Review) keeps its choices in a `WizardDraft` (`src/onboarding/wizardDraft.ts`, pure functions) and writes only on **Start tracking**: `settings.currency` / `settings.privacyMode`, then `categoryLists` and `buckets` through the `applyOnboarding` action creator → `storage.applyOnboarding` (the lists are written even when empty, so the seed lists are not rebuilt for that user). The language applies as soon as it is picked; **Skip setup** keeps only that and leaves the user with **empty** category lists and no buckets (it saves `{ expense: [], income: [] }`, never the seed lists). Both Start tracking and Skip set `onboarding.completed` (a device preference in `localStorage`, never in the entries model, backup or sync). Design: `design/features/new-user-onboarding/`.

**Authentication:** `AuthenticatedApp` is currently commented out in `src/App.js`. The app runs without auth, using `WithBalance` to load entries directly.

**Environment:** Copy `.env.template` to `.env` and set `REACT_APP_API_HOST` (defaults to `http://localhost:9000`) when backend is needed.

**Server (`server/`):** The local multi-user sync backend is written in strict TypeScript, compiled ahead of run rather than via `ts-node` (`server/tsconfig.json` → `server/dist/`, wired through `npm run build:server`/`sync-server`/`test:server`). The compiled output must stay dependency-free — only Node builtins, no npm packages at runtime — since it's what gets deployed. Tests are colocated (`core/crypto.ts` ↔ `core/crypto.test.ts`) and run with the Node built-in test runner, not Jest; CRA's Jest config does not scan `server/`.

## Key patterns

- **Every piece of UI text is translated.** The app ships in English (default), Spanish and French (`src/i18n/`). Whenever you add or change text the user can see or hear — JSX text, `placeholder`, `aria-label`, `title`, `alt`, page titles, button labels, `window.confirm` messages, validation/error messages, chart labels — add a key to `src/i18n/translations/en.ts` **and** its Spanish and French text to `src/i18n/translations/es.ts` and `src/i18n/translations/fr.ts`, then render it with `t("key")` from `useTranslation()` (or `withTranslation(Component)` for class components). Never hardcode an English string in a component. `es.ts` and `fr.ts` are typed against `en.ts`, so `npm run typecheck` fails on a missing key, and `src/i18n/translations/translations.test.ts` fails on a dropped `{{placeholder}}`. See the conventions at the top of `en.ts`: `{{name}}` placeholders, `_one`/`_other` plural pairs via `plural(key, count)`, `<link>…</link>` spans via `<Trans>`, and short `nav.*` labels (the mobile tab bar is narrow). Pure helpers that produce text take an optional `Translator` defaulting to English (`defaultTranslator`), e.g. `getBucketAllowanceValidationError(value, translator)`.
- **Privacy mode hides the dashboard's figures, and only the dashboard's.** The `settings.privacyMode` switch (off by default, `localStorage` only, never in the entries model, backup or sync) makes `/` render `HiddenFigure` placeholders, `HiddenBalanceChart` and a blurred change pill instead of real amounts, with an eye (`PrivacyEye`) to show them for the session. Read it with `usePrivacy()` from `src/privacy/`; never put a real figure in the DOM while `hidden` is true, and do not hide figures on other routes (design in `design/features/privacy-mode/`).
- **User data is never translated.** Category and bucket names, descriptions and amounts are shown exactly as stored; the language preference lives only in `localStorage` (`settings.language`, see `src/i18n/languagePreference.ts`) and never touches the entries model, the backup format or the sync server. Sync-server error text is mapped by error code with `getSyncErrorMessage` (the server's own English wording is kept in English).
- Integration tests run in English by default; to exercise Spanish or French, pick it on `/settings` (see `src/integrationTests/languageSettings.test.tsx`).
- **Every piece of UI follows the design system** (`design/system/README.md`). Read it and `design/system/components.md` before building or changing UI, and reuse the listed components and the mixins in `src/variables.scss` (`card`, `interactive-card`, `buttons`, `icon-chip`, `money-figures`, `focus-ring`) before writing new styles. Colors, radii, shadows and font stacks come only from `src/styles/tokens.json`: in SCSS use the generated variables (`$accent`, `$radius-card`, …, or derive one with `rgba($accent, 0.28)`), and in JS/TSX import `tokens.json`. Never write a literal hex, named, `rgb()` or `hsl()` color, a literal `border-radius` or a font stack anywhere else; `npm run lint:styles` and `npm run lint` fail CI on them. A value that is genuinely new is added to `tokens.json`, followed by `npm run tokens:build`, and the JSON and both generated files are committed together (`src/styles/tokenFormats.test.js` fails when they drift). A new shared component gets a row in `components.md` in the same PR.
- **A feature's UI is designed before it is built, and the approved design is the visual spec.** All design work lives in `design/` (proposals, evaluations and the design system); `docs/` is only for shipped, production-usable parts of the app, so never put a proposal there. The convention is in `design/README.md`; a feature's designs live in `design/features/<feature>/ui/` (`decision.md` with a `status` of `exploring` / `approved` / `implemented`, alternatives under `options/`, final screens under `approved/<screen>.<state>.html`). When you **design**, use the `/ui-explore` skill (2–3 options) and, once the user names one, the `/ui-approve` skill (approved screens, `flow.json`, `fixtures.json`, implementer notes); work only inside `design/` (never edit `src/` to try a design), build mockups from `design/system/tokens.css` and `mockup.css` with no literal colors and no external resources, and run `npm run gallery:build`, committing the regenerated `design/gallery.html` (a unit test fails when it is stale). When you **implement** a feature whose `decision.md` says `approved`, build to `ui/approved/` and `ui/flow.json` exactly; where they are silent or conflict with the app, flag it in the PR instead of improvising, and before opening the PR run the `design-reviewer` agent (or `npm run design:review`) and fix what it reports. Packages with `example: true` are demonstrations, never built. Mockup text never replaces translation: every visible string still needs English, Spanish and French.

- Components connect to Redux via `connect()` (class-style HOC pattern, not hooks)
- Action creators are injected via `mapActionToProps` — components never import storage directly
- Categories are user data in `categoryLists` (see **Categories** above), never hardcoded: read them from the store, change them only through the category action creators, and never show a category name translated
- Mixed JS/TS: existing JS files stay `.js`; new components use `.tsx`. TypeScript errors in JSX are sometimes suppressed with `{/* @ts-expect-error */}` or `{/** @ts-ignore */}`

## Integration test helpers (`src/integrationTests/helpers/`)

- **`renderApp.tsx`** — renders the full app in a `MemoryRouter` with a fresh Redux store; returns `{ user, store, ...RenderResult }`. It marks onboarding as completed so every test starts on an already set-up app; pass `{ newUser: true }` to start as a brand-new user and get the first-run wizard.
- **`seed.ts`** — `seedEntries(entries)` writes entries to `localStorage`; `ts(year, month, day?)` builds a Unix-ms timestamp; month constants `JANUARY`–`DECEMBER` (0-indexed).
- **`navigation.ts`** — `goToPrevMonth(user, expectedTitle)` and `goToNextMonth(user, expectedTitle)`: click the Prev/Next button and wait for the new month heading. Use these instead of inline `findByRole("button", …)` calls so the assertion pattern stays consistent across test files.
- **`categorySelect.ts`** — `selectCategory(user, categoryName)`: opens the searchable category dropdown (`CategorySearchSelect`) and clicks the matching option. Use this instead of inline `click(combobox)` → `click(option)` pairs whenever a test just needs to pick a category. Its internal `findByRole("option", …)` throws when the category is missing, so option presence is still asserted. Tests that exercise the dropdown *mechanics* (type-to-filter, empty state, keyboard nav) should still drive the control directly. On `/expenses`/`/incomes` the category picker lives inside the Filters sheet, so call `openFilterSheet(user)` first.
- **`settings.ts`** — `pickLanguage(user, name, rowName?)` and `pickCurrency(user, name, rowName?)`: on `/settings`, open the Language or Currency sheet from its row and click the option (the sheet closes on pick). `rowName` is the row's label in the language currently shown (defaults to English; pass `/^Idioma/` or `/^Moneda/` once the app is in Spanish). Use these instead of inline radio clicks. `togglePrivacyMode(user, rowName?)` flips the Privacy mode switch there (`rowName` defaults to the English label; pass `/^Modo privacidad/` in Spanish).
- **`trendView.ts`** — `showChange(user, tabName?)` and `showTotalSaved(user, tabName?)`: on `/savings-trend`, click the Change or Total saved tab. The screen opens on Total saved, so tests of the end-month-vs-reference comparison call `showChange` first; the tab stays selected while the month or range changes. Pass the tab's name in the current language (`"Cambio"`, `"Ahorro total"`) once the app is in Spanish.
- **`onboarding.ts`** — for the first-run wizard (`renderApp("/", { newUser: true })`): `tapNext(user, name?)`, `tapBack`, `findStepHeading(name)`, `toggleChip(user, category)`, `addOwnCategory(user, name)`, `setBucketLimit(user, category, limit)` and `walkToReviewEmpty(user)` (steps 1–4 choosing nothing). Pass the Spanish names once the wizard is in Spanish.
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
