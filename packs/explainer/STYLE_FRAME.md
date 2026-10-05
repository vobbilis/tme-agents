# STYLE_FRAME — the visual system (verbatim from the SecOps story reel)

Same brand family as the diagram and footage packs; a third frame. The
illustration **is** the frame: a full 1920×1080 SVG per state with its own
background, title block, diagram and footnote. No persistent chrome, no
progress line, no chapter counter — the storyboard and the review player
carry position.

## Palette (`illustrations.mjs` → `palette(theme)`)

```js
const DARK  = { bg: '#071f23', panel: '#102e32', ink: '#f2f7f3', muted: '#a9c6c4',
                line: '#33595a', connector: '#789d9d', green: '#58e7ba',
                amber: '#ffc875', blue: '#a8ccff', soft: '#164541' }
const LIGHT = { bg: '#f3f2eb', panel: '#ffffff', ink: '#14312e', muted: '#496964',
                line: '#baccc4', connector: '#617e76', green: '#00785d',
                amber: '#a65516', blue: '#24549b', soft: '#dcebe2' }
```

Contrast is tested: semantic connectors ≥ 3:1 against the background;
`ink`, `muted`, `green`, `amber`, `blue` ≥ 4.5:1. Measured in the reference:
5.78:1 dark, 3.94:1 ivory for connectors. Do not add a colour.

## Colour grammar (what the audience learns once)

| Colour | Means | Never means |
|---|---|---|
| **amber** | a question, a late check, a boundary or a cost | a confirmed vulnerability, danger, an error |
| **mint / green** | connected evidence, the development thread, the brand accent on headline line two | safety, success, "passed" |
| **blue** | human ownership and authority (SecOps review, engineering responsibility) | agents, automation |
| **ink / muted** | structure and explanation | emphasis |

## Fonts

HPE Graphik Regular (400), Medium (500), Bold (700) embedded as base64
`@font-face` in every plate and in `storyboard.html` / `review.html`, read
from `assets/fonts/` beside the scripts. Licensed for HPE-internal use: keep
the OTFs out of public repos and hosted assets; never load a brand font from
the network. The builder aborts every non-local request, so a stray external
reference fails the build. Headline weight 500 with letter-spacing −2.5;
labels uppercase 16 px tracked +2; body 21–27 px.

## Frame anatomy (every state, 1920×1080)

```
┌──────────────────────────────────────────────────────────────────────┐
│ y 42   (top safe line — nothing above)                                │
│ x 104  ACT LABEL · 16px tracked caps                                  │
│        Headline line one · 64px ink                        y ≈ 265    │
│        Headline line two · 64px green                      y ≈ 351    │
│        kicker / support line · 21–30px muted                          │
│                                                                       │
│        ─── diagram region ───  cards 126–150 tall, 258–500 wide,      │
│        connectors 3px, arrows 12px heads, icons 48px line-work        │
│                                                                       │
│ y 775  [ recurring record · 1712 × 112 ]  (when the arc needs one)    │
│ y 874  footnote · 21px muted                                          │
│ y 951  (content bottom — nothing below)                               │
│ y 965–1064  caption band (two lines × 42 chars at 32/41px)            │
│ x 86 … 1838  horizontal safe range                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Every visible `<text>` carries `data-fit="true"`; the builder measures each
box and fails on: any box outside x 86–1838 / y 42–951, any two visible text
boxes overlapping by more than 4 px, fonts not ready, or less than 12 px
between the lowest content and the caption probe. These are the checks that
caught 48 headline/kicker collisions in the first SecOps generation.

## Illustration vocabulary (`illustrations.mjs` helpers)

| Helper | Draws |
|---|---|
| `title(scene, p, {x, y, size})` | act label + two-line headline |
| `card(x, y, w, h, heading, detail, p, accent, iconKind)` | panel with a 3 px accent rule, optional icon, heading 27 px, detail 21 px |
| `ribbon(x, y, w, value, p, accent)` | soft bar with a dot and 21 px label — a specialisation or a rail |
| `label(x, y, value, p, color)` | 16 px tracked caps |
| `note(value, p, color)` | footnote at y 874 |
| `arrow(x1, y1, x2, y2, color)` | horizontal connector with a head |
| `line(d, color, width)` | any path, round caps |
| `box`, `dot`, `text` | primitives |
| `icon(kind, x, y, color, scale)` | `code`, `person`, `observe`, `context`, `packet`, `loop`, `target`, `boundary` — 48 px line icons |
| `appear(visible, markup, faint)` | wraps a state's additions in `<g opacity>` (1 / 0 / 0.14 when faint) |
| `evidenceRecord(p, stage)` | the recurring record with identity attributes |

A renderer is `function chapterName(scene, phase, p)` returning SVG inner
markup; `illustration(scene, phase, {frame, fontStyle, motion})` wraps it in
the 1920×1080 root with background and embedded fonts. Phase 0 draws the
base; phases 1–3 add with `appear(phase >= n, …)`. Coordinates of existing
elements never change between phases.

## Do not

- Do not add photographs, screenshots, browser chrome, terminals or
  dashboards. A schematic "application / API / state" box is as close to a
  product as this form gets, and it is labelled "Operating-model
  illustration".
- Do not introduce a colour, a gradient, a shadow or a glow.
- Do not animate anything in chapters 1–9. Motion is the close only.
- Do not let text fall below y 951 or above y 42; the builder will refuse.
- Do not render narration paragraphs on screen. Headline, captions, labels,
  one footnote.
