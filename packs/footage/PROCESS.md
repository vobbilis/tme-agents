# PROCESS — pipeline, commands, gates, governance

## Command reference (run inside `<reel>/production/`)

```bash
export HYPERFRAMES_NO_TELEMETRY=1          # every hyperframes command, always

npm ci                                     # pinned deps incl. ffmpeg/ffprobe binaries
npm run doctor                             # node ≥ 22, uvx, ffmpeg, pins, hyperframes binary
swiftc -O scripts/inspect-frames.swift -o reports/inspect-frames   # OCR helper (macOS)

npm run story                              # screenplay → STORYBOARD.md + SCRIPT.md only (fast)
npm run narrate [-- --only s04]            # Edge TTS per scene: mp3 + words.jsonl + vtt + receipt
node scripts/prepare-footage.mjs [--only s04-2]   # excerpts → assets/footage/*.mp4 (+ receipts)
node scripts/prepare-focus.mjs             # OCR crops → assets/focus.json, reports/focus-tracking/
npm run build                              # compositions/*.html, index.html, timeline, SRT, chapters
npm test                                   # story/structure/timing/footage regressions
npm run check                              # hyperframes check: lint, runtime, layout, caption zone, frames
npm run animation-map                      # resolved cue → time map
npm run snapshot                           # midpoint/transition PNGs → snapshots/
npm run preview                            # Studio, background, :3017  (npm run preview:stop)
npm run render:base -- --approved          # base MP4 (requires a passing check.json for THIS fingerprint)
npm run finish                             # loudnorm two-pass, AAC, mov_text captions, chapters → renders/<id>.mp4
npm run verify                             # 69-check media receipt → reports/verification.json, contact sheets
```

Order on a fresh story: `story → narrate → prepare-footage → prepare-focus
→ build → test → check → snapshot → preview → render:base → finish → verify`.
`prepare-footage` refuses to run before narration is complete (cuts are at
measured cue times); `build` refuses if `focus.json` is stale for a shot;
`render:base` refuses without `--approved` and a check receipt whose
composition fingerprint matches the current files.

Studio handoff rule: always `preview --background` (survives the agent
session); never wrap a dev server in a background shell.

## Phase gates (a human signs each)

| # | Phase | Artifact | Gate |
|---|-------|----------|------|
| 0 | Evidence intake | `EVIDENCE_REGISTER.md` | Owner confirms actors, chronology, "does not establish", exclusion ranges |
| 1 | Brief | `production/BRIEF.md` | Owner approves message, audience, arc, length, invitation |
| 2 | Screenplay | `STORYBOARD_REVIEW.md` | Owner reads every line; claims trace to register/owner account; **script approved for external TTS** |
| 3 | Source cuts | `scripts/lib/shots.mjs`, `reports/focus-tracking/` | Owner reviews first/last crop frame per shot: readable, in frame, right passage |
| 4 | Assembly | `npm run narrate && npm run build && npm test` | Durations sane; tails ≤ 2 s; cues resolve once; no pending slates unless agreed |
| 5 | Quality | `npm run check` + snapshots | All gates green, no waivers; midpoint + transition sheets reviewed |
| 6 | Cut review | Studio :3017 or an authorized review MP4 | Owner notes per scene; wording fixes go back to phase 2 |
| 7 | Delivery | `render:base → finish → verify` | New `FILM.id` per cut; MP4 + SRT + chapters + verification receipt |
| 8 | Human review | handover record | Named reviewer watched the full MP4 with sound/captions; named reviewer scrubbed all footage for redaction |

Iterate 2 ↔ 6 on notes. Every wording change re-runs `narrate` + `build`
(and `prepare-footage` if a cut moves more than a frame — it will tell you).
Never hand-patch a generated file.

## Iterate only the affected stages

| Changed | Re-run |
|---|---|
| Narration words | narrate → prepare-footage (cuts move) → build → test → check → … |
| Excerpt choice / targets | prepare-footage → prepare-focus → build → test → check → … |
| CSS / frame | build → check → snapshot → … |
| Nothing but approval | render:base → finish → verify |

## Governance (fixed for internal HPE material)

- `HYPERFRAMES_NO_TELEMETRY=1`; telemetry, `publish`, hosted/cloud rendering
  OFF. Local rendering only.
- **Raw recordings never leave the machine.** Not committed (see
  `templates/gitignore`), not uploaded, not sent to any service. Only
  narration text goes to Edge TTS, after the owner approves the script for
  external speech processing (reference approval: 2026-09-30).
- Pins are production state: `hyperframes@0.8.62`, registry
  `1b8f8a43d43bc2456075215b066b23e11d821435`, `edge-tts==7.2.8`,
  `@ffmpeg-installer/ffmpeg@1.1.0`, Andrew `-12%`. A deliberate change is
  written into BRIEF.md and the handover, never made silently.
- Claims discipline: owner's confirmed account + evidence register are the
  only sources; reference web pages supply terminology. No fabricated
  telemetry, status, or success. Preserve the actual outcome.
- The `fabricated data` guard rails in the generic kit's capture adapter do
  not apply to real engineering footage: adapt provenance text honestly;
  never relabel real footage as fabricated to pass a check.
- Fonts: HPE Graphik is HPE-internal; keep OTFs out of public repos and
  hosted assets.
- Each cut is a new file (`-first-cut`, `-second-cut`, `-third-cut`).
  Preserve earlier cuts; a new cut gets a fresh technical and human review.

## Delivery target (what `finish` + `verify` enforce)

H.264 1920×1080 @ 30 fps; AAC stereo 48 kHz 192 kb/s; loudness −16 LUFS
integrated (two-pass `loudnorm I=-16:TP=-1.8:LRA=7`), true peak ≤ −1.5 dBTP
on delivery; selectable English captions (`mov_text`) + standalone SRT;
chapters from scene boundaries; exact master duration; complete decode;
encoded midpoint and transition frames extracted to contact sheets.

## Deliverables

`renders/<id>.mp4`, `reports/<id>.srt`, `reports/chapters.ffmetadata`,
`reports/verification.json`, `reports/contact-sheet/{midpoints,transitions}.png`,
`VALIDATION_REPORT.md`, and a handover stating: recording sources and their
hashes, screenplay revision, reel source commit, which checks passed, who
reviewed the finished film and when, known limitations, redaction status.
