---
title: Example — Add a bucket
summary: A worked multi-screen example. It compares a single form with a two-step flow for adding a bucket, and approves the single form with its filled, error and Spanish states and the flow around them.
status: approved
chosen: a-single-form
example: true
---

# Decision

**This is an example, not a feature to build.** The "Add bucket" screen already
exists in the app, so the approved screens document it as built. That is on
purpose: it lets `npm run design:review -- --feature example-add-bucket-flow`
check the mockups against the real screens and shows the whole workflow end to
end (design/README.md). Agents must not implement it.

## Options considered

- **a-single-form**: one screen with the category picker and the monthly
  allowance together, and the validation message under the form. Two fields is
  all the task needs; one screen is one decision.
- **b-stepper**: two screens (pick a category, then set the allowance) with a
  step counter and dots. It focuses on one question at a time, but doubles the
  taps for a two-field form, needs a Back control and a place to keep the
  half-finished choice, and adds copy to translate.

## Chosen: a-single-form

Adding a bucket asks two things. Splitting them across screens costs more than
it clarifies, and the single form is what the app already does. The stepper
would earn its place only if the form grew (for example, rollover rules or
month-by-month amounts).

## For the implementer

- **Reuse**: the content-title tile, form label, hint, category picker
  (`CategorySearchSelect`), number input, and the primary and secondary
  buttons (`design/system/components.md`). Nothing new is needed.
- **Strings**: all exist (`buckets.addNew`, `entryForm.category`,
  `addBucket.categoryHint`, `entryForm.selectCategory`,
  `bucketForm.monthlyAllowance`, `addBucket.allowancePlaceholder`,
  `common.submit`, `common.cancel`, `validation.selectCategory`), in English
  and Spanish.
- **Behaviour the screens do not show**: only categories without a bucket are
  listed; a rejected submit shows one message at a time (category first, then
  allowance); typing or picking clears the message; a successful submit goes to
  the Buckets list.
- **Edge cases**: a very long category name truncates inside the picker; with
  no categories left to budget, the form is replaced by a link to add a
  category.

## Findings from the design review

Running the reviewer against the built app, three screens are pixel-identical
and the error screen differs by 0.49% of pixels. Both differences are real:

- **The error message colour is off the design system.** The app renders it
  with Bootstrap's `text-danger` (`rgb(220, 53, 69)`), which is not a design
  token. The approved screen uses the design system's `--danger`
  (`#f87171`). The right fix is in the app (use the token), not in the mockup.
- **Focus after a tap.** After tapping Submit the button stays focused and shows
  its lighter hover/focus gold. The error fixture ends with `{"blur": true}` so
  the approved screen shows the resting button; a keyboard user will see the
  focus style.

A 0.49% difference passes the default 2% threshold, which is why the reviewer
asks you to open the diff image of every screen that is not exactly 0.00%.

## Approved screens

| Screen | State | File |
|---|---|---|
| Add bucket | Empty form | `approved/add-bucket.default.html` |
| Add bucket | Category and allowance entered | `approved/add-bucket.filled.html` |
| Add bucket | Validation message after Submit with nothing chosen | `approved/add-bucket.error.html` |
| Add bucket | Empty form, Spanish | `approved/add-bucket.es.html` |
