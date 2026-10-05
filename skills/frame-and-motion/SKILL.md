---
name: frame-and-motion
description: The visual system shared by all cmo-plugin reels — the 15 brand tokens, HPE Graphik, the three frame anatomies (diagram stage, evidence well + panel, explainer content box), colour grammar (green structure, amber boundary/question, mint evidence, blue human authority), cut grammar, the few permitted motions and the motion do-nots. Load before writing CSS, laying out a diagram, placing text, choosing a transition, or reviewing snapshots. Encodes lessons 28–31.
---

# frame-and-motion

One palette, one typeface, three frames. The form decides the frame; the
brand never changes. Each pack's `STYLE_FRAME.md` and `CUTS_AND_MOTION.md`
hold the exact CSS and numbers; this skill holds the grammar so you choose
correctly and recognise drift.

## 1. Tokens (every reel; copy into `frame.md` / `palette()`)

| Token | Value | Role |
|---|---|---|
| forest | `#061C19` (explainer `#071f23`) | dark surface — major ideas, act boundaries, the evidence well |
| forestRaised / panel | `#123A2E` / `#102e32` | raised panels on dark |
| forestBorder | `#3D6D5D` | rules on dark |
| green | `#01A982` | HPE brand: the active relationship (diagram), frame structure only (footage), headline line two (explainer) |
| greenBright / mint | `#3EE6B4` / `#58e7ba` | traces and point numbers on dark; connected evidence (explainer) |
| greenInk | `#087657` / `#00785d` | green text on light |
| warmCanvas / ivory | `#F3F4ED` / `#f3f2eb` | light surface — explanation, working scenes |
| paper | `#FFFFFF` | cards on light |
| ink | `#163A2D` / `#14312e` | text on light |
| darkMuted / lightMuted | `#AEC4BC` / `#577066` | secondary text |
| paleBorder, mist | `#D0DED6`, `#DFE6E1` | rules on light |
| amber | `#F4B942` (explainer `#ffc875` dark / `#a65516` light) | a real boundary, risk or **question** — never decoration |
| blue (explainer only) | `#a8ccff` dark / `#24549b` light | human ownership and authority |

Footage adds two colours that exist only for the normally disabled highlight
rectangle (`#1675ff`, `#e23b35`). Nothing else is blue or red there.
Contrast gates: connectors ≥ 3:1, semantic text ≥ 4.5:1.

**Typography.** HPE Graphik only: display 600/700 (diagram, footage) or 500
with −2.5 tracking (explainer); body 400/500; data 500/600 tabular. Sentence
case. Labels: 16 px tracked caps. Fonts ship inside each pack's
`assets/fonts/`, embedded or `@font-face`d locally, **never from the
network**, never in public source or hosted assets (internal licence; copy
of record `app/public/fonts/` @ `5c90c52`).

## 2. Colour is grammar (lesson 29)

- **Green** marks the one relationship being explained (diagram), or the
  frame's own structure — brand mark, point numbers, progress (footage). It
  never highlights footage and never means "success".
- **Amber** marks a genuine boundary, risk or question. If everything is
  amber, nothing is. It never means "confirmed problem".
- **Mint** (explainer) is connected evidence, never safety.
- **Blue** (explainer) is a human. Agents never wear it.
- **Theme flips are act punctuation.** Dark for major ideas, openers,
  recaps, handoffs, proposal, close; light for mechanics and working scenes.
  Flip only where the argument turns, never inside a scene.
- **Footage keeps its own colours.** No tint, vignette, blur or chrome.

## 3. The three frames (1920×1080 @ 30 fps; 88 px edge; captions below y 907)

**Diagram (Hyperframes).** Header: brand lockup left, `NN / 20 · name`
right. Diagram head: eyebrow kicker, word-by-word scene title, one support
line, short green rule. **Stage `left 88, top 268, 1744 × 632`** with zones →
SVG edges → nodes/text. Thin live progress line. Dark scenes: `ambient-grid`
+ one `ambient-orb`. Vocabulary: `node`, `zone`, `text`, `edge`, `row`,
`beat`, cursor moment.

**Footage (Hyperframes).** **Evidence well `left 64, top 165, 1168 × 710`**,
forest even on light scenes, `<video object-fit: contain>` behind one fixed
`scale/x/y` camera; source strip pinned at the bottom (21 px); optional amber
boundary label top-left. **Panel `left 1280, top 174, w 552`**: title
40 px/600, three points 31 px with 19 px number badges, each fading in on its
cue. Status row `top 888`; progress `top 915, 1744 × 3`. Pending slate for
agreed missing recordings only.

**Explainer (vector plates).** The SVG is the frame. Content inside
**x 86–1838, y 42–951**; act label + two-line headline from x 104 (y ≈ 265 /
351, 64 px); diagram region of cards (126–150 tall), ribbons, 3 px
connectors, 48 px line icons; optional recurring record at `104, 775,
1712 × 112`; footnote at y 874; captions y 965–1064. Every `<text>` carries
`data-fit`; the builder fails on bounds, overlap > 4 px, missing fonts, or
< 12 px caption clearance.

## 4. Cut grammar (lesson 30)

| Where | Diagram | Footage | Explainer |
|---|---|---|---|
| Film start | hard cut | hard cut, panel visible | hard cut, voice at 0.40 s |
| Scene/chapter boundary | 0.44 s crossfade (13/30), one type for the film | 0.44 s crossfade, alternating tracks | 10-frame dissolve, midpoint on chapter start |
| Inside a scene | word-cued reveals (`waterfall-entry`, edge traces) | **direct cut** between excerpts at the cue time | 10-frame dissolve to the next state, midpoint on the cue |
| First product appearance | — | one settle-in zoom: scale 1.644 → 1 over 1.1 s at 0.6 s; brand/panel fade at 1.7 s | — |
| Close | ledger frame, hold | progress completes, hold to 900.000 s | time-derived vector motion ≤ 12 s, 1.2 s tail |

Floors: diagram scene ≥ 8 s (`poster` at 4 s); footage scene ≈ 50–74 s;
explainer state ≥ 1 s + dissolve.

## 5. The only permitted motions

- **Reveals in step with narration**: staged entrances, edge traces that
  dash-draw then fade in the arrowhead, point fades (0.35 s), state
  dissolves.
- **One anchor-object focus trace** each time the anchor returns (diagram).
- **One `beat` glow** per scene on the consequence phrase (diagram, ≤ 2).
- **One settle-in zoom** when the product first appears (footage).
- **Progress line** `scaleX 0 → 1`, linear, per scene (diagram, footage).
- **The animated close** (explainer): pure function of time, eased, seek-safe.

## 6. Motion do-nots (all forms)

No pans, pushes, Ken Burns, follow-cam. No parallax, camera shake, spring
physics. No pulsing, bouncing, spinning, glow on text, shadows, perspective
tilt (that is the toolkit film's product-in-perspective style, a different
pack). No loops implying activity. No speed changes, ever. No transition
over 2 s; no wipes, slides, zoom transitions. No motion on body text. No
two unrelated items on one cue. No camera `tl.to` on footage. No motion at
all in explainer chapters 1–9. Motion follows meaning; it never fills
silence.

## 7. Review a snapshot in ten seconds

1. Anything outside the 88 px edge or inside the caption band? Fail.
2. More than one accent colour carrying meaning? Fail.
3. Narration paragraph on screen? Fail.
4. Amber used for emphasis, green for highlight? Fail.
5. Can the smallest label be read at presentation size? If not, split the
   frame.
6. Is the anchor object / recurring record where it was last scene? If not,
   drift.
