---
title: Category management
summary: Add, rename and delete income and expense categories from a tabbed list with bottom sheets, moving existing entries and buckets safely; party changes show as notes in the sync wizard.
status: approved
chosen: d-tabs-and-sheets
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md) (the owner's rules 1–9 and
the remaining assumptions are binding).

## Decision

**d-tabs-and-sheets**, chosen by the owner. It was requested after the first
round as "everything in B, with C's tabs, and editing and deleting in bottom
sheets as in A". `/categories` shows one type at a time under underline
Expenses / Incomes tabs. Tapping a category opens a **category sheet** (usage
figures, rename with an impact note, danger zone). Delete swaps it for a
**delete sheet** that lists every affected entry grouped by month, with
"Set every … to / Apply to all" plus a picker per entry.

Why the others did not win: **A**'s sheets are right but too thin (no usage
figures, a cramped either/or choice instead of "apply to all, then adjust");
**B** needs two new routes and takes the user away from the list; **C**'s
three-step delete is the slowest path for the common case and its per-row
icon buttons make the list busy and easy to mis-tap.

## For the implementer

### Data model and storage (backwards compatibility)

- **New `localStorage` key `categoryLists`**: `{ "expense": string[], "income": string[] }`,
  the user's categories by type, as display names. It is the single source of
  the category lists once it exists.
- **Migration when it is absent** (every existing install): build it once from
  today's sources and store it — expense = `EXPENSE_CATEGORIES` seeds + the
  stored unbudgeted `categories` + bucket names (today's
  `getExpenseCategoryNames`, case-insensitive de-dup); income =
  `INCOME_CATEGORIES`. Also add any category found in existing entries'
  `categories_path` (and fixed entries) that is missing from its type's list,
  using the entry's lower-case segment capitalised as the name, so no entry is
  ever left without a listed category. Existing data is not rewritten.
- `getEntryCategoryOption`, `getCategoryValidationError`, AddBucket's
  category list, the entry forms, the filter sheet and the sync review's
  Modify form all read from `categoryLists` (by type) instead of the
  hardcoded seeds. Income categories become editable; Add income uses them.
- The old `categories` key (unbudgeted list) is no longer written once
  `categoryLists` exists; keep reading it only for the migration.
- Names are unique **within a type**, case-insensitive, trimmed; empty is
  invalid. The same name may exist once in each type.
- Lists are shown sorted alphabetically (`localeCompare` in the UI language).

### Rename (category sheet → Save changes)

- Rewrites `categories_path` of **every entry and fixed entry** of that type
  whose category segment matches (case-insensitive) from `,old,` to `,new,`
  (lower-case, today's format), renames the entry in `categoryLists`, and
  **renames the bucket** key (limit history kept). One Redux update; the list
  and dashboard reflect it at once.
- Saving an unchanged name, or a change of letter case only, is allowed (case
  only renames the label). A name already used by another category of the
  same type shows `validation.categoryExists` under the field (error state);
  the sheet stays open.
- The amber impact note shows only when entries use the category; it names the
  bucket only when one exists (two key variants below).

### Delete (category sheet → Delete category)

- **No entries use it** → the short *unused* sheet: warning + Delete category
  (danger) + Cancel. Deleting removes it from `categoryLists` and removes its
  bucket.
- **Entries use it and it is the only category of its type** → the *blocked*
  sheet; "Add income/expense category" closes it and opens the add sheet for
  that type. Cancel closes it.
- **Otherwise** → the delete sheet. Every affected entry and fixed entry is
  listed, grouped by month (newest month first, newest entry first; fixed
  entries in a last group titled "Recurring"), each with a native `<select>`
  whose accessible name is "Category for {{description}}" and whose options
  are the **other** categories of the same type. "Set every expense to" is a
  `CategorySearchSelect` (combobox) with the same options; "Apply to all"
  (disabled until a category is chosen) sets every row's select. Rows can
  still be changed after. The foot shows "{{count}} expenses still need a
  category." while any row is empty and the Delete button is
  `aria-disabled` until none is; then it reads "Delete and move {{count}}
  expenses". The list scrolls inside the sheet; the foot stays fixed.
- On delete: each entry's `categories_path` becomes its chosen category, the
  category leaves `categoryLists`, and its **bucket is removed**. Moved
  spending counts toward the target's bucket, if it has one (that is just the
  existing bucket maths on the new `categories_path`).
