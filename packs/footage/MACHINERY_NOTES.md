# MACHINERY_NOTES — footage pack

Copied 2026-10-03 from
`~/go/src/github.com/hpe-hybrid-cloud/itom-portal-prototype-hyperframes-reel/demo/hpe-opsramp-sdlc-demo/production`
(branch `media/hyperframes-reel-toolkit`; commit and hashes in
`source-receipt.json`). Unchanged copies: `scripts/` (animation-map, build,
capture-product, check, doctor, finish, hf, **inspect-frames.swift**,
narrate, **prepare-focus.mjs**, **prepare-footage.mjs**, render,
run-validation, snapshot, synthesize.py, verify; `lib/` capture,
**draft-render**, project, render-scene, **shots**, speech, timeline),
`tests/` (13 tests asserting the reference story), `package.json`,
`package-lock.json`, `hyperframes.json`, `frame.md`, `assets/vendor/`,
`assets/opsramp.css`.

Reference subject, for study only (remove from a scaffolded project):
`scenes.reference.mjs`, `index.reference.html`, `gitignore.reference`.

**Not executed from here yet.** First spin: `npm ci && npm run doctor`,
`swiftc -O scripts/inspect-frames.swift -o reports/inspect-frames`.

## Must change for a new subject

- `scenes.mjs` (parses `../STORYBOARD_REVIEW.md`; from
  `templates/scenes.skeleton.mjs`): FILM header (900 s master, `-12%`),
  `spoken()` pairs.
- `scripts/lib/shots.mjs` (from `templates/shots.skeleton.mjs`): recordings
  map, actor labels, `sources` EDL, OCR targets, `minimumX`, exclusion
  ranges (hard failures).
- `scripts/lib/speech.mjs` `displayCaption()` mirrors `spoken()`.
- `scripts/lib/draft-render.mjs`: brand text, `/ 15` chapter denominator,
  boundary-label vocabulary.
- `tests/`: named excerpt offsets, 15-scene assumptions, `pending` empty.

## Generic as-is

Encode profile (`fps=30, scale=2560:-2, h264_videotoolbox 12 Mbps`), VFR
`trim` handling, `.partial.mp4` discipline, receipts, OCR crop math
(`scale = min(2.6, .88/w, .68/h)`), `tl.set`-only camera, caption builder
(2×42, ≤6 s), timeline distribution (refuses avg tail > 1.95 s), finish
(loudnorm two-pass) and verify (69 checks).

## Requirements beyond npm

System `/opt/homebrew/bin/ffmpeg` + `ffprobe` (hardware encoder) for
`prepare-footage` / `prepare-focus`; macOS Vision for OCR (non-macOS
fallback: any OCR emitting the documented JSON, or hand-written `box` in
`assets/focus.json`); ≥ 5 GB free disk. Raw recordings live in `<reel>/`
(one level above `production/`) and are never committed.

## Governance hooks not yet present here

No preservation receipt check; hook H5 adds it. Footage never leaves the
machine (hook H1); `HYPERFRAMES_NO_TELEMETRY=1` (hook H2); render only with
approval marker (hook H4); `git add` of media denied (hook H6).

## Pack-local modifications (2026-10-04, spin fixes — machinery no longer verbatim)

- `scripts/doctor.mjs`: same de-reeling patch as the diagram pack (shared file).
- `HYPERFRAMES_SKILLS.lock.json` ADDED (copied from the diagram pack; same
  0.8.62 / 1b8f8a43 pin) — the source reel never had one and doctor requires it.
- `assets/manifest.json` ADDED (fonts ×4 + gsap.min.js, hashed from pack
  contents) — the source reel never had one and doctor requires it.
- `templates/BRIEF.template.md`: added the two internal-media boundary lines
  doctor asserts (`Do not use \`publish\`…`, `terminology and big-picture
  context only`).

## Format reconciliation (2026-10-04, finding 9)

- `templates/scenes.skeleton.mjs` REWRITTEN: parses the canonical /cmo:screenplay
  format (`## S<nn>.` headings, `Slot:`, `Points:`, tag-stripped `Narration:`,
  `Cues:` one-per-point FROM THE MARKDOWN — the hand-kept JS cue array is gone).
  Scene count derives from the file (no hardcoded 15). Contract pinned by
  hooks/tests/test_screenplay_contract.py (drives this file under node).
- `templates/SCREENPLAY.template.md` transformed to the same format; the Scene
  Map table is now human-only (the parsed slot is each scene's `Slot:` line).
- NOTE: a project scaffolded BEFORE this change carries the old parser; re-copy
  the skeleton (done for ~/tmp/cmo-dryrun/launch-reel).

## Interview-driven structure (2026-10-04, finding 11 — owner: "this is basic common sense")

The reference reel's commissioned shape (exactly 15:00, 15 scenes, dark
scenes 01/08/14/15, proposal = scene 14) had leaked into the toolkit as
constants. All removed; everything now derives from the owner's answers:

- master length = the final scene's `Slot:` end (BRIEF length → slots)
- scene count = however many scenes the screenplay has
- theme flips = per-scene `Theme: dark|light` (editorial decision)
- status strips = per-scene `Status:` (e.g. PROPOSED RETURN HANDOFF)
- `verify.mjs`: "fifteen-minute target"/`=== 15` checks replaced with
  brief-length and unique-scene-id checks
- `lib/draft-render.mjs`: `data-duration` and the `/ 15:00` label come
  from FILM.minimumDurationSeconds
- `lib/timeline.mjs`: error text names the actual master; the per-scene
  floor is overridable via FILM.minimumSceneSeconds (default 51.2 — the
  reference's pacing; set it to match the brief)

The /cmo:new length question (10–15 min "proven shape") remains a
SUGGESTION in an interview, which is the correct place for it.

## End-to-end test findings (2026-10-05, throwaway reel ~/tmp/e2e-reel)

A complete film (75 s, 3 scenes, 9 excerpts) was produced through every
stage. Fixed in the pack during the run:

- `scripts/pronunciation.mjs`: faster-whisper 1.2.1 crashes with current
  PyAV; the uvx env is now pinned to python 3.12 + av==13.1.0.
- `scripts/prepare-footage.mjs`: trim-vs-seek is now decided by the PROBE
  (avg vs nominal fps), never by filename — renaming a recording to a
  plain id used to defeat the 'Screen Recording' prefix check and VFR
  excerpts failed their duration check.
- `scripts/lib/draft-render.mjs`: the generated STORYBOARD.md header now
  uses FILM.title and says it is generated (was 'Third-cut assembly').

Still per-reel configuration INSIDE machinery (a project edits these; a
future improvement is moving them into shots.mjs): the `targets` OCR map
and the `minimumX` text-region bound in `scripts/prepare-focus.mjs`, and
the reference-story assertions in `tests/draft.test.mjs` (the e2e reel's
rewritten suite is a worked example of the per-project rewrite).

Session-rooting note: plugin agents (producer etc.) cannot Read outside
the session's working directories — run production sessions rooted IN the
reel directory, or the lead must relay receipt contents inline.
