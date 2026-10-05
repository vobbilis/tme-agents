# STYLE_FRAME — the visual system (verbatim from the SDLC evidence reel)

Same brand tokens as the architecture-journey pack; a different frame. The
architecture reel draws on a 1744×632 stage. This reel gives the left
two-thirds to playing footage and the right third to three conclusions.

## Tokens (copy into `production/frame.md` front-matter)

```yaml
colors:
  forest: "#061C19"        # dark surface — act boundaries; also the evidence well
  forestRaised: "#123A2E"
  forestBorder: "#3D6D5D"  # point rules on dark
  green: "#01A982"         # brand mark, progress line
  greenBright: "#3EE6B4"   # point numbers on dark
  greenInk: "#087657"      # point numbers on light
  warmCanvas: "#F3F4ED"    # light surface — the working scenes
  paper: "#FFFFFF"
  ink: "#163A2D"           # text on light
  darkMuted: "#AEC4BC"     # secondary text on dark (slate kicker/detail)
  lightMuted: "#577066"
  paleBorder: "#D0DED6"    # point rules on light
  mist: "#DFE6E1"
  amber: "#F4B942"         # boundary labels only — a real limit or risk
typography:
  display: { family: HPE Graphik, weights: [600, 700] }
  body:    { family: HPE Graphik, weights: [400, 500] }
  data:    { family: HPE Graphik, weights: [500, 600] }
spacing:
  frameEdge: 88px
  majorGap: 48px
  cardGap: 24px
  cardPadding: 30px
components:
  cornerRadius: [0px, 8px, 12px]
  borderWidth: [1px, 2px, 4px]
  depth: restrained-layered
```

Two colors exist only for the (normally disabled) highlight rectangle:
focus blue `#1675ff` and failure red `#e23b35`. Nothing else is blue or red.

## Fonts

HPE Graphik Regular/Medium/Semibold/Bold OTFs ship in this pack's
`assets/fonts/` and are declared in `assets/opsramp.css`. Copy of record:
`itom-portal-prototype/app/public/fonts/` at commit `5c90c52`; the pack's
copies are byte-identical. Licensed for HPE-internal use: keep the files out
of public source and hosted assets, and never load a brand font from the
network. `letter-spacing: 0` everywhere; sentence case; tabular numerals
for times.

## Frame anatomy (1920×1080 @ 30 fps)

