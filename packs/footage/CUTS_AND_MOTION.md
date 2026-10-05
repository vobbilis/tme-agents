# CUTS_AND_MOTION — the small grammar that makes footage feel edited

Motion in this style is almost entirely *editing* (which excerpt, when) and
almost never *animation*. Two tweens exist in the whole film beyond
dissolves and point fades. Resist adding a third.

## Cut grammar

| Where | What | Numbers |
|---|---|---|
| Film start | Hard cut into scene 01, panel already visible | — |
| Between scenes | Crossfade, both scenes on alternating tracks | `13/30 s`, `power2.inOut`, `immediateRender:false` |
| Between excerpts inside a scene | **Direct cut** (`opacity` set 1/0, no fade) | at the next point's cue time, rounded to 1/30 |
| Last scene | Progress line completes; final frame holds to 900.000 s | master is exactly 27,000 frames |

Never dissolve two dense code/chat views over a sentence the viewer needs
to read; the dissolve belongs after the evidence hold, on a scene boundary.
The reference scene durations (47–74 s) place every dissolve on a chapter
change.

## The one zoom (scene 02, introducing the product)

When a new application first appears, the reference does a single
settle-in: the evidence well starts scaled up to fill the frame
(`scale 1.644, x -64, y -165`), holds 0.6 s, eases to its home position
over 1.1 s (`power2.inOut`), and the brand, chapter and panel fade in at
1.7 s. Use it **once**, when the first real screen appears; everywhere
else the well is in place from frame one.

```js
tl.fromTo('#evidence-s02', {scale: 1.644, x: -64, y: -165}, {scale: 1, x: 0, y: 0, duration: 1.1, ease: 'power2.inOut'}, 0.6);
tl.fromTo('#surface-s02 .brand, #surface-s02 .chapter', {opacity: 0}, {opacity: 1, duration: 0.25}, 1.7);
tl.fromTo('#panel-s02', {opacity: 0}, {opacity: 1, duration: 0.25}, 1.7);
```

## Inside the well

- **Camera is set, never tweened.** `tl.set('#camera-<shot>', {scale, x, y}, start)`.
  A test asserts no `tl.to('#camera-` exists. When the subject moves off,
  cut to a new excerpt; do not pan.
- **Excerpts play at 1x, muted.** `<video muted playsinline preload="metadata">`
  with `data-start`, `data-duration`, `data-media-start="0"`. Hyperframes
  schedules them; nothing in the composition seeks.
- **Hold** only via `holdLastFrame` + the HELD FRAME label (see
  FOOTAGE_GUIDE §3).
- **No rectangles** by default (FOOTAGE_GUIDE §6).

## The right panel

- Title present from the first frame.
- Each point: `fromTo opacity 0 → 1, 0.35 s` at `cueTime + 0.35`.
  Reveal order equals narration order; the number badges read 01 02 03.
- Nothing else in the panel moves. No slide-in, no count-up, no re-flow.

## Progress and status

- Progress line: `scaleX 0 → 1`, `ease: 'none'`, over the scene duration
  (not the film) — it restarts every chapter and is the only continuous
  motion in frame.
- Status row text is static per scene (`mm:ss / 15:00` is the scene start).

## Choreography checklist per scene (what the build encodes)

```
start                  evidence well visible, shot 0 playing, title visible, 0 points
cue(point 1)+0.35      point 01 fades in  ──┐ same moment
cue(point 2)           cut to shot 1       ──┘ (cut is at the cue; the fade lands 0.35 s later)
cue(point 2)+0.35      point 02 fades in
cue(point 3)           cut to shot 2
cue(point 3)+0.35      point 03 fades in
end − 13/30            next scene begins crossfading in
```

Because cuts are derived from the voice, the only way to move a cut is to
move the cue phrase or the words before it. That is deliberate.

## Motion do-nots

- No pans, pushes, Ken Burns, or follow-cam on footage.
- No pulsing, bouncing, spinning, or glow on anything.
- No transition longer than two seconds; no wipes, slides, or zoom
  transitions between scenes.
- No loop of a short clip to imply activity.
- No speed changes. Ever.
- No re-timing of generated HTML by hand; every number above comes from
  `scripts/lib/draft-render.mjs`, `timeline.mjs`, and `shots.mjs`.