- Income wording swaps "expense(s)" for "income(s)" in every string (separate
  keys below).

### Add (Add expense/income category, and the empty state's CTA)

- Opens the add sheet for the **active tab's type** (title "New expense
  category" / "New income category"), focus in the field. Create validates as
  above, adds to `categoryLists` and closes; the list shows it.
- The `/add-category` route stays only as a redirect to `/categories` with the
  add sheet open (AddBucket's "Add a new category" link uses it), so the old
  AddCategory page is removed.

### Sync review (rename / delete arriving from the party)

- A category rename or deletion made on another device becomes one card in the
  review wizard: the *note* cards in `sync-note.renamed` / `sync-note.deleted`.
  The only action is **Continue**; there is no Reject, Modify, Accept all or
  Reject all for these cards ("Accept all" may skip past them, which counts as
  acknowledging). The card lists the user's own entries that change (first 3,
  "Show {{count}} more" expands), with the target category for deletions.
- How the change is represented on the wire (a category item kind in
  `docs/multi-user-sync/RFC.md`'s item model, applied on upload like any
  accepted item) is for the implementer; flag the contract change in the PR.
  If the sync server cannot carry it yet, ship the local feature and the note
  UI behind the same item kind, and say so in the PR.

### Sheet behaviour

- Reuse `src/components/common/BottomSheet/` (scrim, grabber, heading, close
  chip, Escape, focus to heading, focus back to the row on close). Add a
  **tall** variant (`max-height: 92vh`, scrolling body, fixed foot) to it
  rather than a second sheet component, and update its row in
  `design/system/components.md`.
- Opening Delete replaces the category sheet's content (one sheet open at a
  time); closing the delete sheet returns to the list, not to the category
  sheet.
- Each category row is a `<button>` whose name starts with the category name.
- Tabs: `role="tablist"`/`tab`, the counts in the tab label; the selected tab
  survives closing a sheet. Reuse the underline look of
  `src/components/common/SavingsTrend/ViewTabs/` (extract it if needed).

### Reuse

`MainContentContainer`, `card` / `interactive-card` / `buttons` / `icon-chip` /
`money-figures` / `focus-ring` mixins, `BottomSheet`, `CategorySearchSelect`,
the money-row chip, `formatCurrency` for every amount, the existing
`.validation-message`. The empty-state illustration is an inline SVG painted
with tokens (`--income`/`--expense` soft + accent), as in the mockups.
New shared pieces to list in `components.md`: **Category row**, **Usage
figures** (3-column stat strip), **Callout** (warn / danger / info tinted
note with icon) if extracted, **Bottom sheet (tall)**.

### New i18n keys (EN / ES; write FR in the same tone)