```
 0                    88                                   1232 1280                  1832  1920
 ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 │ 60  ▭ HPE OpsRamp (26px/600)                              02 / 15  Chapter title (23px) │
 │165 ┌───────────────────────────────────────────┐  174 ┌──────────────────────────────┐ │
 │    │ EVIDENCE WELL  x64 y165 1168×710  #061C19 │      │ Title (40px/600, lh 1.19)    │ │
 │    │ ┌ boundary label (amber on forest) ┐      │      │ ─────────────────────────────│ │
 │    │ │ <video object-fit:contain>        │      │      │ 01  (19px/600 greenInk)      │ │
 │    │ │  camera: one fixed scale/x/y      │      │      │ Point one (31px, lh 1.3)     │ │
 │    │ │  per excerpt, set, never tweened  │      │      │ ─────────────────────────────│ │
 │    │ └───────────────────────────────────┘      │      │ 02                           │ │
 │    │ Engineer 1: ticket preparation / 10:55 /  │      │ Point two                    │ │
 │    │ excerpt at 1x        (source strip 21px)  │      │ ─────────────────────────────│ │
 │875 └───────────────────────────────────────────┘      │ 03  Point three              │ │
 │888  DRAFT 03 / RECORDED EXCERPTS – owner-confirmed      00:53 / 15:00  (21px, tabular)│ │
 │915  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ progress 1744×3 #01A982 (scaleX 0→1 over scene) ━━│ │
 │920 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ caption-safe band: y ≥ 907 (.84) — nothing but status ┄┄┄┄┄┄┄┄┄│ │
 └──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Evidence well** `left:64 top:165 1168×710`, background forest even on
  light scenes, so footage of any aspect sits in a dark letterbox. The
  `.camera` child is 1168×710 with `transform-origin: top left`; the crop
  is a single `scale/x/y` set at the excerpt's start (see FOOTAGE_GUIDE).
- **Source strip** pinned to the bottom of the well, min-height 42, forest
  background, 21 px: `<actor> / <source mm:ss> / excerpt at 1x` or
  `recorded excerpt / HELD FRAME`. It is how provenance survives cropping.
- **Boundary label** top-left of the well, amber on forest, 22 px — a short
  caps phrase that stops a misreading: `/jira-ticket-creation`,
  `PRODUCT REQUIREMENTS DOCUMENT`, `EDITED EXCERPTS – earlier design
  discussion included`, `SQL VALIDATION HARNESS`, `RELEASE RECONCILIATION`,
  `LOCAL COMMIT – push access blocked`, `PROPOSED RETURN HANDOFF`. At most
  one per scene; most scenes have none.
- **Panel** `left:1280 top:174 width:552`. Title 40 px/600, 40 px below.
  Each point: `min-height:110; border-top:2px; padding-top:22; 31px/1.3`,
  number badge 19 px/600 above. Points start at `opacity:0` and fade in
  over 0.35 s on their cue.
- **Status row** `top:888`, 21 px, flex space-between: draft/evidence status
  left, `mm:ss / 15:00` program time right. It is the only element allowed
  into the caption zone (`data-layout-allow-caption-zone`).
- **Progress** `top:915 1744×3` green, `scaleX` 0→1 linearly across the
  scene. Keeps a long-form film visibly alive without any other motion.
- **Pending slate** (`.tbd`): forest well, 2 px forestBorder frame, kicker
  24 px darkMuted, `TBD` at 100 px/600, title 34 px, detail 24 px darkMuted.
  Only for explicitly labelled missing recordings.

## Theme grammar

- **Dark (forest)** marks act boundaries: the opening, the first handoff
  between actors, the proposal, the close. **Light (warm canvas)** is the
  working surface for everything else. Flip theme only where the argument
  turns.
- **Green** is the brand mark, point numbers, progress — the frame's own
  structure. It never highlights footage.
- **Amber** appears only in a boundary label.
- **The footage keeps its own colors.** No tint, no vignette, no blur, no
  browser-chrome mockup around it. The dark well is the only treatment.

## The CSS (verbatim `assets/opsramp.css`; ship it unchanged)

```css
@font-face { font-family: 'HPE Graphik'; src: url('./fonts/HPEGraphik-Regular.otf'); font-weight: 400; font-display: block; }
@font-face { font-family: 'HPE Graphik'; src: url('./fonts/HPEGraphik-Medium.otf'); font-weight: 500; font-display: block; }
@font-face { font-family: 'HPE Graphik'; src: url('./fonts/HPEGraphik-Semibold.otf'); font-weight: 600; font-display: block; }
@font-face { font-family: 'HPE Graphik'; src: url('./fonts/HPEGraphik-Bold.otf'); font-weight: 700; font-display: block; }
* { box-sizing: border-box; letter-spacing: 0; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
body { font-family: 'HPE Graphik', sans-serif; background: #061c19; }
#root, .scene-slot { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
.surface { position: absolute; inset: 0; background: #f3f4ed; color: #163a2d; }
.surface.dark { background: #061c19; color: #f3f4ed; }
.brand { position: absolute; left: 88px; top: 60px; height: 40px; display: flex; align-items: center; gap: 18px; font-size: 26px; font-weight: 600; }
.brand-mark { width: 60px; height: 24px; border: 5px solid #01a982; }
.chapter { position: absolute; right: 88px; top: 67px; max-width: 1200px; font-size: 23px; text-align: right; }
.evidence { position: absolute; left: 64px; top: 165px; width: 1168px; height: 710px; overflow: hidden; background: #061c19; color: #f3f4ed; transform-origin: top left; }
.shot { position: absolute; inset: 0; overflow: hidden; opacity: 0; }
.camera { position: relative; width: 1168px; height: 710px; transform-origin: top left; }
.camera video { display: block; width: 1168px; height: 710px; object-fit: contain; }
.focus-rect { position: absolute; border: 2px solid #1675ff; outline: 1px solid #fff; background: transparent; border-radius: 0; pointer-events: none; opacity: 0; }
.source-label { position: absolute; left: 0; right: 0; bottom: 0; min-height: 42px; padding: 10px 18px; background: #061c19; color: #f3f4ed; font-size: 21px; font-variant-numeric: tabular-nums; }
.panel { position: absolute; left: 1280px; top: 174px; width: 552px; }
.panel h1 { margin: 0 0 40px; font-size: 40px; line-height: 1.19; font-weight: 600; }
.point { min-height: 110px; margin: 0 0 18px; border-top: 2px solid #d0ded6; padding: 22px 0 0; font-size: 31px; line-height: 1.3; opacity: 0; }
.dark .point { border-color: #3d6d5d; }
.panel .point-number { font-size: 19px; font-weight: 600; margin-bottom: 8px; color: #087657; }
.dark .point-number { color: #3ee6b4; }
.tbd { position: absolute; inset: 0; padding: 90px 72px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; border: 2px solid #3d6d5d; }
.tbd .kicker { font-size: 24px; color: #aec4bc; margin-bottom: 30px; }
.tbd strong { font-size: 100px; font-weight: 600; line-height: 1; margin-bottom: 28px; }
.tbd .label { max-width: 980px; font-size: 34px; line-height: 1.3; }
.tbd .detail { font-size: 24px; color: #aec4bc; margin-top: 24px; }
.status { position: absolute; left: 88px; right: 88px; top: 888px; font-size: 21px; line-height: 1.25; display: flex; justify-content: space-between; gap: 30px; }
.status strong { font-weight: 500; }
.progress { position: absolute; left: 88px; top: 915px; width: 1744px; height: 3px; background: #01a982; transform-origin: left center; }
.boundary { position: absolute; left: 18px; top: 16px; max-width: 1100px; padding: 10px 16px; background: #061c19; color: #f4b942; font-size: 22px; line-height: 1.3; }
```

The brand text ("HPE OpsRamp") and the `/ 15` chapter denominator are
rendered by `scripts/lib/draft-render.mjs`; change them there, once.

## Do not

- Do not add browser chrome, drop shadows, perspective tilt, or an ambient
  orb around footage. (Those belong to the product-in-perspective style in
  `hyperframes-reel-kit`, not to this one.)
- Do not put narration paragraphs on screen. Three conclusions, period.
- Do not tint, speed up, loop, or freeze footage without the label the
  renderer provides (`HELD FRAME`).
- Do not use amber for emphasis, green for highlights, or any color for
  decoration.
- Do not put anything but the status row below y = 907.
