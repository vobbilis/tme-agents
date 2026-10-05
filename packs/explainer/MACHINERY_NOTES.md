# MACHINERY_NOTES — what was copied, what was rewritten, what must be adapted

Copied 2026-10-03 from
`~/go/src/github.com/hpe-hybrid-cloud/itom-portal-prototype-ai-first-reel`
(branch `media/ai-first-sdlc-auditor-reel`, commit in `source-receipt.json`):
`demo/secops-ai-first-reel/*.mjs|*.py` → `machinery/`;
`demo/ai-first-sdlc-reel/{speech,tools,camera,narrator}.mjs`,
`synthesize.py` and `scripts/playwright-resolve.mjs` → `machinery/lib/`.
Every file passes `node --check` / `py_compile`. **Nothing has been executed
from this location yet.**

## Rewrites applied (sed, verified by grep)

| Was | Now | Files |
|---|---|---|
| `'../ai-first-sdlc-reel/<x>.mjs'` | `'./lib/<x>.mjs'` | story, timing, pronunciation, narrate, build-board, render-closing, finish, verify, review, media, pronunciation-probe, reel.test |
| `resolve(DIR, '../ai-first-sdlc-reel/synthesize.py')` | `resolve(DIR, 'lib/synthesize.py')` | narrate, pronunciation-probe |
| `` resolve(REPO, `app/public/fonts/HPEGraphik-${w}.otf`) `` | `` resolve(DIR, `assets/fonts/…`) `` | build-board, render-closing |
| `resolve(REPO, 'app/public/fonts/HPEGraphik-Regular.otf')` (+Medium) | `resolve(DIR, 'assets/fonts/…')` | review |
| `resolve(HERE, '../../scripts/playwright-resolve.mjs')` | `resolve(HERE, 'playwright-resolve.mjs')` | lib/camera |

`DIR` in every script is the directory of `story.mjs` (= `production/` once
scaffolded). Fonts are therefore expected at `production/assets/fonts/`
(Regular, Medium, Bold are read; Semibold ships too).

## Still reel-specific — must change for a new subject

| File | What is SecOps-specific | Replace with |
|---|---|---|
| `story.mjs` | NAME, TITLE, VERSION, ten-entry `spec` (ids, acts, headlines, captions, cues), `SOURCES` (memo at `../Rue Mirassou 9.m4a`, HTML in `~/Downloads`), `PRESERVED` (three worktree-B films), reads `SCRIPT.md` from `DIR` | `templates/story.skeleton.mjs` (reads `SCRIPT.md` from `REEL = DIR/..`) |
| `illustrations.mjs` | all ten renderer functions draw the SecOps diagrams; `evidenceRecord` text; `renderers` array order; `security-marker`, `pipeline-stage`, `closing-payoff` ids in `closing()` | keep the helpers (§ "Illustration vocabulary" in STYLE_FRAME.md); rewrite the renderers |
| `closing-motion.mjs` | window ids `shift-left`, `connect-pipeline`, `resolve-title`; preferred durations 1.05 / .75 / .4; `CLOSING_MOTION_VERSION` | your close's motions; bump the version |
| `render-closing.mjs` | asserts `scene.animation === 'shift-left'`; reads `#security-marker[data-x]`, `.pipeline-stage[data-stage][data-lit]`, `#closing-payoff` | your animation name and element ids |
| `verify.mjs` | checks for marker x = 1610 → 310, five lit stages, `Seck-ops`/`Ops Ramp` aliases, 13 record states in chapters 04-3…07, "secretary" absent, exact SecOps phrases, `TITLE` | rewrite the subject checks; keep the structural ones (hashes, decode, captions, chapters, loudness) |
| `reel.test.mjs` | `WORD_COUNT === 682`, SecOps phrases, record id, closing text, 17 samples, 36 holds/dissolves | rewrite assertions to your story; keep the shape |
| `build-board.mjs` | storyboard page copy (title, intro, status line, notice), caption-probe sentence, `evidence-record` lookup | your copy; a representative two-line caption |
| `review.mjs` | page header, notes paragraphs, `plates/01-question-3.png` poster, "ten chapters" | your copy and first plate |
| `finish.mjs` | ffmetadata `title=… — HPE OpsRamp AI-First Security`, `comment=…` | your title and comment |
| `archive-cut.mjs` | `/^secops-story-cut-\d+$/` version guard | your VERSION pattern |
| `pronunciation.mjs` | `PRONUNCIATIONS` (AI, SecOps, OpsRamp, SDLC, API, HPE), `PRONUNCIATION_VERSION` | your terms; bump the version |
| `timing.mjs` | `checkScript` requires exactly **10** chapters, 3 cues + 4 captions each | change the 10 if your arc differs (the guards assume the 4-state model) |
| `narrate.mjs`, `production.mjs`, `media.mjs`, `transcribe-pronunciation.py`, `pronunciation-probe.mjs` (sentence text aside), `lib/*` | generic | none |

