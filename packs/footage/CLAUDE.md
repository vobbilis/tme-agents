# Reel production instructions — "evidence reel" style (exposition + live demo)

> **Bundled machinery (cmo-plugin, 2026-10-03).** This pack now ships the
> reference production's `scripts/` (incl. `prepare-footage.mjs`,
> `prepare-focus.mjs`, `inspect-frames.swift`), `tests/`, `package.json`,
> `package-lock.json`, `hyperframes.json`, `frame.md`, `assets/vendor`,
> `assets/opsramp.css` in `machinery/`; `scenes.reference.mjs` and
> `index.reference.html` are the reference subject for study. Where the Setup
> section below says `cp -R $SRC/...` from the hyperframes-reel repo, copy from
> `machinery/` instead. `source-receipt.json` records the worktree, commit and
> hashes the copy was taken from. `/cmo:new` does this copy for you.

You are producing a narrated Hyperframes reel in the exact style of the OpsRamp
AI-first SDLC evidence reel (third cut, 2026-10-01, 15:00, engineering
leadership audience). The form: a senior-architect narrator carries an
exposition; real screen recordings play in the left two-thirds of every frame
as the proof; the right third shows a heading and at most three short
conclusions, each revealed on the phrase that earns it. The subject changes;
the craft, brand, pipeline, and governance do not.

Read these companions in this directory before writing anything:

- `STORY_STRUCTURE.md` — the exposition-with-evidence arc and its rules.
- `STYLE_FRAME.md` — colors, HPE Graphik, the evidence/panel frame anatomy,
  labels, and the exact CSS.
- `FOOTAGE_GUIDE.md` — recording, registering, cutting, cropping, and
  labelling real screen footage. This is what distinguishes the style.
- `NARRATION_GUIDE.md` — voice, tone, sentence shapes, cue rules, timing math.
- `CUTS_AND_MOTION.md` — cut grammar, the one zoom, dissolves, reveals.
- `PROCESS.md` — commands, gates, governance, deliverables.
- `templates/` — SCREENPLAY, BRIEF, EVIDENCE_REGISTER, `scenes.skeleton.mjs`,
  `shots.skeleton.mjs`, `inspect-frames.swift` (the OCR helper), `gitignore`.
- `assets/` — the four HPE Graphik OTFs and the exact `opsramp.css`.

If the story has no recordings, stop: use the architecture-journey pack
(`demo/onprem-reel-style-pack`) instead. That style draws diagrams; this one
plays footage. Do not mix them in one reel.

## The two architectural facts that matter

1. **The screenplay is the single source of truth, and `scenes.mjs` parses
   it.** `STORYBOARD_REVIEW.md` holds, per scene, a `### NN. Title` heading,
   a `**Left screen:**` direction, a `**Right panel:**` line with three
   slash-separated points, an optional `**Highlight:**`, and the narration as
   a `> ` blockquote. A scene-map table supplies provisional slots.
   `scenes.mjs` reads those, attaches the cue phrase for each point, and
   applies spoken substitutions. `npm run build` regenerates STORYBOARD.md,
   SCRIPT.md, `compositions/*.html`, and `index.html`. Never edit a
   generated file; never let the screenplay and `scenes.mjs` overrides drift.