| Key | English | Spanish |
|---|---|---|
| `categories.tabExpenses` | Expenses | Gastos |
| `categories.tabIncomes` | Incomes | Ingresos |
| `categories.lead` | Tap a category to rename it, see where it is used or delete it. | Toca una categoría para renombrarla, ver dónde se usa o eliminarla. |
| `categories.addExpense` | Add expense category | Añadir categoría de gasto |
| `categories.addIncome` | Add income category | Añadir categoría de ingreso |
| `categories.expenseCount_one/_other` | {{count}} expense / {{count}} expenses | {{count}} gasto / {{count}} gastos |
| `categories.incomeCount_one/_other` | {{count}} income / {{count}} incomes | {{count}} ingreso / {{count}} ingresos |
| `categories.bucketPerMonth` | Bucket {{amount}}/mo | Límite {{amount}}/mes |
| `categories.unused` | Not used yet | Sin usar todavía |
| `categories.emptyExpenseTitle` | No expense categories yet | Aún no tienes categorías de gasto |
| `categories.emptyExpenseText` | Every expense needs a category, so you can see where your money goes, like Food or Rent. Create your first one to start recording expenses. | Cada gasto necesita una categoría para que veas adónde va tu dinero, como Comida o Alquiler. Crea la primera para empezar a registrar gastos. |
| `categories.emptyIncomeTitle` | No income categories yet | Aún no tienes categorías de ingreso |
| `categories.emptyIncomeText` | Every income needs a category, so you can see where your money comes from, like Salary or Freelance. Create your first one to start recording incomes. | Cada ingreso necesita una categoría para que veas de dónde viene tu dinero, como Salario o Freelance. Crea la primera para empezar a registrar ingresos. |
| `categorySheet.expenseType` | Expense category | Categoría de gasto |
| `categorySheet.incomeType` | Income category | Categoría de ingreso |
| `categorySheet.statExpenses` / `statIncomes` | expenses / incomes | gastos / ingresos |
| `categorySheet.statTotal` | in total | en total |
| `categorySheet.statBucket` | bucket / mo | límite / mes |
| `categorySheet.noBucket` | no bucket | sin límite |
| `categorySheet.name` | Name | Nombre |
| `categorySheet.renameImpactBucket` | Saving changes <b>{{count}} existing expenses</b> and the {{amount}} bucket from “{{name}}” to the new name. Synced devices get the change too. | Al guardar, <b>{{count}} gastos existentes</b> y el límite de {{amount}} pasan de «{{name}}» al nuevo nombre. Los dispositivos sincronizados también reciben el cambio. |
| `categorySheet.renameImpact` (+ income variants, plural `_one`) | Saving changes <b>{{count}} existing expenses</b> from “{{name}}” to the new name. Synced devices get the change too. | Al guardar, <b>{{count}} gastos existentes</b> pasan de «{{name}}» al nuevo nombre. Los dispositivos sincronizados también reciben el cambio. |
| `categorySheet.save` | Save changes | Guardar cambios |
| `categorySheet.dangerZone` | Danger zone | Zona de peligro |
| `categorySheet.deleteHint` | Deleting asks you where its {{count}} expenses should go. | Al eliminarla te preguntaremos adónde mover sus {{count}} gastos. |
| `categorySheet.unusedHint` | No entries use this category. | Ninguna entrada usa esta categoría. |
| `categorySheet.delete` | Delete category | Eliminar categoría |
| `categorySheet.duplicateExpense` / `duplicateIncome` | An expense category called “{{name}}” already exists. | Ya existe una categoría de gasto llamada «{{name}}». |
| `deleteSheet.title` | Delete “{{name}}”? | ¿Eliminar «{{name}}»? |
| `deleteSheet.warningBucket` | <b>This can’t be undone.</b> It changes your existing data: {{count}} expenses move to the categories you pick below, and the {{amount}} bucket is removed. | <b>No se puede deshacer.</b> Cambia tus datos existentes: {{count}} gastos pasan a las categorías que elijas abajo y se elimina el límite de {{amount}}. |
| `deleteSheet.warning` (no bucket; + income) | <b>This can’t be undone.</b> It changes your existing data: {{count}} expenses move to the categories you pick below. | <b>No se puede deshacer.</b> Cambia tus datos existentes: {{count}} gastos pasan a las categorías que elijas abajo. |
| `deleteSheet.setAllExpenses` / `setAllIncomes` | Set every expense to | Asignar todos los gastos a |
| `deleteSheet.chooseCategory` | Choose a category | Elige una categoría |
| `deleteSheet.applyAll` | Apply to all | Aplicar a todos |
| `deleteSheet.choose` | Choose… | Elegir… |
| `deleteSheet.rowLabel` | Category for {{description}} | Categoría para {{description}} |
| `deleteSheet.recurring` | Recurring | Recurrentes |
| `deleteSheet.stillNeed_one/_other` | 1 expense still needs a category. / {{count}} expenses still need a category. | Falta 1 gasto por asignar. / Faltan {{count}} gastos por asignar. |
| `deleteSheet.confirm_one/_other` | Delete and move 1 expense / Delete and move {{count}} expenses | Eliminar y mover 1 gasto / Eliminar y mover {{count}} gastos |
| `deleteSheet.unusedWarning` | <b>This can’t be undone.</b> No entries use this category, so nothing else changes. | <b>No se puede deshacer.</b> Ninguna entrada usa esta categoría, así que nada más cambia. |
| `deleteSheet.blockedTitle` | Can’t delete “{{name}}” yet | Aún no puedes eliminar «{{name}}» |
| `deleteSheet.blockedIncome` (+ expense) | {{count}} incomes use {{name}} and it is your only income category, so there is nowhere to move them. Add another income category first, then delete this one. | {{count}} ingresos usan {{name}} y es tu única categoría de ingreso, así que no hay adónde moverlos. Añade otra categoría de ingreso y luego elimina esta. |
| `addSheet.titleExpense` / `titleIncome` | New expense category / New income category | Nueva categoría de gasto / Nueva categoría de ingreso |
| `addSheet.hintExpense` (+ income) | Names must be unique among your expense categories. | El nombre no puede repetirse entre tus categorías de gasto. |
| `addSheet.create` | Create category | Crear categoría |
| `syncReview.categoryRenamed` | Category renamed · for your information | Categoría renombrada · para tu información |
| `syncReview.categoryDeleted` | Category deleted · for your information | Categoría eliminada · para tu información |
| `syncReview.renamedBy` | {{type}} · renamed by {{name}} on {{date}} | {{type}} · renombrada por {{name}} el {{date}} |
| `syncReview.deletedBy` | {{type}} · deleted by {{name}} on {{date}} | {{type}} · eliminada por {{name}} el {{date}} |
| `syncReview.yourEntriesChange` | Your expenses that change | Tus gastos que cambian |
| `syncReview.yourEntriesMove` | Your expenses that move | Tus gastos que se mueven |
| `syncReview.showMore` | Show {{count}} more | Mostrar {{count}} más |
| `syncReview.continue` | Continue | Continuar |
| `syncReview.cantReject` | Category changes can’t be rejected. | Los cambios de categoría no se pueden rechazar. |

