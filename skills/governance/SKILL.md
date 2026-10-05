---
name: governance
description: Production governance for cmo-plugin reels — pins and what an upgrade costs, the sequential human gates, preservation receipts and generation folders, duration guards, privacy boundaries (footage and fonts never leave the machine, only approved text goes to TTS), the fixed delivery target, the review player, the reviewer gate with a dispositions table, owner-authority skips, and what a handover must contain. Load before setup, before any step that costs (TTS, render), before delivery, and whenever asked whether something is "done". Encodes lessons 32–38, 43, 44, 45, 48, 49.
---

# governance

Automated checks never approve a film. Everything in this skill exists so
that what *can* be enforced is enforced by code, and what cannot is
recorded honestly as a human's name or its absence.

## 1. Pins are production state (lesson 32)

| Component | Pin |
|---|---|
| hyperframes (diagram, footage) | `0.8.62`; registry `1b8f8a43d43bc2456075215b066b23e11d821435` in `hyperframes.json` |
| edge-tts | `7.2.8` via `uvx` |
| @ffmpeg-installer/ffmpeg / ffprobe | `1.1.0` / `2.1.2` (npm); footage prep also needs system `/opt/homebrew/bin/ffmpeg` for `h264_videotoolbox` |
| faster-whisper (ASR check) | `1.2.1`, model `base.en`, no prompt |
| GSAP | bytes recorded in `assets/manifest.json` |
| Voice | `en-US-AndrewMultilingualNeural`; `+2%` (diagram, explainer), `−12%` (footage) |
| Fonts | HPE Graphik 400/500/600/700, copy of record `app/public/fonts/` @ `5c90c52` |
| `HYPERFRAMES_NO_TELEMETRY=1` | on every hyperframes command (hook-enforced) |

An upgrade is a new dependency, licence, security, render-diff and privacy
review (`OSS_REVIEW.md`). A deliberate change is written into BRIEF.md and
the handover; never made silently mid-production.

## 2. Gates are human and sequential (lesson 35)

evidence intake → brief → screenplay (+ **TTS approval of the text**) →
cuts / board → assembly → quality → cut review (+ reviewer dispositions) →
delivery → **human review**. Each gate's artifact is named in the pack's
`PROCESS.md`. Do not skip ahead; do not combine gates to save a question.

**Owner-authority skip (lesson 48).** The owner may say "finish without
further approval stops" (GTM, 2026-09-21). Honour it, and log it verbatim
with timestamp in `reports/APPROVED-<fingerprint>` (`skip: true, quote:
"…"`). The producer prints the skip in the handover. A skip is never
inferred from silence or from a general "go".

## 3. Preservation receipts (lesson 44)

Before any production step, `source-receipt.json` records SHA-256 of every
input (memo, documents, recordings) and every prior film the reel must leave
untouched. Every script runs `checkPreserved()` first and **refuses on any
drift** — an incomplete receipt is also a failure. "Rebaseline" is an
explicit owner action with a reason, never implicit.

- New cut = new `FILM.id` / `VERSION` and a **new generation folder**
  (`-first-cut`, `-second-cut`; `out/organization-integrated-cut/`). Never
  overwrite a delivered render. `archive-cut.mjs` before revising.
- Approved narration clips are reused **byte-for-byte**; only changed
  sections synthesise. Audio whose hash drifted is refused.
- Films are never spliced together. An approved insert (the 40.5 s
  technical intro) is reused as bytes with the film's own chrome, and the
  preserved standalone stays untouched.

## 4. Duration guards are code (lesson 45)

Film window from the brief (`MIN_DURATION`/`MAX_DURATION`; explainer
reference 300–360 s; footage master exactly 900 s). Close ≤ 12 s. Average
silent tail ≤ 1.95 s (footage). State ≥ 1 s + dissolve (explainer). Scene
≥ 8 s (diagram). Stale inputs, changed artwork, mismatched fingerprints all
throw. Translate for the owner: "The film is 6:16; the brief allows 5:00 to
6:00. Cut 16 s or raise the limit in the brief."

