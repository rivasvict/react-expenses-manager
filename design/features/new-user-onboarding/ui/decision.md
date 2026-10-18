---
title: New-user onboarding wizard
summary: A skippable first-run wizard for brand-new users to set Privacy mode, language, currency, categories (from the seed list or their own, or none) and optional buckets.
status: exploring
---

# Decision

Brief: [`../feature-brief.md`](../feature-brief.md). Nothing is chosen yet.

All options write only what the app already stores (`settings.language`,
`settings.currency`, `settings.privacyMode`, `categoryLists`, `buckets`), run
for new users only, are skippable at any point, and treat zero categories and
zero buckets as a valid result.

## Options considered

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

## Recommendation
**d-pinned-footer**: it keeps A's one-decision-at-a-time flow and fixes the
main weakness of A on long screens, where the Next button sits at the end of the
list and is easy to miss. A pinned primary action is the standard pattern for
long steps in a wizard. If it still feels long, **c** is the best shortcut. The
review step could be dropped without changing the rest.

## Open questions for the owner
- Should Privacy mode be in the wizard or only offered as a link afterwards?
  All options include it, as requested.
- Seed list: 29 expense categories include placeholders such as "Person 1
  bucket" and "Person 2 bucket". Keep, or trim the seed shown to new users?
- Existing users: the proposed detection rule is in the brief; confirm that
  "no entries, no lists, no flag" is the right test, including a restored backup.

## Not yet specified (for /ui-approve)
Spanish and French variants, the duplicate-name error state, the sheet focus
behaviour, `flow.json` and `fixtures.json`.
