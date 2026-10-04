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
      flow.html            optional: the screen map (routes and how they connect)
      fixtures.json        optional: the data each approved screen shows
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

### `fixtures.json`

The data each approved screen shows, in the form the app stores it, so the
mockup and the built screen can be rendered from the same input and compared:

```json
{
  "screens": {
    "buckets-empty.default": {
      "route": "/buckets",
      "viewport": { "width": 375, "height": 720 },
      "localStorage": { "settings.language": "en", "buckets": "{}" }
    }
  }
}
```

The keys are screen names as in `approved/` (`<screen>.<state>`). The format
is deliberately small; the reviewer tooling that consumes it comes later.

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

## Rules for agents

- **Designing:** work only inside `design/`; never change `src/` to try a
  design. Use the design system and its tokens; offer 2–3 genuinely different
  options when exploring. A design-only PR gets no version bump and no
  changelog entry (see above).
- **Implementing:** a feature whose `decision.md` says `approved` has a binding
  visual spec in `ui/approved/`. Build to it and to the flow. **Do not improvise
  where it is silent or where it conflicts with the app's constraints: flag the
  gap in the PR** (and, if the design must change, in `decision.md`).
  Packages with `example: true` are never built. The implementation PR is a
  normal one: it bumps the version and adds a changelog entry.
- **Always:** every visible string still needs English and Spanish
  (`src/i18n/`), whatever the mockup shows.
