# Reel production instructions — "illustrated explainer" style

You are producing a narrated story reel in the exact style of the OpsRamp
Shift-left SecOps story (cut 5, 2026-09-25, 5:21.5, engineering / security /
architecture leadership audience). The form: an operating model or way of
working, explained through **original vector illustrations that reveal
progressively**, with one clearly labelled hypothetical example followed
across the middle chapters, and a short animated close. No product footage,
no screenshots, no stock imagery, no music. The subject changes; the craft,
brand, pipeline and governance do not.

**This pack does not use Hyperframes.** The owner rejected it for this form.
The pipeline is plain Node scripts: vector SVG → Playwright/Chromium plates →
Edge TTS narration → FFmpeg assembly. Everything runs locally.

Read these companions in this directory before writing anything:

- `STORY_STRUCTURE.md` — the organization-first explainer arc and its rules.
- `STYLE_FRAME.md` — palette, HPE Graphik, the content box, colour grammar,
  the illustration vocabulary.
- `NARRATION_GUIDE.md` — voice, sentence shapes, cue rules, speech-only
  pronunciation hints, the ASR check, timing math.
- `CUTS_AND_MOTION.md` — four states per chapter, ten-frame dissolves, the
  one animated close, motion do-nots.
- `PROCESS.md` — commands, gates, guards, governance, deliverables.
- `templates/` — `SCRIPT.template.md`, `BRIEF.template.md`,
  `story.skeleton.mjs`, `gitignore`.
- `machinery/` — the complete reference pipeline, imports already rewritten
  to be self-contained (`lib/` holds the shared speech, camera, ffmpeg and
  Playwright helpers). Copy it; replace `story.mjs` and `illustrations.mjs`
  with yours.
- `reference/` — the SecOps reel's script, storyboard, screenplay, brief,
  review dispositions, pronunciation review and ten hero SVGs. Study them;
  do not reuse their subject.
- `assets/fonts/` — the four HPE Graphik OTFs (internal licence).

If the story has real recordings, stop: use the footage pack. If it is an
architecture with systems and relationships, use the diagram pack. This pack
explains a **way of working**. Do not mix forms in one film.

## The three architectural facts that matter

1. **`SCRIPT.md` is the single narration source; `story.mjs` parses it.**
   Ten `## N. Title` sections; only `> ` blockquotes are spoken. `story.mjs`
   pairs each section with its act label, two-line headline, four state
   captions and three cue phrases. `STORYBOARD.md` and `SCREENPLAY.md`
   describe the pictures and carry delivered timing, but they are not a
   second editable copy of the words. Never let them drift.
2. **Four picture states per chapter, cut on three word-timed cues.** State 0
   is on screen when the chapter begins; states 1–3 appear when the narrator
   says that chapter's three cue phrases. Each cue must occur exactly once in
   its chapter and in order (`checkScript()` enforces it). Between states, a
   ten-frame dissolve whose midpoint lands on the cue.
3. **Measured speech sets every boundary; guards are code.** Voice starts
   0.40 s into each chapter; 0.65 s tail (1.2 s on the close). The timeline
   throws if the film is outside the brief's window (reference 300–360 s),
   if the animated close is outside 6–12 s, if any state is shorter than one
   second plus a dissolve, or if inputs or prior films have changed since
   `source-receipt.json` was frozen.

## Project layout (copy this shape)

```
<reel>/                            # one folder per film
  BRIEF.md  SCRIPT.md  STORYBOARD.md  SCREENPLAY.md  REVIEW_DISPOSITIONS.md
  PRONUNCIATION_REVIEW.md          # when a hint was needed
  production/                      # = this pack's machinery/, with your story.mjs + illustrations.mjs
    story.mjs illustrations.mjs closing-motion.mjs timing.mjs pronunciation.mjs
    narrate.mjs build-board.mjs render-closing.mjs finish.mjs verify.mjs review.mjs
    production.mjs media.mjs archive-cut.mjs reel.test.mjs transcribe-pronunciation.py
    lib/   assets/fonts/   illustrations/ (generated hero SVGs)   storyboard.html (generated)
    out/                           # generated, gitignored: plates/ audio/ closing/ segments/ MP4 SRT VTT reports
```

## Setup (once)