2. **Measured speech sets the scene boundaries inside a fixed master.** The
   master is exactly 900 s (27,000 frames). Each scene gets its narration
   length plus an equal share of whatever time remains; the build refuses
   when the average silent tail would exceed ~2 s ("Narration pace leaves
   long silent tails"). Fix the words or the reading rate, never pad with
   silence, never hand-set durations.

## Studio folder layout (copy this shape)

```
<reel>/                                # one folder per film
  analysis.mov  deliver.mov  ...       # raw recordings: never committed, never uploaded
  STORYBOARD_REVIEW.md                 # the screenplay (source of truth)
  EVIDENCE_REGISTER.md                 # what each recording shows / does not establish
  production/                          # the Hyperframes project
    BRIEF.md  frame.md  scenes.mjs  index.html  hyperframes.json
    scripts/  tests/  assets/opsramp.css  assets/fonts/  assets/vendor/
    assets/audio/  assets/footage/  reports/  renders/  snapshots/   # generated, gitignored
```

The footage scripts resolve recordings as `production/../<name>.mov`. Keep
raw recordings one level above the project and out of git (see
`templates/gitignore`).

## Setup (once)

1. Copy the machinery from the reference project — not its subject:
   ```bash
   SRC=demo/hpe-opsramp-sdlc-demo/production      # in the hyperframes-reel repo
   mkdir -p <reel>/production && cd <reel>/production
   cp -R $SRC/scripts $SRC/tests $SRC/package.json $SRC/package-lock.json \
         $SRC/hyperframes.json $SRC/frame.md .
   mkdir -p assets && cp -R $SRC/assets/opsramp.css $SRC/assets/vendor assets/
   cp -R <this-pack>/assets/fonts assets/fonts          # HPE Graphik OTFs ship in THIS pack
   cp <this-pack>/templates/gitignore .gitignore
   npm ci && npm run doctor
   swiftc -O scripts/inspect-frames.swift -o reports/inspect-frames   # macOS Vision OCR
   ```
   Then replace `scenes.mjs`, `scripts/lib/shots.mjs` (sources map + focus
   targets) and `tests/draft.test.mjs` with yours from `templates/`. The
   reference `tests/` assert the reference story (fifteen scenes, named
   excerpt offsets); keep the shape, rewrite the assertions.
2. Pins are part of the style: `hyperframes@0.8.62`, registry commit
   `1b8f8a43d43bc2456075215b066b23e11d821435` (in `hyperframes.json`),
   `edge-tts==7.2.8`, `@ffmpeg-installer/ffmpeg@1.1.0`. Do not upgrade
   mid-production.
3. `HYPERFRAMES_NO_TELEMETRY=1` on every Hyperframes command. Never use
   `publish` or hosted/cloud rendering for internal footage.
4. `prepare-footage` and `prepare-focus` call the system
   `/opt/homebrew/bin/ffmpeg` (hardware `h264_videotoolbox`); `finish` and
   `verify` use the npm-installed binaries. Both must be present.

## Production phases (each ends at a human gate — do not skip ahead)

0. **EVIDENCE INTAKE** (`templates/EVIDENCE_REGISTER.template.md`). Probe
   every recording (duration, resolution, fps, codec), note who and what it
   shows, what it does NOT establish, and the exclusion ranges (lock screens,
   unrelated chat, credentials). GATE: owner confirms actors, chronology,
   and the redaction list.
1. **BRIEF** (`templates/BRIEF.template.md` → `production/BRIEF.md`).
   Audience, message, the operating idea the reel opens and closes on, the
   case it follows, the claim boundary, the invitation it ends with. GATE:
   owner approves message and arc.
2. **SCREENPLAY** (`templates/SCREENPLAY.template.md` →
   `STORYBOARD_REVIEW.md`). Every scene: left-screen direction, three
   right-panel conclusions, highlight (default none), full narration. GATE:
   owner reads every line; every claim traces to the register or the
   owner's confirmed account; owner approves the script text for Edge TTS
   (speech synthesis is an external service — the text leaves the machine;
   the footage never does).
3. **SOURCE CUTS** (`templates/shots.skeleton.mjs` →
   `scripts/lib/shots.mjs`). One excerpt per right-panel point: recording,
   start second, hold flag, optional cue override; plus the OCR focus
   targets that choose the crop. `npm run narrate` first (cuts are split at
   measured cue times), then `node scripts/prepare-footage.mjs` and
   `node scripts/prepare-focus.mjs`. GATE: owner looks at the crop frames in
   `reports/focus-tracking/<shot>/` and answers one question per shot: "is
   the thing the narrator is talking about readable and in frame?"
4. **BUILD + TEST**: `npm run build` then `npm test`. Read the durations
   back; a scene whose tail is near 2 s or a cue that resolves twice is a
   story bug, not a tooling bug.
5. **CHECK + SNAPSHOT + PREVIEW**: `npm run check` (lint, runtime, layout,
   caption zone, frame check — all must pass), `npm run snapshot`, then
   `npm run preview` and open http://localhost:3017/ for the owner. Studio
   audio was unreliable on the reference run; if the owner authorizes it,
   render a review MP4 (phase 6) rather than trusting Studio playback.
6. **RENDER + FINISH + VERIFY**: `npm run render:base -- --approved`,
   `npm run finish`, `npm run verify`. Every cut gets a new `FILM.id`
   (`...-third-cut`); never overwrite an approved render.
7. **HUMAN REVIEW**: a person watches the complete MP4 with sound and
   captions, and a person reviews the full moving footage for redaction.
   Record reviewer, hash, and findings in the handover. Automated checks do
   not approve a film.

## Story rules this style is known for (non-negotiable)

- **Open on the operating idea, then say "let's get into a real, recent
  request."** The model is the main thread; the case is the example. Do not
  open on the ticket, and do not make it a challenge-response pitch.
- **One request, followed through real actors.** Label each recording's
  actor on the source strip ("Engineer 1: ticket preparation"). Recordings
  identify who did what; they do not show a filmed handover between people.
- **The right panel is conclusions, not transcript.** Heading plus at most
  three short points, each revealed on a unique phrase from that scene's own
  narration.
- **Preserve the actual outcome.** A permission-blocked local commit stays
  a permission-blocked local commit. A passing structural harness is not a
  runtime validation. Say what remains where it affects the next decision,
  then continue — no repeated proof disclaimers.
- **The owner's confirmed account is authoritative; footage illustrates.**
  Reference pages supply terminology, never claims. No fabricated telemetry,
  overlays, dashboards, or status.
- **Thread the differentiating idea early.** The reference reel put
  telemetry in the opening and again before minute four, not in a closing
  measurement segment.
- **Close by returning to the opening idea with an invitation**, not a
  call-to-action card and not an acceptance claim.

## Working with the user

Ask one question at a time. Present the screenplay in groups of three to
five scenes, not as one dump. Give a time/cost estimate before narrating
(external TTS) and before rendering (the reference 15:00 render took ~18
minutes at ~25 fps plus finish and verify). Report test and check failures
verbatim. When the owner corrects a line, edit `STORYBOARD_REVIEW.md` and
re-run `narrate` and `build` — the scenes parse the screenplay, so there is
nothing else to patch.
