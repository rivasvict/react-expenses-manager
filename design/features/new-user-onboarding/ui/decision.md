---
title: New-user onboarding wizard
summary: A skippable five-step first-run wizard for brand-new users (preferences, expense categories, income categories, buckets, review) with a pinned Back/Next footer; zero categories and zero buckets are valid.
status: approved
chosen: e-split-categories
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md).

## Decision

**e-split-categories**, chosen by the owner. A five-step wizard shown only to
new users: **1 Preferences** (language, display currency, Privacy mode),
**2 Expenses**, **3 Incomes**, **4 Buckets**, **5 Review**. Back and Next sit in
a footer pinned to the bottom of the screen with a live selection count above
them; the step bar is pinned at the top; "Skip setup" is on every step. Every
choice is optional: no categories and no buckets is a valid result.

Why the others did not win:
- **a-step-by-step**: its Next button sat at the end of the long category list,
  where users can miss that there is more below; D and E fix that.
- **b-one-page**: least guidance; two sheets on one page, and it reads as a
  form.
- **c-starting-point**: a good shortcut, but it hides the picker behind a
  choice and offers no pinned actions.
- **d-pinned-footer**: right pinned footer, but Expenses and Incomes shared a
  tabbed screen, so the count on the unseen tab was easy to overlook. The owner
  asked for one type per step.

## For the implementer

### Who sees the wizard, and when it ends
- Shown **only to a new user**: the device has no entries, no `categoryLists`,
  no `buckets`, no fixed entries and no `onboarding.completed` flag in
  `localStorage`. An existing user, or anyone who restored a backup, never sees
  it (the check runs before the dashboard renders).
- It is full-screen on its own route, `/welcome`, with the app's bottom tab bar
  and app-bar chips hidden (the pinned footer sits where the tab bar would be).
  Any route redirects to `/welcome` while the user is new and unfinished.
- **Start tracking** and **Skip setup** both set `onboarding.completed` so the
  wizard never returns, then go to `/`. It is not reachable from Settings.
- **Skip setup** asks nothing and applies **nothing**: nothing is written until
  Start tracking (the Review step says so), except that the language, which
  applies at once so the wizard itself switches, is stored as soon as it is
  picked, like on `/settings`. Skip keeps that language and discards the rest.
- Closing the tab mid-wizard keeps the wizard's draft only in memory: the user
  starts again at step 1 (language and currency, which were already stored,
  come back preselected).

### What Start tracking writes (existing storage only)
- `settings.language`, `settings.currency`, `settings.privacyMode`: the same
  keys and helpers `/settings` uses. The wizard preselects the stored values.
- `categoryLists`: `{ expense: string[], income: string[] }` from the chips the
  user kept plus their own names. Because the list is written even when empty
  (`{ expense: [], income: [] }`), `buildCategoryListsFromLegacy` never runs for
  them and the 29 seed expense categories are **not** silently re-added.
- `buckets`: `{ [categoryName]: limitHistory }` in the app's current bucket
  format, only for ticked rows with a limit above zero. Nothing is written for
  a bucket the user did not create.
- No new data model, no backup or sync change, no category-changes log entry
  (these are initial lists, not renames or deletes).

### Behaviour the screens do not show
- **Step 1.** Language is a three-way segmented control (English, Español,
  Français) that applies at once; currency is the 12-tile grid from
  `src/helpers/currency/currency.ts` (symbol over code, names as accessible
  names); Privacy mode is a switch row (default off). All three are
  preselected from storage.
- **Steps 2 and 3.** Chips are toggle buttons (`aria-pressed`); a selected chip
  shows a check. The list is the seed (`EXPENSE_CATEGORIES`, 29; `INCOME_CATEGORIES`,
  3) **in seed order**, followed by the user's own names in the order they were
  added. A list starts with **nothing** selected the first time a step opens
  (the mockups show a user partway through). **Select all** selects every chip,
  including the user's own; **Clear** deselects all of them (and removes the
  user's own chips). Own names are trimmed, unique within the type
  case-insensitively (a seed name counts) and non-empty, validated with
  `getCategoryNameError`; the field is `input[name="customCategory"]` and a
  valid name is added as a selected chip, the field is cleared and keeps focus.
  A duplicate shows the existing message (`categorySheet.duplicateExpense` /
  `Income`) under the field and a red border; it clears when the text changes.
  The same name may exist once in each type.
