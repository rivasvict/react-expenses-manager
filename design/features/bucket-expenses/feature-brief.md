# Bucket expenses

## Problem
Opening a bucket from **Buckets → bucket name** (`/edit-bucket/:bucketName`)
shows only one number field, the monthly allowance. To understand where a
bucket's money went, the user has to leave, open the expense list and filter by
category by hand.

## Goal
On that same screen, show the bucket's expenses for the month being viewed, and
how the bucket stands (spent, left, carried), so the user understands it at a
glance, **without losing the ability to edit the allowance**.

## Constraints
- Same route and entry point; the month is the app's selected month.
- Allowance editing keeps its rules: the hint "applies from the month you are
  viewing onward", validation, Submit / Cancel.
- Expenses are those whose `categories_path` matches the bucket (existing
  matching rule); amounts, descriptions and names are user data, never translated.
- Design-system components only; every new string gets EN / ES / FR when built.

## Out of scope
Editing or deleting an expense from here, changing the month from here, and
renaming the bucket (a bucket mirrors its category).
