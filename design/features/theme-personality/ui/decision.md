---
title: Theme personality
summary: Faint per-theme drawings behind the app (switchable in the Theme sheet) and a Google Fonts pairing for each theme.
status: exploring
---

# Decision

Nothing is approved yet. Background art and typography are **independent
axes**: each option below pairs one of each only so there is something to look
at, and the owner may mix them (for example "tile art, headline-voice type").
Open `design/gallery.html`; each option has the dashboard (pictures on and
off), the Theme sheet (a themed one and Midnight Gold, where the switch is
disabled) and a **theme wall** with all 15 themes.

All 14 motifs are shared (`ui/shared/motifs/*.svg`): one 96px tile, monoline,
1.5px round stroke, 2 focal shapes plus fillers. They are painted with the
theme's `--accent` through a CSS mask, so no per-theme palette is needed and
the recolor is automatic. Midnight Gold has none. Fonts live in
`ui/shared/fonts/` (latin subsets, SIL OFL) only so mockups stay offline.

## Options considered

### A · Tile + headline voice
An all-over repeating pattern at about 7% accent, fixed to the viewport.
Display font only on titles, eyebrows and the brand name; body stays the system
stack. *Good at:* the calmest, most "wallpaper" result; scales to any scroll
length; cheapest in bytes (one display font per theme). *Costs:* the repeat
grid shows on a 112px tile unless rows are offset or the tile is drawn bigger.

### B · Crest + full pairing
One large drawing tucked into the top-right corner (about 11%), and a themed
display **and** body face everywhere. *Good at:* the most character per theme.
*Costs:* the art sits behind the header and the balance, big crops make some
motifs unreadable, it reads as a watermark, and body faces for 14 themes mean
28 families to ship.

### C · Frieze + headline & figures
A horizon strip along the bottom edge (about 12%); display face on headings and
on money figures. *Good at:* feels designed, never touches the header.
*Costs:* collides with the last card and the tab bar, and putting display faces
on money breaks column alignment (see the review).

## Expert review (design reviewer persona) and what was done

Summary: **ship art A, type model a**, with these before approval.

Applied in this exploration: Ocarina no longer draws the Triforce (an ocarina,
mountains and a star instead); Super Saiyan no longer draws the seven-dot ball
(aura flame and lightning); a per-scheme `--art-opacity` (light themes about
12%).

Open before `/ui-approve` (carry these into the approved screens):
1. Offset alternate tile rows (or a 160px tile with four motifs); keep it
   `position: fixed`. Frieze, if kept, needs `bottom: var(--tabbar-h)`.
2. Redraw Pumpkin King (spiral hill, bow, crooked moon), Flexoki Light (quill
   and inkwell), Wisteria (hanging raceme + ichimatsu check), Yuletide (holly,
   bell, ornament, so it stops echoing Snowglobe), Gruvbox (70s arcs), Digital
   Rain (aligned katakana-like columns with a bright head glyph) and Tokyo
   Night (replace the sign with a tower or rain).
3. **Money figures never use a display face**: tabular, lining numerals in the
   body or system font in every theme (`font-variant-numeric: tabular-nums
   lining-nums`). Type model C is therefore out as drawn; the monospace
   themes are the only exception, since their figures are tabular anyway.
4. Replace Mountains of Christmas (proportional digits, thin Latin Extended
   coverage); use Creepster only for 20px+ titles; verify Spanish and French
   accents (`Ñandú, ¿cuánto? ¡Hola! œuvre, çà, é`) for Almendra, Shippori
   Mincho and Zen Kaku Gothic New, which are Japanese-first.
5. Fonts: the owner said Google Fonts is the only external source. The review
   recommends **downloading the woff2 files from Google Fonts and self-hosting
   them** (GDPR: a runtime Google request sends the visitor's IP; the service
   worker can cache them). Load only the active theme's family after first
   paint, `font-display: swap` (`optional` for decorative faces),
   latin + latin-ext subsets, size-adjusted fallbacks. **Owner to confirm.**
6. Settings: one switch row at the top of the Theme sheet ("Background
   pictures", English/Spanish/French), disabled with an explanation on
   Midnight Gold, stored as `settings.themeArt`. The review also suggests a
   second "Theme fonts" switch (decorative faces are hard for some readers and
   cost network); the brief had it out of scope, so **owner to decide**.
7. Art layer is `aria-hidden`, hidden under `forced-colors` and with Save-Data;
   the existing theme contrast test should also run with the art composited.

Not drawn (say so when approving): the **empty and error** states are trivial
here: a font that fails to load falls back to the system stack, and a missing
art file simply shows the plain background.

## Questions for the owner
- Which art model (A recommended) and which type model (a recommended)?
- Self-host the Google fonts (recommended) or link Google's CSS at runtime?
- Add a separate "Theme fonts" switch?
