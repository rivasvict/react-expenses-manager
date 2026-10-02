# UI packages: designing a feature before it is built

A feature that has a user interface keeps its UI design **next to its brief**,
in `docs/<feature>/ui/`. The design is one input to the feature, not the
feature itself: a separate agent implements the whole feature from the brief
plus the approved screens.

The UI package exists so that:

1. **The approved screens are the exact visual spec** for a pixel-perfect build.
2. **The flow is clear**: which screens exist and how a user moves between them.
3. **What to build is visible at a glance**, instead of described in prose.

Open [`ui-gallery.html`](ui-gallery.html) in a browser to see every feature's
options and approved screens in one place.

## Layout

```
docs/<feature>/
  feature-brief.md  PRD.md  TASKS.md  …     the feature's usual documents
  ui/
    decision.md          REQUIRED. Status, chosen option and why (front matter below)
    options/
      a-<name>/<screen>.html   alternatives while exploring; one folder per option
      b-<name>/<screen>.html
    approved/
      <screen>.<state>.html    the binding spec, one file per screen and state
    flow.html            optional: the screen map (routes and how they connect)
    fixtures.json        optional: the data each approved screen shows
docs/ui-gallery.html     GENERATED. Do not edit; run `npm run gallery:build`
```

A worked example lives in
[`example-buckets-empty-state/`](example-buckets-empty-state/ui/decision.md).
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

- **Link the tokens.** Load `design-system/tokens.css`, and normally
  `design-system/mockup.css` after it, with a relative path:

  ```html
  <link rel="stylesheet" href="../../../design-system/tokens.css">
  <link rel="stylesheet" href="../../../design-system/mockup.css">
  <body class="mk">
  ```

- **No literal colors.** Take every color from a token:
  `color: var(--text-secondary)`. In SVG, paint with
  `style="fill: var(--accent)"`, not `fill="#f0b90b"`. This is the same rule
  the app has (docs/design-system/README.md), applied to mockups.
- **No external resources.** No CDN scripts, fonts or images, so a mockup looks
  the same offline and in any sandbox. Local images (for example
  `src/images/…`) are fine.
- **Use what the app uses.** Start from `mockup.css` (shell, card, buttons,
  chip, text roles) and the components in `design-system/components.md`;
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

It scans every `docs/*/ui/`, **fails without writing** if anything breaks the
convention or the mockup rules (and lists every problem), and otherwise
rewrites `docs/ui-gallery.html`. Commit the regenerated file with your change;
`src/uiGallery/committedGallery.test.js` fails when it is stale.

The gallery filters by status, switches every preview between phone (375) and
desktop (1280), and opens any screen full size on click.

## Rules for agents

- **Designing:** work only inside `docs/<feature>/ui/`; never change `src/` to
  try a design. Use the design system and its tokens; offer 2–3 genuinely
  different options when exploring.
- **Implementing:** a feature whose `decision.md` says `approved` has a binding
  visual spec in `ui/approved/`. Build to it and to the flow. **Do not improvise
  where it is silent or where it conflicts with the app's constraints: flag the
  gap in the PR** (and, if the design must change, in `decision.md`).
  Packages with `example: true` are never built.
- **Always:** every visible string still needs English and Spanish
  (`src/i18n/`), whatever the mockup shows.
