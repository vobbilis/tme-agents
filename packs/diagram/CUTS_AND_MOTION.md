# CUTS_AND_MOTION — cut grammar, transitions, choreography

## Cut grammar

- **Frame 1 enters on a hard cut** (`transition_in: cut`) — the question hits
  cold, no fade-up.
- **Every other frame enters on a 0.44-second crossfade**
  (`transitionSeconds: 0.44` in the FILM header). One transition type for the
  whole film. Chapter changes are marked by content (eyebrow, chapter-label,
  theme flips), not by transition variety.
- **Theme flips are the act punctuation**: dark → light when moving from a
  major idea to its mechanics; light → dark for the next act opener and for
  recaps. The crossfade over a theme flip reads as a chapter turn.
- `poster: 4.00s` — each frame must be composed enough at 4 seconds to serve
  as its chapter thumbnail.
- Floors: `minimumSceneSeconds: 8`; set `minimumDurationSeconds` to your
  brief's target. The film's pace comes from narration length per frame, not
  from faster cuts: reference range 22–81s per frame.
- MP4 chapters are generated per frame (`chapter:` field) — chapter titles are
  audience-facing; write them as the storyboard's frame names.

## In-frame choreography: cues and beats

The style's signature: **nothing moves except in step with the narration.**

- Every diagram item can carry `cue: '<phrase>'` — an exact phrase from that
  scene's own `vo`. The item enters when the narrator says the phrase (via
  the TTS word timings). `cue: null` = on screen from the first frame.
- Write cues on distinctive phrases (3+ words, unique within the scene).
  After `npm run build`, run `npm run animation-map` to see the resolved
  timeline; an unresolved cue is a build error you must fix, not ignore.
- `beat(cue, act, targets, {hold})` adds a synchronized accent across several
  items — e.g. `beat('and the proof', 'glow', ['p1','p2','p3'], {hold: 2.2})`
  glows all three pillars as the narrator lands the phrase. Use ≤1–2 beats
  per scene, on the line's consequence moment.

## Entrance and accent vocabulary (the only moves)

- `waterfall-entry` — staged card/text entrances, top-to-bottom, per cue.
- Edge traces — SVG lines dash-draw from source to target; the arrowhead
  fades in only when the trace completes. A relationship is TRACED, never
  popped.
- `ambient-glow-bloom` — the dark-scene orb breathes once behind a major
  statement.
- Border traces / focus glow — the accent for "look here now" (the recurring
  anchor object gets this each time it returns).
- Cursor moments — `{ type: 'cursor', x, y, cue, delay }` for the rare
  literal-action beat ("a single click"). At most one per film act.
- Holds are allowed and encouraged after a dense diagram completes; the
  `scene-progress` line keeps a long hold visibly alive.

## Motion do-nots

- Motion follows meaning; it never fills silence.
- No parallax, no camera shake, no spring physics, no per-frame novelty
  transitions, no motion on body text.
- Never reveal two unrelated items on the same cue — if they share a cue,
  they are one idea.
- If a scene has more than ~8 timed reveals, split the scene.

## The anchor-object pattern (what makes it feel like one film)

Pick ONE diagram object that embodies the argument (reference reel: the
five-socket contract band). Introduce it with a directive narration line and
a focus trace. Re-enter it, visually identical, in every act — including on
the light-theme mechanics frames and the closing ledger. Its recurrence IS
the through-line; protect its geometry and color from scene-to-scene drift.
