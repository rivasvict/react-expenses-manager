# Design: proposals, evaluations and the design system

Everything here is **design work, not product**. It is where a feature is
proposed, its UI is explored and approved, and where the design system lives,
all before (and separately from) the code that ships.

| Folder | What it holds |
|---|---|
| [`system/`](system/README.md) | The design system: rules, component inventory, generated `tokens.css`, the mockup base, the reference board. |
| `features/<feature>/` | One folder per proposed feature: its brief, and its UI package (below). |
| [`gallery.html`](gallery.html) | **Generated.** Every feature's UI options and approved screens in one page. Open it in a browser. |

`docs/` is different: it documents shipped, production-usable parts of the app
(for example `docs/multi-user-sync/` and `docs/deployment/`). Proposals and
evaluations never go there.

## The workflow

```
brief ─▶ /ui-explore ─▶ you pick ─▶ /ui-approve ─▶ implement ─▶ design-reviewer ─▶ merge
         2–3 options     an option    approved screens,  (separate     pixel-diffs the built
         in the gallery               flow, fixtures     agent)        app against the design
```

| Step | Who | What happens |
|---|---|---|
| 1. Explore | `/ui-explore <feature>` skill | Reads the brief and the design system, builds 2–3 genuinely different options under `ui/options/`, rebuilds the gallery. |
| 2. Choose | **You** | Open `design/gallery.html`, compare the options, name one. |
| 3. Approve | `/ui-approve <feature> <option>` skill | Writes the complete approved screens (every state and language), `flow.json`, `fixtures.json` and the implementer notes; sets `status: approved`. |
| 4. Implement | A separate agent | Builds the whole feature from the brief and the approved screens (see "Rules for agents"). |
| 5. Review | `design-reviewer` agent | Builds the app, renders each approved screen from the mockup and from the real app, pixel-diffs them, checks the flow and the repo checks, and reports. It never edits code. |

The skills live in `.claude/skills/ui-explore/` and `.claude/skills/ui-approve/`,
the agent in `.claude/agents/design-reviewer.md`. Two worked examples show the
result: [`example-buckets-empty-state`](features/example-buckets-empty-state/ui/decision.md)
(one screen, two languages) and
[`example-add-bucket-flow`](features/example-add-bucket-flow/ui/decision.md)
(a flow with a form in four states). Open their `flow.html` to click through.

## Changes here don't bump the app version

A pull request that changes **only files under `design/`** is a proposal or an
evaluation, not a change to the app. It gets **no version bump and no
`CHANGELOG.md` entry**. Everything else (`src/`, `server/`, `public/`,
`scripts/`, `.github/`, `CLAUDE.md`, and so on) keeps the usual rule: bump the
version and add a changelog entry.

A PR that touches `design/` *and* anything else follows the usual rule for the
whole PR. Keep design work in its own PR when you can.

## UI packages: designing a feature before it is built

A feature that has a user interface keeps its UI design **next to its brief**,
in `design/features/<feature>/ui/`. The design is one input to the feature, not
the feature itself: a separate agent implements the whole feature from the
brief plus the approved screens.

The UI package exists so that:

1. **The approved screens are the exact visual spec** for a pixel-perfect build.
2. **The flow is clear**: which screens exist and how a user moves between them.
3. **What to build is visible at a glance**, instead of described in prose.

## Layout

```
design/
  README.md              this file
  gallery.html           GENERATED. Do not edit; run `npm run gallery:build`
  system/                the design system (see system/README.md)
  features/<feature>/
    feature-brief.md  PRD.md  TASKS.md  …     the proposal's usual documents
    ui/
      decision.md          REQUIRED. Status, chosen option and why (front matter below)
      options/
        a-<name>/<screen>.html   alternatives while exploring; one folder per option
        b-<name>/<screen>.html
      approved/
        <screen>.<state>.html    the binding spec, one file per screen and state
      flow.json            the screens and the transitions between them
      flow.html            GENERATED from flow.json: a click-through walkthrough
      fixtures.json        how to put the real app into each approved screen
```

A worked example lives in
[`features/example-buckets-empty-state/`](features/example-buckets-empty-state/ui/decision.md).
It is marked `example: true`: it demonstrates the format and is **not** a
feature to build.

### `ui/decision.md`

Starts with a front-matter block of flat `key: value` lines:

```markdown
---
title: Recurring entries
summary: One sentence the gallery shows under the title.
status: exploring        # exploring | approved | implemented
chosen: b-timeline       # the options/ folder picked; required once approved
example: false           # optional; true only for demonstration packages
---

# Decision
Options considered, which one won, and why. Anything an implementer must know
that the screens do not show (copy, edge cases, behaviour).
```

| Status | Meaning |
|---|---|
| `exploring` | Options are being compared; nothing is binding yet. |
| `approved` | An option is chosen and `approved/` holds the final screens. **This is the spec.** |
| `implemented` | The feature is built and was checked against `approved/`. |

### Approved screens

One file per screen **and state**, named `<screen>.<state>.html`
(`bucket-list.empty.html`). A bare `<screen>.html` means the default state.
Cover every state a user can reach: default, empty, loading, error, and each
language (`.es`) when the layout differs. An implementer must never have to
guess a state.

### `flow.json`

How a user moves through the feature. Screens are approved screens, by
`<screen>.<state>` id; a screen the app **already has** and the feature does not
redesign is `"external": true`. Every approved screen name must appear.

