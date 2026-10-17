# New-user onboarding wizard

## Problem
A first-time user lands on an empty dashboard. The things that make the app
useful (a language and currency that fit them, the categories they spend and
earn under, optional buckets) are spread across `/settings`, `/categories` and
`/buckets`, and nothing tells a newcomer to visit them.

## Goal
A short, skippable first-run wizard that lets a **new user only** set:

1. **Preferences**: language, display currency, Privacy mode.
2. **Categories**: pick from the seed lists (28 expense, 3 income), any subset,
   one, all, none, and add their own. Expense and income are separate lists.
3. **Buckets**: optionally give a monthly limit to chosen expense categories.

Nothing is forced: zero categories and zero buckets are valid outcomes.

## Who sees it
New users only. Proposed rule for the implementer: show it when the device has
no entries, no `categoryLists` and no stored onboarding flag. Existing users
(any entries, lists or buckets present) never see it, and finishing or skipping
sets the flag so it never returns. The wizard is not reachable from Settings.

## Constraints
- Writes only what the app already stores: `settings.language`,
  `settings.currency`, `settings.privacyMode`, `categoryLists`, `buckets`. No
  new data model, no backup or sync change.
- Category names from the seed are user data once chosen: shown as stored, not
  translated. Wizard copy is translated (EN / ES / FR).
- Design-system components and tokens only; 375px first.

## Out of scope
Importing a CSV, sync setup, first entry, a product tour of existing screens.
