# Category management

## Problem
Users can only **add** expense categories (`/categories`, `/add-category`).
They cannot rename a category, remove one they no longer use, or manage
income categories at all (`Salary`, `Deposit`, `Saving` are hardcoded in
`entriesHelper.js`). A typo or an outgrown category stays forever, and the
seed list of ~30 expense categories cannot be trimmed.

## Goal
Let the user **add, rename and delete** both expense and income categories,
without breaking the entries, buckets and synced data that already use them.

## Rules (from the owner)
1. **Rename** a category that entries use: say so before saving ("this changes
   N existing entries"); on save, every entry with that category moves to the
   new name.
2. **Delete** a category that entries use: say it cannot be undone and that it
   changes existing data; the user must pick another **existing** category for
   those entries, either one for all of them or one per entry, from a list of
   the affected entries.
3. **Sync:** a category rename or deletion that arrives from the party shows in
   the review wizard as an **informational note**. The user acknowledges it to
   go to the next change; it cannot be rejected or modified.
4. Income and expense categories are **separate lists**; a category belongs to
   exactly one type.
5. Names are **unique within a type** (case-insensitive, as today); the same
   name may exist once in incomes and once in expenses.
6. **Empty state:** when a type has no categories, show an illustration, a
   short explanation and a CTA to create one.

7. **Seed categories** are ordinary categories: the user can rename or
   delete them too.
8. **Buckets mirror their category.** Renaming a category renames its bucket
   (limit and history kept); deleting a category deletes its bucket; when
   entries move to another category, their spending moves with them and
   counts toward that category's bucket, if it has one.
9. **No "restore starter categories"** action. A future onboarding flow will
   let a new user pick starter categories or create their own; this feature
   does not need to anticipate it beyond keeping the empty state simple.

## Assumptions made for the prototype (to confirm)
- A **replacement must be of the same type** and already exist. If the
  category is the only one of its type and entries use it, deletion is blocked
  until the user adds another one.
- A category **no entry uses** is deleted after a plain confirmation (no
  reassignment step).
- **Fixed entries** (recurring templates) that use the category are changed
  the same way as entries and are counted in the affected list.
- Renaming to a name that already exists in the same type is a validation
  error (no merge in this iteration).

## Constraints
- Design-system components and tokens only; 375px first; Spanish/French copy
  ~30% longer; user-entered names can be long.
- Category and bucket names are user data and never translated.
- Touches `categories_path` (`,eating out,`) on every affected entry; bucket
  matching depends on that format.

## Out of scope
Merging two categories as a named action, sub-categories, icons/colours per
category, letting the sync reviewer reject or edit a category change, undo.
