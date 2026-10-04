---
name: ui-approve
description: Approve one explored UI option for a feature and turn it into the binding spec an implementer builds to. Writes the complete approved screens (every state and language), flow.json, fixtures.json and the implementer notes in decision.md, then regenerates the gallery. Use only when the user names the option to approve, e.g. "approve option b for recurring-entries". Designs only; never edits src/.
---

# UI approve

Promotes the option the **user chose** into the approved design: the exact
visual spec, flow and test data an implementing agent builds to, and the
`design-reviewer` agent later checks the built feature against.

Read `design/README.md` first: it defines the layout and the rules.

## Input

`<feature-slug> <option-id>`: for example `recurring-entries b-timeline`.

**Never choose the option yourself.** If the user has not named one, stop and
ask. If `decision.md` already says `approved`, stop and ask whether to
re-approve (it replaces the previous spec).

## Procedure

1. **Check the starting point.** `design/features/<slug>/ui/options/<option-id>/`
   exists and has screens; `decision.md` says `exploring`. Run
   `npm run gallery:build` first so you start from a package that builds.
2. **Write the approved screens** into `ui/approved/`, one file per screen and
   **state**: `<screen>.<state>.html`. Start from the chosen option's mockups
   but make each one complete and final:
   - cover every state a user can reach: `default`, plus whichever of
     `filled`, `empty`, `loading`, `error`, `disabled` apply;
   - add a `.es` variant wherever the Spanish copy changes the layout (use the
     wording in `src/i18n/translations/es.ts`; for new strings, write Spanish
     that matches its tone);
   - use final copy: the exact strings the app will show.
   Follow "Writing a mockup" in `design/README.md`.
3. **Write `ui/flow.json`**: every approved screen (by `<screen>.<state>` id,
   with a `title` and the app `route`) plus any **existing** screen the flow
   starts from or returns to as `"external": true`; and the `transitions`
   between them, each with a short `label` naming what the user does
   (`"Tap Add new bucket"`). Every approved screen name must appear.
4. **Write `ui/fixtures.json`**: an entry for every approved screen, keyed by
   `<screen>.<state>`, with the `route`, the `viewport` (`375×720`), the
   `localStorage` that seeds the app into that state, and `actions` that reach
   it (a click, a fill, a wait). Always seed `"everShowDataDisclaimer": "0"`
   (otherwise the app's first-run modal covers the screen) and
   `"settings.language"` for the language shown. The `design-reviewer`
   renders each screen from this, so it must be exactly what the mockup shows.
   Format: `design/README.md` → "fixtures.json".
5. **Rewrite `ui/decision.md`**: `status: approved`, `chosen: <option-id>`, then
   - **Decision**: why this option won, and why the others did not;
   - **For the implementer**: the existing components and mixins to reuse
     (from `design/system/components.md`), any **new** shared component or
     token the design needs, the new i18n keys with their English and Spanish
     text, validation rules and behaviour the screens do not show, and edge
     cases (long names, zero, negative, many items);
   - **Approved screens**: a table of screen, state, file.
   If a `TASKS.md` exists for the feature, link each task to the approved
   screen it delivers.
6. **Build and check.** `npm run gallery:build` must pass and regenerate
   `design/gallery.html` and `ui/flow.html`. Open the generated flow page in a
   headless browser, click through it, and look at the screenshots.
7. **Report**: the approved screens (and states), the flow in one line, the
   new strings and components the implementer must add, and anything you had to
   assume. Do **not** start implementing.

## Hard rules

- Only the user picks the option; you only record it.
- Work only under `design/`. Never edit `src/`, `docs/` or `CLAUDE.md`; new
  components, tokens and strings go in the **implementer notes**, not in code.
- The approved screens are a **contract**: no lorem ipsum, no "TBD" copy, no
  state left undrawn. If something is genuinely undecided, ask the user.
- A design-only PR needs no version bump or changelog entry (see
  `design/README.md`).