Existing keys `categories.pageTitle`, `common.goBack`, `common.cancel` and
`addCategory.namePlaceholder` are reused. `categories.subtitle`,
`categories.noBucket`, `categories.addNew` and `addCategory.hint` go away with
the old screens. The `<b>` spans render with `<Trans>`. Category names, entry
descriptions and amounts are user data and are never translated.

### Edge cases

- Long names wrap (`overflow-wrap: anywhere`); a long description in the
  delete list wraps beside its select; Spanish strings may wrap the
  "Set every…" select to two lines (drawn).
- A category used by hundreds of entries: the delete list renders them all
  (grouped); no pagination in this iteration.
- Deleting or renaming the category the entry list is currently filtered by
  updates (rename) or clears (delete) the stored `entryFilters`.
- Privacy mode does not apply here (it hides dashboard figures only).
- **Design reviewer:** `sync-note.*` cannot be seeded from `localStorage`
  (the wizard needs a pending sync review). Expect the reviewer to report them
  unreachable; cover them in integration tests and mention it in the PR.

## Approved screens

| Screen | State | File |
|---|---|---|
| Categories | default (Expenses tab) | `approved/categories.default.html` |
| Categories | Spanish | `approved/categories.es.html` |
| Categories | empty (Incomes tab, none) | `approved/categories.empty.html` |
| Add sheet | default | `approved/add-sheet.default.html` |
| Category sheet | default | `approved/category-sheet.default.html` |
| Category sheet | new name typed | `approved/category-sheet.filled.html` |
| Category sheet | duplicate name | `approved/category-sheet.error.html` |
| Category sheet | unused category | `approved/category-sheet.unused.html` |
| Category sheet | Spanish | `approved/category-sheet.es.html` |
| Delete sheet | nothing assigned yet | `approved/delete-sheet.default.html` |
| Delete sheet | all assigned | `approved/delete-sheet.filled.html` |
| Delete sheet | Spanish | `approved/delete-sheet.es.html` |
| Delete sheet | unused category | `approved/delete-sheet.unused.html` |
| Delete sheet | only category of its type | `approved/delete-sheet.blocked.html` |
| Sync note | category renamed | `approved/sync-note.renamed.html` |
| Sync note | category deleted | `approved/sync-note.deleted.html` |

## Options considered

### a-sheets-in-place