## 5. Privacy boundaries (lessons 26, 31)

- **Footage, memos, documents and fonts never leave the machine.** No
  `hyperframes publish`, no `--cloud`, no lambda/cloud-run render, no
  `curl`/`scp`/`rsync`/`gh release upload`/`aws s3 cp` of media or OTFs
  (hook-denied).
- **Only approved narration text** goes to Microsoft Edge TTS, after the
  owner approves the script for external speech processing. Record the date.
- Generated media (`out/`, `renders/`, `assets/audio`, `assets/footage`,
  `*.mov *.mp4 *.webm`) is gitignored and hook-denied at `git add`. Fonts
  are hook-denied to any non-internal remote.
- Studio handoff is `preview --background` (never a backgrounded `npm run
  dev`); stop it after review.

## 6. The reviewer gate and dispositions table (lesson 43)

Before the cut review, an independent reviewer (a second person or a second
model — the SecOps reel paused for Sol) receives: the artifacts, numbered
questions, and the instruction "do not implement, do not render, return
prioritised findings with file/scene references". Every finding becomes a
row in `REVIEW_DISPOSITIONS.md`:

| Finding | Resolution | Evidence |
|---|---|---|

Marketing agents' output is already in this shape. The owner accepts the
dispositions; disagreement is recorded, not argued away.

## 7. The review player (lesson 49)

CORRECTED (owner, 2026-10-04): Studio audio is FINE — on two early runs
the operator could not get playback going, later traced to unfamiliarity
with the Studio controls, not a Studio defect. Walk a first-time reviewer
through the playback controls before concluding anything is broken.
A local review player remains a good default for a non-technical owner:
`out/review.html` — the MP4 with embedded captions, chapter buttons, seek,
full-screen, downloads, the verification summary and the "not yet humanly
reviewed" notice; works from `file://`; verified to play H.264/AAC in
installed Chrome (the headless shell does not decode it). `--generate-only`
refreshes the page without claiming a playback check.

## 8. Estimate before anything that costs (lesson 38)

- TTS: words ÷ rate → seconds; it is an external call.
- Footage prep: minutes per excerpt at 12 Mbps; ≥ 5 GB free.
- Render: SDLC 15:00 took 1064 s at 25.4 fps; on-prem 13:33 took 606 s at
  40 fps; explainer plates ~2 min, close < 1 min, encode + verify ~3 min.
- Agents: cost estimate and owner approval before deploying any.

## 9. Delivery target (lesson 37)

H.264 1920×1080 @ 30 fps BT.709; AAC stereo 48 kHz 192 kb/s; two-pass
`loudnorm I=-16:TP=-1.8:LRA=7`, delivery TP ≤ −1.5 dBTP; selectable English
captions (`mov_text`) + SRT (+ VTT); chapters from scene boundaries; exact
master duration; full decode; contact sheets of encoded midpoints and
transitions; no burned-in subtitles. `finish` + `verify` enforce it.

## 10. What a handover must contain (lesson 33) — receipts only

`marketing-producer` writes it from `check.json`, `finish.json` /
`render-report.json`, `verification.json`, footage/speech/preservation
receipts, the ASR report and the dispositions table:

- Deliverable path, duration, size, **SHA-256**, verification timestamp.
- Source receipt: every input and prior film with hash, "unchanged".
- Script hash, cut version, source commit, which checks passed (counts).
- Pronunciation diagnostic scope and limits.
- Known limitations and anything documented-not-fixed (capture notes).
- Any owner-authority skip, quoted.
- **Human review: `<name>, <date>, watched + listened, findings`** — or the
  literal line `human review: NOT RECORDED`. "Done" is not said without the
  former.

## 11. Answering "is it done?"

Done means: verification passed **and** a named human watched and listened
to the exact hash **and** the handover says so. Anything less is "built and
technically verified; human review pending". Say which.