- **Footer.** The summary line shows the count of selected categories
  ("8 selected"); with none it reads "0 selected · none is fine". On Buckets it
  shows "N buckets · {amount} a month" (sum of the limits, formatted in the
  chosen currency) and nothing when there are none. Back is absent on step 1.
  The footer sits above the on-screen keyboard (or hides while the Add field is
  focused), never behind it.
- **Scroll cue.** The fade above the footer is drawn only while content remains
  below; at the end of the list it disappears. The step bar stays pinned at the
  top. Nothing important is placed within 7rem of the bottom: the screens end
  with a spacer so the last item can scroll clear of the footer.
- **Step 4 Buckets.** One row per **selected expense category** (including the
  user's own), in step 2's order. A row has a checkbox and a limit field
  (`input[name="limit-<Category>"]`); entering a value ticks the row, and
  clearing it unticks it. Ticking a row with an empty or non-positive limit and
  tapping Next shows `validation.allowanceInvalid` /
  `validation.allowancePositive` under that row and keeps the user on the step.
  An unticked row creates nothing. With no expense category chosen the step
  shows the empty state (illustration, "No expense categories to budget") and
  Next is enabled; going back and adding a category repopulates the list.
  Changing the chosen categories on a previous step drops the limits of
  categories no longer chosen.
- **Step 5 Review.** One row per section with an **Edit** link that returns to
  that step with its draft intact (and then Next returns to Review, not
  through the intervening steps again). With nothing chosen the rows read "No
  categories" and "No buckets", with a hint where to add them later.
  **Start tracking** is the only primary action and is always enabled.
- **Skip setup** on any step leaves the wizard immediately (see above).
- **Long text.** Spanish and French run about 30% longer: titles wrap, the
  count row uses short link labels ("Todas / Ninguna", "Tout / Aucune"),
  category names wrap inside rows and chips are allowed to be as wide as the
  line. User-entered names are never translated or truncated.
- **Desktop.** Same single column, capped at 40rem and centred; the footer is
  capped to the same column.

### Reuse and new components
- Reuse: **Card**, **Buttons** (one gold primary per screen), **Form controls**
  (text input, validation message), **Switch row**, **Currency tile grid** (the
  tile, not the sheet), **Callout** for the muted note (Underline tabs are no
  longer needed), **Category illustration** for the empty Buckets state,
  `.validation-message`, `$transition-slide`. Language and currency helpers
  from `src/helpers/currency/` and `src/i18n/languagePreference.ts`.
- **New shared components** (each gets a row in `design/system/components.md`
  in the implementing PR; new styles use the existing tokens, no new tokens):
  - **Wizard shell**: full-screen column with the pinned step bar and the pinned
    footer (summary line, secondary Back, primary action), spacer and fade.
  - **Step bar**: eyebrow "Step N of 5", "Skip setup" link and five gold/track
    segments (`role="progressbar"`).
  - **Selectable chip**: toggle pill (`--radius-pill`), gold-soft wash with a
    check when selected, 2.5rem tall.
  - **Segmented control**: the three-option language switch.
  - **Bucket row**: checkbox, name and limit field, with an inline validation
    message.
  - **Summary row**: a label, a small hint and an Edit link (Review).
- Per the repo guidelines each component lives in its own module under
  `src/components/` with a colocated `styles.scss` and test, and the wizard
  steps are separate modules (none defined inside another component's file).

### New text (add to `en.ts`, `es.ts` and `fr.ts`; keys prefixed `onboarding.`)
Spanish matches the mockups; French follows the app's tone. Reused keys are
listed last.

| Key | English | Spanish | French |
|---|---|---|---|
| `step` | Step {{n}} of 5 | Paso {{n}} de 5 | Étape {{n}} sur 5 |
| `skip` | Skip setup | Omitir configuración | Passer la configuration |
| `next` | Next | Siguiente | Suivant |
| `back` | Back | Atrás | Retour |
| `start` | Start tracking | Empezar a registrar | Commencer le suivi |
| `welcome` | Welcome! Let’s set things up | ¡Te damos la bienvenida! Vamos a configurarlo | Bienvenue ! Configurons votre espace |
| `prefsLead` | Three quick choices. You can change all of them later in Settings. | Tres elecciones rápidas. Puedes cambiarlas después en Ajustes. | Trois choix rapides. Vous pourrez tous les modifier plus tard dans les Réglages. |
| `currencyHint` | symbol only, nothing is converted | solo símbolo, no se convierte nada | symbole uniquement, rien n’est converti |
| `privacy` | Privacy | Privacidad | Confidentialité |
| `privHint` | Hide the dashboard's amounts until you tap the eye | Oculta las cifras del panel hasta que toques el ojo | Masque les montants du tableau de bord jusqu’à ce que vous touchiez l’œil |
| `expTitle` | What do you spend on? | ¿En qué gastas? | Vos dépenses, c’est quoi ? |
| `expLead` | Pick expense categories from our list or add your own. | Elige categorías de gasto de nuestra lista o añade las tuyas. | Choisissez des catégories de dépense dans notre liste ou ajoutez les vôtres. |
| `incTitle` | Where does money come in? | ¿De dónde entra el dinero? | D’où vient l’argent ? |
| `incLead` | Pick income categories from our list or add your own. | Elige categorías de ingreso de nuestra lista o añade las tuyas. | Choisissez des catégories de revenu dans notre liste ou ajoutez les vôtres. |
| `own` | Add your own | Añade la tuya | Ajoutez la vôtre |
| `add` | Add | Añadir | Ajouter |
| `selectAll` | Select all | Todas | Tout |
| `clear` | Clear | Ninguna | Aucune |
| `selectedOf` | {{a}} of {{b}} selected | {{a}} de {{b}} elegidas | {{a}} sur {{b}} choisies |
| `selected` | {{count}} selected | {{count}} seleccionadas | {{count}} choisies |
| `selectedNone` | 0 selected · none is fine | 0 seleccionadas · ninguna también vale | 0 choisie · aucune, c’est bien aussi |
| `expNone` | Starting with none is fine. Add them later from Categories, or while adding an expense. | Empezar sin ninguna está bien. Añádelas después en Categorías o al registrar un gasto. | Commencer sans catégorie, c’est très bien. Ajoutez-en plus tard depuis Catégories ou en saisissant une dépense. |
| `incNone` | Starting with none is fine. Add them later from Categories, or while adding an income. | Empezar sin ninguna está bien. Añádelas después en Categorías o al registrar un ingreso. | Commencer sans catégorie, c’est très bien. Ajoutez-en plus tard depuis Catégories ou en saisissant un revenu. |
| `bucketsTitle` | Set monthly limits | Define límites mensuales | Définissez des plafonds mensuels |
| `optional` | (optional) | (opcional) | (facultatif) |
| `bucketsLead` | A bucket caps how much you plan to spend in an expense category each month. | Un límite fija cuánto planeas gastar en una categoría de gasto cada mes. | Un plafond fixe ce que vous prévoyez de dépenser dans une catégorie de dépense chaque mois. |
| `limit` | Limit | Límite | Plafond |
| `bucketsSummary` | {{count}} buckets · {{amount}} a month | {{count}} límites · {{amount}} al mes | {{count}} plafonds · {{amount}} par mois |
| `bucketsEmptyTitle` | No expense categories to budget | No hay categorías de gasto que presupuestar | Aucune catégorie de dépense à budgéter |
| `bucketsEmptyText` | Buckets are limits on expense categories, so there is nothing to set yet. You can add buckets any time from Buckets. | Los límites se fijan sobre categorías de gasto, así que aún no hay nada que definir. Puedes añadirlos cuando quieras desde Límites. | Les plafonds portent sur des catégories de dépense : il n’y a donc encore rien à définir. Vous pouvez en ajouter à tout moment depuis Plafonds. |
| `doneTitle` | All set | Todo listo | Tout est prêt |
| `doneLead` | Here is what we will create. Nothing is saved until you finish. | Esto es lo que vamos a crear. No se guarda nada hasta que termines. | Voici ce que nous allons créer. Rien n’est enregistré avant la fin. |
| `edit` | Edit | Editar | Modifier |
| `reviewExpenses` (plural pair) | {{count}} expense categories | {{count}} categorías de gasto | {{count}} catégories de dépense |
| `reviewIncomes` (plural pair) | {{count}} income categories | {{count}} categorías de ingreso | {{count}} catégories de revenu |
| `reviewOwn` | Your own: {{names}} | Las tuyas: {{names}} | Les vôtres : {{names}} |
| `reviewBuckets` (plural pair) | {{count}} buckets | {{count}} límites | {{count}} plafonds |
| `reviewBucketsTotal` | {{amount}} a month in total | {{amount}} al mes en total | {{amount}} par mois au total |
| `reviewNoCategories` / `…Hint` | No categories / Add them any time from Categories | Sin categorías / Añádelas cuando quieras desde Categorías | Aucune catégorie / Ajoutez-en à tout moment depuis Catégories |
| `reviewNoBuckets` / `…Hint` | No buckets / Add them any time from Buckets | Sin límites / Añádelos cuando quieras desde Límites | Aucun plafond / Ajoutez-en à tout moment depuis Plafonds |
| `privacyOn` / `privacyOff` | Privacy mode on / off | Modo privacidad activado / desactivado | Mode confidentialité activé / désactivé |

Reused keys: `settings.language.title`, `settings.currency.title`,
`settings.privacy.title`, `categorySheet.duplicateExpense`,
`categorySheet.duplicateIncome`, `validation.categoryNameEmpty`,
`validation.allowanceInvalid`, `validation.allowancePositive`. Plural pairs use
`_one` / `_other` through `plural(key, count)`.

### Tests to add with the build
Integration tests (English by default, one Spanish run through `/settings`'
language helpers): a new user lands on `/welcome`; an existing user (seeded
entries, or seeded `categoryLists`) goes straight to the dashboard; finishing
with nothing chosen leaves the Categories and Buckets screens empty and the
dashboard usable; picking one seed category and one own category and a bucket
shows them on `/categories` and `/buckets`; Skip keeps the chosen language and
creates nothing; a duplicate own name shows the error; a zero limit blocks
Next; Back and the Review Edit links keep the draft. Unit tests for the
new-user detection helper and for the wizard's draft-to-storage mapping.

### Assumptions to flag in the PR that builds this
- The route name `/welcome` and the `onboarding.completed` key are proposals.
- The design shows 8 selected expense chips as a user partway through, not a
  default; a new user starts with none selected.
- The "Person 1 bucket" and "Person 2 bucket" placeholders are still in the
  seed list (the owner has not asked to trim it); they are shown as stored.
- Moving Buckets directly after Expenses is possible without redesign.

## Approved screens

| Screen | State | File |
|---|---|---|
| Preferences | default | `approved/preferences.default.html` |
| Preferences | Spanish (Español, € EUR, Privacy on) | `approved/preferences.es.html` |
| Expenses | default (8 chosen) | `approved/expenses.default.html` |
| Expenses | Spanish | `approved/expenses.es.html` |
| Expenses | empty (none chosen) | `approved/expenses.empty.html` |
| Expenses | error (duplicate name typed) | `approved/expenses.error.html` |
| Incomes | default (3 chosen) | `approved/incomes.default.html` |
| Incomes | Spanish | `approved/incomes.es.html` |
| Incomes | empty (none chosen) | `approved/incomes.empty.html` |
| Buckets | default (3 limits) | `approved/buckets.default.html` |
| Buckets | Spanish | `approved/buckets.es.html` |
| Buckets | empty (no expense categories) | `approved/buckets.empty.html` |
| Buckets | error (limit of zero) | `approved/buckets.error.html` |
| Review | default | `approved/review.default.html` |
| Review | Spanish | `approved/review.es.html` |
| Review | empty (nothing chosen) | `approved/review.empty.html` |

French uses the same layout as Spanish; its text is in the table above.

## Options considered (exploration record)
### a-step-by-step: a four-step wizard
Step 1 Preferences, step 2 Categories (Expenses / Incomes tabs, tap-to-toggle
chips from the seed list, Select all / Clear, add your own), step 3 Buckets
(tick a picked expense category and enter a limit), step 4 Review, then "Start
tracking". A progress bar, Back, and "Skip setup" on every step.
- **Good at:** one decision at a time, a small screen never feels crowded, the
  review step makes the result explicit.
- **Costs:** the most screens and copy (4 steps x 3 languages) and a step state
  machine. The longest path for someone who wants to do nothing.
- **Empty states drawn:** no categories chosen, and the Buckets step with no
  expense categories (explains why and moves on). Error: a duplicate or blank
  custom name uses the existing category-name validation inline.

### b-one-page: a setup checklist
One screen with Preferences rows inline and two summary rows, Categories and
Buckets, each opening a bottom sheet (the same picker and limits list as in A).
"Start tracking" is always available.
- **Good at:** fastest for people who only want to change one thing; reuses the
  Settings rows and the Bottom sheet component; fewest screens.
- **Costs:** it looks like a form, so less guidance and a higher chance people
  skip the categories; sheets stacked on a page are harder to make accessible
  than separate steps; Buckets stays disabled until categories exist.
- **Empty state drawn:** no categories (Buckets row explains it needs an expense
  category first).

### c-starting-point: three steps with a clear first choice
Preferences, then "How do you want to start?" with three radio cards: **Use the
starter list**, **Let me choose** (opens the picker) and **Start empty**; then
optional Buckets. Choosing Start empty finishes straight away.
- **Good at:** the quickest honest path for the two common cases (take
  everything, or take nothing), and the empty choice is a first-class option
  rather than an unticked list.
- **Costs:** the picker is reached through a choice, one more tap for people who
  want a subset; the fixed starter list is shown as a whole before it is edited.
- **Empty state drawn:** Start empty selected.

### d-pinned-footer: option A with the actions pinned
Same four steps as A, changed for long screens (the category list is 29 chips
and grows with the user's own). The step bar stays pinned at the top; **Back /
Next (or Start tracking) are pinned in a footer** that never scrolls away, with
a live summary above them ("10 selected · 9 expenses, 1 income"). The chips fade
out above the footer, so a half-cut row signals there is more below. "Add your
own category" moves above the list so it never hides at the bottom.
- **Good at:** answers "can I continue / is there more below?" on any screen
  height; the primary action is always one tap away; the count confirms what
  was chosen across both tabs.
- **Costs:** the footer takes about 7rem of a short phone's height; a fixed
  footer needs care with the on-screen keyboard (the footer must sit above it
  or hide while the Add field is focused); the wizard is full-screen, so the
  bottom tab bar is hidden during it (it would stack under the footer).
- **Empty states drawn:** none chosen (summary reads "none is fine") and
  Buckets with no expense categories.
- Behaviour for the implementer: the fade shows only while content is below;
  the footer summary is shown on the Categories and Buckets steps only.

### e-split-categories: option D with expenses and incomes as separate steps
D's pinned footer, but five steps: Preferences, **Expenses**, **Incomes**,
Buckets, Review. The Expenses / Incomes tabs are gone; each type gets its own
screen with a plain-language heading ("What do you spend on?", "Where does money
come in?"), its own Select all / Clear, add-your-own field and count. The Incomes
step is short (3 seed chips), so it never needs to scroll.
- **Good at:** one question per screen, nothing hidden behind a tab (a count on
  an unseen tab was the weakest cue in A and D), and the two lists stay
  independent, matching how the app stores them.
- **Costs:** one more step (five instead of four), so a longer path for someone
  who wants neither list; an almost empty Incomes screen under a pinned footer.
- **Empty states drawn:** Expenses none, Incomes none, and Buckets with no
  expense categories.
- Buckets stays after Expenses and Incomes. With no expense category chosen it
  still appears, showing the empty state (one tap to continue), so the step
  count is always 5.
