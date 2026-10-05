# CUTS_AND_MOTION — progressive states, ten-frame dissolves, one animated close

Motion in this form is *revelation*, not animation. Chapters 1–9 are forty
still plates joined by short dissolves. Only the last chapter moves, and it
moves deterministically from one time value.

## Cut grammar

| Where | What | Numbers |
|---|---|---|
| Film start | Hard cut to chapter 1 state 0 | voice begins at 0.40 s |
| State → next state (same chapter) | **Reveal dissolve** | 10 frames, midpoint on the cue frame |
| Chapter → chapter | **Chapter dissolve** (theme may flip) | 10 frames, midpoint on the chapter start |
| Last chapter | time-derived vector motion, then a quiet hold | ≤ 12 s total, 1.2 s tail |

`timing.mjs` derives all of it: `transitions[]` from the phase starts,
`pictureSegments()` partitions every frame into `hold`, `dissolve` or
`animation` with no gaps or overlaps (a test asserts the partition sums to
the frame count). `finish.mjs` encodes holds as looped PNGs and dissolves as
a linear `blend` of the two plates, so a dissolve is bit-reproducible.

## Why dissolves, not cuts, between states

Unchanged parts of the diagram keep their coordinates, so a dissolve reads
as "something was added here" and the eye stays where it was. A hard cut
between two nearly identical plates reads as a flicker. Keep dissolves short
(⅓ s); the new state must be fully present as its explanation starts.

## Dark ↔ ivory

Theme changes happen only at chapter boundaries and only where the argument
turns (reference: dark 1, 3, 5, 6, 8, 10; ivory 2, 4, 7, 9). The chapter
dissolve carries the flip. Never flip inside a chapter.

## The one animated close (`closing-motion.mjs`, `render-closing.mjs`)

Pure function of time, no clock, no CSS animation, no randomness, no
framework: `closingState(t, scene) → {phase, shift, flow, hero}` with each
progress eased 0→1 inside a window that starts on its cue. The reference:

| Cue | Motion | Window |
|---|---|---|
| "Shift security left" | the amber Security marker eases 1,300 px left to Design and becomes mint; a path records where it went | 0.616 s |
| "and build it into" | a mint line connects all five pipeline stages | 0.294 s |
| "the way you develop" | the title settles by four font-size pixels; the payoff "Security. Built in." fades in | 0.4 s |

Windows are `min(preferred, 0.42 × interval)`, so wording changes shorten the
motion rather than overrunning the cue. `render-closing.mjs` draws every
changing pose through Playwright, runs the same bounds/overlap/font checks
on each, samples 17 reference frames (opening, five per window, final hold),
proves seek-safety by redrawing an earlier time after the end and comparing
bytes, and pipes PNGs into FFmpeg. Stage labels stay fixed; only the marker
moves. The close must stay 6–12 s.

## Motion do-nots

- No motion in chapters 1–9. If a chapter "needs" animation, it needs a
  fifth state or a split.
- No camera moves, zooms, pans, parallax, springs, pulses, glows, spinners.
- No morphing between chapters. "The orbit unrolls into the sequence" is
  storyboard language for continuity of position, implemented as a dissolve.
- No closing card with process lists or ownership recaps; the earlier
  chapters already said it.
- No typing effects, cursor theatre, or progress bars that imply a run.
