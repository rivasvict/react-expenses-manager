---
title: Example — Buckets empty state
summary: A worked example of the UI package format. It shows two ways to treat the Buckets empty state and records the decision to keep today's layout.
status: approved
chosen: a-keep-current
example: true
---

# Decision

**This is an example, not a feature to build.** It exists so the folder
convention (docs/ui-workflow.md) and the gallery have something real to show.
Agents must not implement it or treat it as a spec.

## Options considered

- **a-keep-current** — today's empty state: illustration, title, message, then
  *Add new bucket* and *Go back*.
- **b-guided** — replaces the illustration with an icon chip and adds a
  three-step "how buckets work" card.

## Chosen: a-keep-current

Option B explains buckets better, but it adds new copy that would need
English and Spanish strings, and it hides the illustration the app already
ships. For an empty state that most users see once, the extra weight isn't
worth it.

## Approved screens

| Screen | State | File |
|---|---|---|
| Buckets (no buckets) | English | `approved/buckets-empty.default.html` |
| Buckets (no buckets) | Spanish | `approved/buckets-empty.es.html` |