```json
{
  "screens": [
    { "id": "buckets-list", "title": "Buckets", "route": "/buckets", "external": true },
    { "id": "add-bucket.default", "title": "Add bucket", "route": "/add-bucket" },
    { "id": "add-bucket.error", "title": "Nothing chosen", "route": "/add-bucket" }
  ],
  "transitions": [
    { "from": "buckets-list", "to": "add-bucket.default", "label": "Tap Add new bucket" },
    { "from": "add-bucket.default", "to": "add-bucket.error", "label": "Tap Submit with nothing chosen" }
  ]
}
```

`npm run gallery:build` validates it against `approved/` (an unknown screen, a
transition to nowhere or an approved screen left out is an error) and generates
`flow.html` from it: **a walkthrough** (a phone frame where you click a
transition to go to the next screen, with Back and Restart) and **an overview**
of every screen and where it leads. Never edit `flow.html`.

### `fixtures.json`

How the design reviewer puts the **real app** into each approved screen, so the
built screen and the mockup show the same thing:

```json
{
  "screens": {
    "add-bucket.error": {
      "route": "/add-bucket",
      "viewport": { "width": 375, "height": 720 },
      "localStorage": { "everShowDataDisclaimer": "0", "settings.language": "en" },
      "actions": [{ "click": "button[type=submit]" }, { "blur": true }]
    }
  }
}
```

- Keys are screen names as in `approved/` (`<screen>.<state>`); every approved
  screen needs one.
- `localStorage` seeds the app before it starts. **Always include
  `"everShowDataDisclaimer": "0"`**: without it the app's first-run modal
  covers the screen. Non-string values are stored as JSON.
- `actions` reach states that need interaction, in order: `{"click": selector}`,
  `{"fill": [selector, text]}`, `{"wait": ms}`, `{"blur": true}` (drop the focus
  a click leaves behind). Selectors are Playwright selectors.
- Optional `region` (`{"app": selector, "mockup": selector}`) changes what is
  compared; the default is the work-area card on both sides.

## Writing a mockup

A mockup is a plain, **self-contained** HTML file. The gallery checks every
one (`npm run gallery:build`, and a unit test in CI) against these rules:

- **Link the tokens.** Load `system/tokens.css`, and normally
  `system/mockup.css` after it, with a relative path. From a file in
  `approved/` that is four levels up:

  ```html
  <link rel="stylesheet" href="../../../../system/tokens.css">
  <link rel="stylesheet" href="../../../../system/mockup.css">
  <body class="mk">
  ```

  (One more `../` from a file in `options/<option>/`; one fewer from `flow.html`.)

- **No literal colors.** Take every color from a token:
  `color: var(--text-secondary)`. In SVG, paint with
  `style="fill: var(--accent)"`, not `fill="#f0b90b"`. This is the same rule
  the app has (design/system/README.md), applied to mockups.
- **No external resources.** No CDN scripts, fonts or images, so a mockup looks
  the same offline and in any sandbox. Local images (for example
  `src/images/…`) are fine.
- **Use what the app uses.** Start from `mockup.css` (shell, card, buttons,
  chip, text roles) and the components in `system/components.md`;
  don't invent a new look. If a screen needs a new shared component, say so in
  `decision.md` and add it to `components.md` when it is implemented.
- Draw the screen at **375 px** (phone) first; the work area is a single column
  capped at 40rem, so desktop is the same column centred.

`mockup.css` omits the app-bar navigation / bottom tab bar (identical on every
screen) and icons. If a screen is about navigation, draw it explicitly.

## Building the gallery

```bash
npm run gallery:build
```

It scans every `design/features/*/ui/`, **fails without writing** if anything
breaks the convention or the mockup rules (and lists every problem), and
otherwise rewrites `design/gallery.html`. Commit the regenerated file with your
change; `src/uiGallery/committedGallery.test.js` fails when it is stale.

The gallery filters by status, switches every preview between phone (375) and
desktop (1280), and opens any screen full size on click.

## Reviewing a built feature

```bash
npm run build
npm run design:review -- --feature <feature>      # or --url http://localhost:3000
```

For every approved screen it renders the mockup and the real app (from
`fixtures.json`), pixel-compares the work-area card on both sides, and writes
`design/.review/<feature>/` (gitignored): `index.html` with the mockup, the app
and the difference side by side, `report.md`, `report.json` and the images.

- A screen passes when both sides render at the same size and at most
  `--threshold` percent of pixels (default 2) differ by more than `--tolerance`
  per colour channel (default 12 of 255). Exit code 1 means a screen failed.
- The threshold is a share of the whole screen, so **a small but real difference
  can pass it** (a wrong colour on one line of text). Open the diff image of any
  screen that is not exactly 0.00%.
- It needs Playwright with a Chromium and Node 18+ (the app itself builds on the
  Node in `.nvmrc`). Set `PLAYWRIGHT_MODULE` if Playwright is installed
  elsewhere.
- `mockup.css` is calibrated to the **phone** layout, by measuring the real app
  with this tool. The app bar and tab bar are not compared.

## Rules for agents

- **Designing:** use `/ui-explore` and `/ui-approve`. Work only inside
  `design/`; never change `src/` to try a design. Use the design system and its
  tokens; offer 2–3 genuinely different options when exploring, and let the
  user choose. A design-only PR gets no version bump and no changelog entry
  (see above).
- **Implementing:** a feature whose `decision.md` says `approved` has a binding
  visual spec in `ui/approved/`. Build to it and to the flow. **Do not improvise
  where it is silent or where it conflicts with the app's constraints: flag the
  gap in the PR** (and, if the design must change, in `decision.md`).
  Packages with `example: true` are never built. The implementation PR is a
  normal one: it bumps the version and adds a changelog entry. Before opening
  it, run the `design-reviewer` agent (or `npm run design:review`).
- **Always:** every visible string still needs English and Spanish
  (`src/i18n/`), whatever the mockup shows.