1. `cp -R <pack>/machinery <reel>/production && cp -R <pack>/assets/fonts <reel>/production/assets/fonts`
2. `cp <pack>/templates/gitignore <reel>/production/.gitignore`
3. Prerequisites: Node ≥ 22, `uvx` (for `edge-tts==7.2.8` and
   `faster-whisper==1.2.1`), `ffmpeg`/`ffprobe` on PATH or `FFMPEG_BIN`,
   `xmllint`, a Chromium (`PLAYWRIGHT_CHROMIUM` or the cached headless shell;
   installed Chrome for the review player's H.264 playback check).
4. Pins are part of the style: `edge-tts==7.2.8`, `faster-whisper==1.2.1`
   (`base.en`, no prompt), Andrew `+2%`, voice offset 0.40 s, ten-frame
   dissolves. A deliberate change goes in BRIEF.md and the handover.
5. Write `out/source-receipt.json` before anything else: hash every input
   (memo, documents) and every prior film the reel must leave untouched.
   `checkPreserved()` runs at the start of every script and refuses to
   continue on any drift. "Rebaseline" is an owner decision, never implicit.

## Production phases (each ends at a human gate — do not skip ahead)

1. **BRIEF** (`templates/BRIEF.template.md`). Audience, the one-sentence
   story, source hierarchy (owner's follow-up > owner's memo > supplied
   documents > prior reels style-only), evidence boundaries, duration window,
   visual direction. GATE: owner approves story and boundaries.
2. **SCRIPT** (`templates/SCRIPT.template.md` → `SCRIPT.md`). Ten sections,
   ~680–760 words for a 5–6 minute film. Mark unconfirmed claims **CHECK**.
   Run `node --test production/reel.test.mjs` for the static cue checks.
   GATE: owner reads every line; every CHECK resolved; **owner approves the
   text for external speech processing** (Edge TTS).
3. **STORYBOARD + ILLUSTRATIONS** (`story.mjs` spec + `illustrations.mjs`
   renderers). One stable diagram per chapter, four progressive states, the
   recurring evidence record where the arc needs one. `node
   production/build-board.mjs` renders 40 plates, validates XML, fonts,
   bounds, text overlap, connector contrast and caption clearance, and writes
   `storyboard.html`. GATE: owner looks at the ten hero frames and says yes
   or no to each.
4. **SCREENPLAY** (`SCREENPLAY.md`). Per state: the narration trigger and the
   picture action, as a table. The screenplay specifies; the storyboard shows.
   GATE: independent reviewer pass (the SecOps reel paused for Sol's review)
   → `REVIEW_DISPOSITIONS.md` rows → owner accepts dispositions.
5. **NARRATE + ASR**: `node production/narrate.mjs` (per-chapter MP3 + word
   boundaries + captions + `timing.json`, cached by fingerprint), then the
   `transcribe-pronunciation.py` diagnostic on every chapter containing a
   product name or acronym. GATE: no mis-hearing; owner listens to the short
   check clip for any corrected term.
6. **ASSEMBLE**: `render-closing.mjs` → `finish.mjs` → `verify.mjs` →
   `review.mjs`. Hard guards on duration, close length, stale inputs, changed
   artwork. Deliverable: MP4 + SRT + VTT + chapters + `review.html`.
7. **HUMAN REVIEW**: a named person watches and listens to the whole film in
   the review player. Record reviewer, hash, what was watched and heard, and
   findings in the handover. Automated checks never approve a film.

## Story rules this style is known for (non-negotiable)

- **Lead with the organizational change, not the mechanism and never an
  audit.** The rejected engineering cut led with repository statistics; the
  approved films lead with how work changes. No PR counts, contributor names,
  test totals, file paths or commands in narration.
- **One clearly hypothetical example carries the middle.** "Imagine a simple
  permissions question … This is a hypothetical example." It is labelled
  on screen (`HYPOTHETICAL · …`) in every state where it appears, and it is
  never resolved into a result the film did not witness.
- **Colour is grammar.** Amber = a question or boundary, never a confirmed
  problem. Mint = connected evidence, never safety. Blue = human authority.
- **Future state is said as future state.** "Intended outcomes", "to be
  measured as the capability matures", "being developed area by area".
  Never a measurement the sources did not supply.
- **Ownership is explicit and early.** Who owns the change, who owns risk;
  revealed before the chapter's concluding sentence so it can be read.
- **Close short.** The reference closing is 7.47 s and fourteen words; the
  guard refuses more than twelve seconds. One motion, one payoff line.
- **Unconfirmed names stay generic.** A transcript heard "glass wing"; the
  film says "shared security harness" until the owner confirms.

## Working with the user

Ask one question at a time. Present the script in groups of three chapters.
Give a cost/length estimate before narrating (external TTS; ~153 words per
minute at +2%) and before assembly (reference: ~2 minutes for plates, under
a minute for the close, ~3 minutes to encode and verify). Report guard
failures in plain English with the fix location. When the owner corrects a
line, edit `SCRIPT.md`, re-run `narrate` (only changed chapters
re-synthesise), then `build-board` if a cue or caption moved, then assemble.