`lib/tools.mjs` still defines `OUT`/`PREVIOUS_OUT`/`RECORDINGS_DIR` for the
engineering reel and Twin-specific helpers (`assertCleanPrivateCapture`,
scene-mark detection); only `durationOf`, `ffmpeg`, `parseCaptions` are
used here. `lib/camera.mjs` keeps `setupTwin`/`navigateTwin`/`startLesson`
(unused). Harmless; prune when convenient.

## Known inconsistencies to resolve during the first spin

1. **Receipt shape.** `checkPreserved()` wants `out/source-receipt.json` =
   `{ files: [{id, path, sha256}, …] }` with exactly `SOURCES.length +
   PRESERVED.length` entries. `/cmo:new` writes an empty `files`; every
   script will throw `Incomplete preservation receipt` until `/cmo:brief`
   fills it. Intended, but the message should be translated for the owner:
   "No inputs are registered yet. Run /cmo:brief first."
2. **Where the markdown lives.** The skeleton `story.mjs` reads `SCRIPT.md`
   from `<reel>/`; `archive-cut.mjs` archives `*.md` from `production/`
   (`DIR`). Decide one home (recommend `<reel>/`, and point archive-cut at
   `REEL`).
3. **Caption probe text** in `build-board.mjs` is a SecOps sentence; the
   clearance check is only as good as the longest real caption. Generate the
   probe from the longest caption in `timing.json` when it exists.
4. **`checkScript` chapter count** is hard-coded to 10.
5. **No `package.json`** — the reference ran with the repo's root Node deps
   (Playwright available via `playwright-resolve.mjs` candidates). A
   scaffolded project needs Playwright resolvable: `PLAYWRIGHT_MODULE` /
   `PLAYWRIGHT_CHROMIUM` env, or a local `npm i playwright-core` (unpinned —
   decide and pin in build step 2).
6. **`xmllint`** is required by `build-board.mjs` and the tests (macOS ships
   it; Linux may not).
7. `reference/illustrations/*.svg` embed fonts as base64 (≈ 470 KB each);
   that is why the pack is 5.4 MB. They are study material only.

## Commands as the reference ran them (from `reference/README.md`)

```bash
node --test demo/secops-ai-first-reel/reel.test.mjs
node demo/secops-ai-first-reel/build-board.mjs
node demo/secops-ai-first-reel/narrate.mjs
node demo/secops-ai-first-reel/render-closing.mjs
node demo/secops-ai-first-reel/finish.mjs
uvx --offline --from faster-whisper==1.2.1 --python 3.12 python demo/secops-ai-first-reel/transcribe-pronunciation.py \
  --output demo/secops-ai-first-reel/out/pronunciation-review/revised-transcripts.json <chapter mp3s>
node demo/secops-ai-first-reel/verify.mjs
node demo/secops-ai-first-reel/review.mjs
```

Reference results to compare against after a faithful re-run: 5:21.5 /
9,645 frames, 682 words, 40 states, 36 dissolves, 97 captions, 139 verify
checks, 15 tests, 11 review-player checks, −16.01 LUFS / −1.77 dBTP, master
SHA-256 `0120639fbdc576affc8ce3378a9f300259fcbc4c686290c922411d62ec866f61`.

## Pack-local modifications (2026-10-04, spin fixes — machinery no longer verbatim)

- `templates/story.skeleton.mjs`: the spec now ships all TEN placeholder
  entries (was 3 + a `// 03 … 09 likewise` comment, which contradicted the
  10-section SCRIPT template and crashed at import with "Script must have
  exactly 3 sections" before `checkPreserved()` could speak).

## Format reconciliation (2026-10-04, finding 9)

- `templates/story.skeleton.mjs` parseScript() now accepts `## S01. Title`
  headings (canonical /cmo:screenplay form) alongside `## 1. Title`, and strips
  [src:]/[CHECK] claim tags from vo — tags must never reach TTS. Contract pinned
  by hooks/tests/test_screenplay_contract.py.
