# PROCESS — pipeline, commands, guards, governance

All commands run from `<reel>/` with the machinery in `production/`.

## Command reference

```bash
node --test production/reel.test.mjs            # static: 10 chapters, 30 ordered unique cues, XML, contrast, guards
node production/build-board.mjs                 # 40 plates (SVG+PNG), 10 hero SVGs, storyboard.html, illustration-report.json
node production/narrate.mjs [--force]           # Edge TTS per chapter → out/audio/*, narration.json, timing.json, SRT, VTT
node production/pronunciation-probe.mjs         # optional: 20 s trial samples for a new speech hint
uvx --from faster-whisper==1.2.1 --python 3.12 python production/transcribe-pronunciation.py \
    --output production/out/pronunciation-review/revised-transcripts.json production/out/audio/<chapters>.mp3
node production/render-closing.mjs              # animated close → out/closing/animation.mp4 + render-report.json (reused if unchanged)
node production/finish.mjs                      # holds + dissolves + close → picture.mp4; voice mix, loudnorm; MP4 with captions + chapters
node production/verify.mjs                      # 139-style encoded-media checks → out/verification-report.json
node production/review.mjs [--generate-only]    # out/review.html + browser playback checks → review-player-report.json
node production/archive-cut.mjs                 # preserve the delivered generation before revising
```

Order on a fresh story: `test → build-board → narrate → (ASR) →
render-closing → finish → verify → review`. `narrate` and `build-board` are
independent of each other but both run `checkPreserved()` first. `finish`
refuses if narration, artwork, timing or the close are stale relative to
the current sources. `review` refuses without a passing, current
verification report.

## Guards (all are code; all throw)

| Guard | Where | Rule |
|---|---|---|
| Preservation | every script | `out/source-receipt.json` hashes of inputs and prior films must match; incomplete receipt is a failure |
| Script shape | `checkScript()` | exactly N chapters, 3 cues + 4 captions each, cues unique and in order |
| Duration | `makeTimeline()` | film within `MIN_DURATION–MAX_DURATION` s (reference 300–360) |
| Close | `makeTimeline()` | animated close 6–12 s; tail ≤ 1.5 s; final state ≥ 1.5 s |
| State length | `makeTimeline()` | every state ≥ 1 s + one dissolve (close: ≥ 0.55 s) |
| Layout | `build-board`, `render-closing` | text inside x 86–1838 / y 42–951; no text overlap > 4 px; fonts ready; ≥ 12 px caption clearance |
| Contrast | `build-board`, tests | connectors ≥ 3:1; semantic text ≥ 4.5:1 |
| No network | `build-board`, `render-closing` | any non-local request aborts and fails the build |
| Stale inputs | `finish`, `verify` | narration fingerprint, artwork fingerprint, timing hash, close hash all current |
| Spoken tokens | `canonicalWords()` | TTS words map 1:1 onto canonical words or the chapter fails |
| Seek safety | `render-closing` | redrawing an earlier time after the end yields identical bytes |

## Phase gates (a human signs each)

| # | Phase | Artifact | Gate |
|---|---|---|---|
| 1 | Brief | `BRIEF.md` | owner approves story sentence, audience, source hierarchy, boundaries, window |
| 2 | Script | `SCRIPT.md` | owner reads every line; all **CHECK** resolved; **text approved for Edge TTS** |
| 3 | Board | `storyboard.html`, `illustrations/*.svg` | owner says yes/no to each of the ten hero frames |
| 4 | Screenplay + review | `SCREENPLAY.md`, `REVIEW_DISPOSITIONS.md` | independent reviewer's findings each have a disposition the owner accepts |
| 5 | Narration | `out/narration.json`, ASR report | no mis-hearing of product terms; owner listens to the check clip for any corrected term |
| 6 | Assembly | MP4, SRT, VTT, `verification-report.json`, `review.html` | all checks pass; review player plays with captions in Chrome |
| 7 | Human review | handover | named reviewer watched and listened to the whole film; hash recorded |

## Iterate only the affected stages

| Changed | Re-run |
|---|---|
| Narration words | test → narrate (changed chapters only) → render-closing (if close timing moved) → finish → verify → review |
| A cue phrase or caption | test → build-board → narrate (timing) → finish → … |
| Illustration geometry | build-board → finish → verify → review |
| Close choreography | render-closing → finish → verify → review |
| A speech hint | bump `PRONUNCIATION_VERSION` → narrate → ASR → finish → … |
| Nothing but approval | review (player) → handover |

Before revising a delivered cut: `archive-cut.mjs`, then bump `VERSION` in
`story.mjs`. Never overwrite a delivered generation.

## Governance (fixed for internal HPE material)

- No Hyperframes, no telemetry, no publish, no cloud render. Local only.
- Inputs (memo, documents) are hashed into the receipt and never copied into
  a public artifact. Only approved narration text goes to Edge TTS.
- Fonts are internal-licence: embedded from `assets/fonts/`, never fetched,
  never committed to a non-internal remote.
- Pins: `edge-tts==7.2.8`, `faster-whisper==1.2.1` + `base.en`, Andrew
  `+2%`, offset 0.40 s, ten-frame dissolves. Changes go in BRIEF.md and the
  handover.
- `out/` is gitignored; the project source may be committed to an internal
  branch; generated media never.
- Every report carries `perceptualReview: {watched: false, listened: false}`
  until a human line replaces it. Technical passes never become "approved".

## Delivery target

H.264 1920×1080 @ 30 fps, BT.709, CRF 18 `stillimage` tune; AAC stereo
48 kHz 192 kb/s; two-pass `loudnorm I=-16:TP=-1.8:LRA=7` (reference measured
−16.01 LUFS / −1.77 dBTP after encoding); selectable English `mov_text` +
SRT + VTT; chapters from chapter starts; exact frame count; full decode in
verify; 40 state identities + 17 close samples matched in the encoded
master; no burned-in subtitles.

## Deliverables

`out/<name>.mp4`, `out/<name>.srt`, `out/<name>.vtt`, `out/review.html`,
`out/closing/ending-preview.mp4`, `out/verification-report.json`,
`out/review-player-report.json`, `out/render-report.json`,
`out/illustration-report.json`, `storyboard.html`, and a handover stating:
source receipt, script hash, cut version, which checks passed, pronunciation
diagnostic scope, who watched and listened and when, known limits.
