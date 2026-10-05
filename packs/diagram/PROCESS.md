# PROCESS — pipeline, commands, gates, governance

## Command reference (all run in the reel directory)

```bash
export HYPERFRAMES_NO_TELEMETRY=1        # every hyperframes command, always

npm ci                    # install pinned deps (incl. ffmpeg/ffprobe binaries)
npm run doctor            # verify node/uvx/chromium/tts prerequisites
npm run narrate           # scenes.mjs vo → assets/audio/*.mp3 + word timings
npm run build             # scenes.mjs → compositions/*.html + STORYBOARD.md + SCRIPT.md
npm run story             # story artifacts only (fast iteration on words)
npm run animation-map     # resolved cue → time map; fails on unresolved cues
npm run check             # lint + runtime + layout + motion + contrast gates
npm run test              # project unit tests
npx hyperframes preview --background --port 3017   # persistent Studio preview
npx hyperframes preview --status                   # is it listening?
npx hyperframes preview --stop                     # stop after review
npm run render:base && npm run finish              # MP4 → captions + chapters
npm run verify            # media verification receipt into reports/
```

Studio handoff rule: always `preview --background` (persistent, survives the
agent session) — never wrap `npm run dev` in a background shell; the browser
outlives the shell and refreshes then time out.

## Phase gates (a human signs each)

| # | Phase | Artifact | Gate |
|---|-------|----------|------|
| 1 | Brief | `BRIEF.md` | Owner approves message, audience, arc, length |
| 2 | Screenplay | `SCREENPLAY.md` | Owner resolves every **CHECK**; reads each line |
| 3 | Scenes | `scenes.mjs` | Cues resolve (`animation-map` clean); geometry review on 2–3 snapshot frames |
| 4 | Assembly | `npm run narrate && npm run build` | Durations sane; no scene under 8s |
| 5 | Quality | `npm run check` + `npm test` | All gates green — no waivers |
| 6 | Cut review | Studio at :3017 | Owner reviews the full cut, notes per frame |
| 7 | Delivery | `render` + `finish` + `verify` | MP4 + chapters + captions + verification report |

Iterate 2↔6 as the owner gives notes; every wording change re-runs
`narrate` + `build` (timings move — never hand-patch a generated file).

## Governance (fixed for internal HPE material)

- `HYPERFRAMES_NO_TELEMETRY=1` on every command; telemetry, `publish`, and
  hosted/cloud rendering are OFF. Local rendering only.
- Pins are production state: `hyperframes@0.8.62`, registry commit
  `1b8f8a43d43bc2456075215b066b23e11d821435`, Edge TTS voice + rate. A
  deliberate change goes in BRIEF.md and the handover, never silently.
- Claims discipline: the named owner is the only claims source; decks and
  reference material provide terminology and context only. Mark unconfirmed
  claims **CHECK** and stop them at gate 2.
- No fabricated telemetry/customers/status; factual source labels on anything
  a viewer could misread.
- If the reel captures live product UI (this style supports it — see the
  Digital Twin kit), pin the product to an exact commit in its own worktree
  per `demo/DEMO_REEL_PRODUCTION_RUNBOOK.txt`, so the product can't change
  under the shoot.

## Deliverables

`renders/<id>.mp4` (chapters + selectable English captions burned in as
metadata), `reports/check.json`, the verification receipt, and a contact
sheet under `reports/contact-sheet/` for the handover.
