---
title: Category management
summary: Add, rename and delete income and expense categories, moving existing entries safely and showing party changes as notes in the sync wizard.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Nothing is chosen yet.

All three options share the owner's rules: a rename warns how many entries it
changes and updates them on save; a delete says it cannot be undone and makes
the user move every affected entry to another existing category of the same
type (one for all, or one per entry); income and expense categories are
separate lists; and a category change from the party is an informational card
in the review wizard with a single "continue" action, no Reject or Modify.

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

## States still to draw at approval

- **Empty:** per type (A, C) or for the whole screen (B); whichever wins, also
  the entry forms when the chosen type has no categories (today they show an
  empty select).
- **Error:** duplicate name within the type (drawn in A); saving fails (inline
  message under the form, as `addCategory.createFailed` does today).
- **Delete with no entries:** a plain confirmation without the reassign step.
- **Only category of its type** with entries: blocked (drawn in B).
- **Spanish and French** copy for every new string (`en.ts`, `es.ts`, `fr.ts`).

## Owner's answers

1. Starter (seed) categories can be renamed and deleted like the user's own.
2. Buckets mirror their category: renamed with it, removed with it, and when
   entries move to another category their spending moves with them into that
   category's bucket.
3. No "Restore starter categories" action (removed from B's empty state); a
   future onboarding flow will handle picking starter categories.
4. The option is not chosen yet.
