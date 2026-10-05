# STYLE_FRAME — the visual system (verbatim from the on-prem reel)

Copy this front-matter into your project's `frame.md`. These tokens ARE the
brand; change the subject, not the palette.

```yaml
colors:
  forest: "#061C19"        # dark scene background — major ideas
  forestRaised: "#123A2E"  # raised panels on dark
  forestBorder: "#3D6D5D"
  green: "#01A982"         # HPE green — the ACTIVE relationship, and only that
  greenBright: "#3EE6B4"   # traces, live accents on dark
  greenInk: "#087657"      # green text on light
  warmCanvas: "#F3F4ED"    # light scene background — explanation
  paper: "#FFFFFF"
  ink: "#163A2D"           # body text on light
  darkMuted: "#AEC4BC"     # secondary text on dark
  lightMuted: "#577066"    # secondary text on light
  paleBorder: "#D0DED6"
  mist: "#DFE6E1"
  amber: "#F4B942"         # a real boundary or risk — never decoration
typography:
  display: { family: HPE Graphik, weights: [600, 700] }
  body:    { family: HPE Graphik, weights: [400, 500] }
  data:    { family: HPE Graphik, weights: [500, 600] }
spacing:
  frameEdge: 88px      # nothing important outside this margin
  majorGap: 48px
  cardGap: 24px
  cardPadding: 30px
components:
  cornerRadius: [0px, 8px, 12px]
  borderWidth: [1px, 2px, 4px]
  depth: restrained-layered
```

## Fonts

HPE Graphik is bundled locally in `assets/fonts/` (Regular, Medium, Semibold,
Bold OTFs) and declared in `assets/opsramp.css` @font-face rules. **This pack
ships the four OTFs in its own `assets/fonts/`** — copy that directory into
your reel's `assets/fonts/`. (Copy of record in the codebase:
`app/public/fonts/` in `HPE-Hybrid-Cloud/or-itom-portal-prototype`, commit
`5c90c52`; the pack's copies are byte-identical to it.) Copy the @font-face
block verbatim; never load brand fonts from the network. HPE
Graphik is a licensed brand font: HPE-internal use only, keep it out of any
public artifact. Headlines: large, sentence case, short. Body copy is never
a transcript of the narration. Small labels use letter-spacing (tracking) and
tabular figures.

## Frame anatomy (every scene, 1920×1080 @ 30fps)

```
┌──────────────────────────────────────────────────────────┐
│ frame-header:  brand-lockup (mark + "HPE <Product>")      │
│                chapter-label right ("03 / 20 · <name>")   │
│ diagram-head:  eyebrow (PART kicker, tracked caps)        │
│                scene-title (word-by-word spans)           │
│                scene-support (one factual line)           │
│                accent-rule (short green rule)             │
│ dg-stage:      left:88px top:268px  1744 × 632            │
│                zones → edges (SVG) → nodes/text layers    │
│ scene-progress: thin live progress line                   │
│ (bottom 160px reserved for player captions — keep clear)  │
└──────────────────────────────────────────────────────────┘
```

Ambient layers on dark scenes: `ambient-grid` + one `ambient-orb`
(`data-layout-ignore`). Depth is restrained: layered panels, 1–2px borders,
no drop-shadow theater.

## Meaning of color and theme (the grammar viewers learn)

- `theme: 'dark'` (forest) = major ideas, act openers, the question, recaps.
- `theme: 'light'` (warmCanvas) = explanation and mechanics.
- Green marks the relationship currently being explained — one at a time.
- Amber marks a genuine boundary/risk (darksite wall, TBD decisions). If
  everything is amber, nothing is.
- Product windows (if you show product) get simple browser chrome and a
  factual status strip — no fake OS chrome.

## Diagram vocabulary (scenes.mjs helpers → styled by assets CSS)

- `node(id,x,y,w,h,label,{sub,tone,cue})` — a capability/system card.
- `zone(id,...)` — a labeled region grouping nodes (e.g., "Customer site").
- `text(id,...,{size:'xl'|'md',tone})` — statement typography on stage.
- `edge(id,[points],{tone})` — SVG relationship line: glow + dash-drawn line
  + arrowhead that fades in when the trace completes.
- `row(id,y,label,source,badge,cue)` — full-width ledger rows for recap and
  closing-ledger frames.

Stage coordinates are stage pixels (0,0 top-left of the 1744×632 stage).

## Do not

- Do not fabricate telemetry, customer outcomes, or product status.
- Do not turn evidence into a feature tour.
- Do not introduce colors outside the token set, or a second accent.
- Do not put copy outside the 88px edge or inside the caption band.
