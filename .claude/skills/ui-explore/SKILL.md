---
name: ui-explore
description: Explore the UI for a proposed feature before it is built. Reads the feature's brief and the design system, then builds 2-3 genuinely different HTML options under design/features/<feature>/ui/options/ and regenerates the design gallery. Use when asked to "design", "explore options for", "propose a UI for" or "mock up" a feature. Designs only; never edits src/.
---

# UI explore

Turns a feature brief into **2–3 comparable UI options** the owner can look at
and choose from. It does not choose for them (that is `/ui-approve`) and it
never builds the feature.

Read `design/README.md` first: it defines the folder layout, the mockup rules
and the gallery. This skill is the procedure; that file is the convention.

## Input

`<feature-slug>`: a folder name in `design/features/` (kebab-case, e.g.
`recurring-entries`). If the user describes a feature without a slug, derive
one and confirm it in your first message.

## Procedure

1. **Settle the brief.** Read `design/features/<slug>/feature-brief.md` (or
   `brief.md`). If there is none, write one from the user's request: the
   problem, the goal, the constraints, and what is explicitly out of scope.
   Keep it short and show it to the user; if anything material is ambiguous
   (who it is for, which screens, what data), **ask before designing**.
2. **Learn the system.** Read `design/system/README.md`,
   `design/system/components.md` and `design/system/mockup.css`. Every option
   is built from these; you may not invent colours, radii or fonts.
3. **Learn the app.** Find the screens the feature touches or sits next to
   (routes are listed in `CLAUDE.md`; components under `src/components/`) and
   read them so the options fit how the app already behaves. Reuse its
   existing copy from `src/i18n/translations/en.ts` where it applies.
   Reading `src/` is fine; **never edit it**.
4. **Design 2–3 options that differ in substance**, not in colour: a different
   layout, a different interaction model, a different level of guidance. One
   option may be "keep what the app does today" when that is a real
   candidate. Name each folder `a-<short-name>`, `b-<short-name>`, …
   under `design/features/<slug>/ui/options/`, one `<screen>.html` per screen
   the option needs. Show each option's **main path**, and its most
   important non-default state (empty or error), so the options can be
   compared fairly.
5. **Write the mockups** following "Writing a mockup" in `design/README.md`:
   link `tokens.css` then `mockup.css`, `<body class="mk">`, only `var(--…)`
   colours, no external resources, designed at 375px. Use realistic English
   copy and data (money as the app formats it: `$1,240.00`), not "Lorem ipsum".
6. **Write `ui/decision.md`** with `status: exploring`, a `title`, a one-line
   `summary`, and under "Options considered" a short paragraph per option: what
   it is, what it is good at, what it costs (more screens, more copy, more
   code to build). No `chosen:` yet.
7. **Build and check.**
   - `npm run gallery:build` must pass (it lists every problem).
   - Open `design/gallery.html` (and a mockup) in a headless browser and
     look at the screenshots; confirm nothing is broken or clipped at 375px.
8. **Report to the user**: a table of the options (name, one-line idea, main
   trade-off), where to look (`design/gallery.html`, the option folders), your
   recommendation and why, and the question "which option should I approve?".

## Quality bar (check every option against it)

- One gold primary action per screen; secondary and danger styles as the
  design system defines them.
- The screen works with **long text**: Spanish runs about 30% longer than
  English, and user-entered names can be anything.
- Touch targets as large as the system's buttons (3.1em); nothing important
  within the bottom tab bar's area.
- Contrast comes from the tokens; don't use `--text-muted` for anything the
  user must read to proceed.
- Money amounts use tabular figures (`mockup.css` already sets this).
- A screen with data also has a believable **empty** and **error** story, even
  if you only draw one of them now; say in `decision.md` what the other is.

## Hard rules

- Work only under `design/`. Never edit `src/`, `docs/` or `CLAUDE.md`.
- Never mark a package `approved` or write `chosen:`; only `/ui-approve` does,
  and only when the user names the option.
- Never copy another proposal's look; start from the design system.
- A design-only PR needs no version bump or changelog entry (see
  `design/README.md`). If you touched anything outside `design/`, say so.