`/categories` gets an **Expenses | Incomes** switch, and each row shows how
many entries use it and its bucket. A "⋯" on a row opens a **bottom sheet**:
**Edit** (name field, an amber note about the 12 expenses and bucket it
changes, "Save and update 12 expenses", and "Delete category" under it).
Delete swaps the sheet for a red "can't be undone" sheet with two radios:
*Move all to one category* (a select, the default) or *Choose for each
expense* (the affected list with a small select per row; Delete stays disabled
until every row has one). The sync card shows "Eating out → Restaurants" and a
"Got it, next change" button.

- **Good at:** no new routes; it reuses the Bottom sheet that Settings
  already has; the fastest path for the common cases (a rename, or a delete
  that moves everything to one category).
- **Costs:** the per-expense list is cramped inside a sheet when many entries
  are affected (it must scroll inside the sheet); the delete warning and the
  choice share one small surface.
- Also drawn: the duplicate-name error in the edit sheet. Not drawn: the
  "only category of its type" case (same as B's blocked screen, in the sheet).

### b-category-page

`/categories` lists **both types on one page** in two sections, each row with
an income/expense chip and a chevron. A row opens a **category page**
(`/categories/expense/eating-out`) with usage figures (entries, total, bucket),
the editable name with the impact note, and a **Danger zone** card. Delete goes
to a full **reassign page**: the warning, a "Set every expense to … / Apply to
all" control, then **every affected expense grouped by month**, each with its
own select, and a count of how many still need one. When the category is the
only one of its type, the reassign page becomes a **blocked** screen asking
the user to add another category first. The empty state covers "no categories
at all" with a single Create action. The sync
card lists the user's expenses that change.

- **Good at:** the most room and context: the user sees exactly what a
  category holds before changing it, and the full-page list handles 50
  affected entries as well as 2. "Apply to all" then adjusting a few rows
  combines both owner modes in one screen.
- **Costs:** two new routes and the most code and copy; one more tap to reach
  rename; the usage figures need new selectors.

### c-guided-steps

`/categories` gets underline **Expenses / Incomes** tabs and **pencil and
trash buttons on every row**. Rename happens **in the row** (it turns into a
field with the impact note and a gold Rename button). Delete is a **three-step
guided flow**: 1) *Before you delete*, what happens, with a preview of the
affected expenses; 2) *Where should they go?*, *All to one category* or *One
by one*, which walks through the expenses **one card at a time** with category
pills, like the sync wizard; 3) *Check and delete*, a summary ("Food ← 9
expenses…") and the red Delete. The empty state has the **create field
inline**, so the first category is one step. The sync card shows a deletion
and where the user's entries went, with "Acknowledge and continue".

- **Good at:** the most guidance and the least risk of a surprise; the
  one-by-one walk is easy on a phone; the review step makes the irreversible
  action deliberate.
- **Costs:** the most taps for a simple delete (three steps even when moving
  everything to one place); two icon buttons per row make the list busy and
  are easy to mis-tap; an inline editor in a list is harder to build
  accessibly.

### d-tabs-and-sheets

Requested by the owner: **everything in B**, with **C's underline
Expenses / Incomes tabs** and the category page and the delete flow as
**bottom sheets, as in A**. `/categories` shows one type at a time under the
tabs (with counts), each row with its income/expense chip, usage and a
chevron. Tapping a row opens a **category sheet**: type and name, the usage
figures (entries, total, bucket), the name field with the impact note, Save
changes, and a Danger zone with Delete. Delete swaps it for a **tall delete
sheet**: the "can't be undone" warning, "Set every expense to … / Apply to
all", then every affected expense grouped by month with its own select; the
list scrolls inside the sheet while the "1 expense still needs a category"
count and the red Delete button stay fixed at its foot. When the category is
the only one of its type, the sheet becomes a **blocked** sheet ("Add income
category"). The empty state is per tab. The sync card is B's (rename with the
user's affected expenses, Continue, "can't be rejected").

- **Good at:** B's context and its combined "apply to all, then adjust"
  reassignment, without new routes; the user never leaves the list, and the
  tabs keep each list short.
- **Costs:** a long reassignment list scrolls inside a sheet (a fixed footer
  keeps the action reachable, but there is less room than B's full page); the
  sheet holds more than the Settings sheets do, so its scroll and focus
  handling need care.

