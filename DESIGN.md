# cmo-plugin — Design

**Our own technical marketing team, as a Claude Code plugin.**

| | |
|---|---|
| Status | v0.2.0 (2026-10-05): PROVEN END TO END — a real film delivered through all seven stages (two cuts, owner review loop, "This film is done."); 117 tests; five machinery bugs found-and-fixed by the e2e run. Open: distribution packaging, the naive-teammate run (step 5), launch-reel capture session (CAPTURE_PLAN.md) |
| Version | 0.2.0 (2026-10-04) |
| Teammate doc | `docs/index.html` in THIS repo (GitHub-Pages-ready; moved from aigile 2026-10-05; owner decision stands: never cross-link it with the coding-flow docs) |
| Owner | Suresh Vobbilisetty |
| Location | repo `~/go/src/github.com/vobbilis/codegen/tme-agents/` → github.com/vobbilis/tme-agents (public; canonical since 2026-10-05); `~/.claude/plugins/cmo-plugin` is a symlink to it, so launchers and every documented path keep working |
| Working state | `metrics-dashboard/HANDOVER.md` §A (local-only) |
| Memory | `cmo-plugin-and-reel-portfolio.md`, `hyperframes-style-packs.md` |

---

## 1. Summary

`cmo-plugin` turns the craft learned over seven narrated product films into
a set of Claude Code commands, skills, agents and hooks so that a
**non-technical teammate** (PM, field, pre-sales, enablement) can produce a
brand-correct, claims-safe, synchronised film by doing only four things:
answer one question at a time, approve text, look at two frames and say
yes/no, and watch a video and give timestamped notes.

The plugin has four layers, borrowed from the v4 scope-guardrails pattern:

1. **Commands** (`/cmo:*`) — the production gates, run as conversations.
2. **Skills** (`cmo:story-craft`, `cmo:narration`, `cmo:footage`, `cmo:frame-and-motion`, `cmo:governance`) — the craft, loaded on demand.
3. **Marketing agents** (`marketing-*`) — read-only reviewers that cannot
   approve anything.
4. **Hooks** — validators that hold the rules without anyone remembering.

Prompts guide, hooks enforce, compliance is judged from artifacts and never
from agent narrative.

## 2. Problem

The craft is already written down (two style packs; seven project READMEs
and handovers). Using it still means: editing `scenes.mjs` / `shots.mjs`,
running eight npm scripts in order, reading errors such as
"cue must resolve once" or "Narration pace leaves long silent tails",
knowing that `prepare-footage` refuses before narration exists, knowing
which pipeline a reference film used, and knowing the Read fence.

A PM cannot do that. Every rejected cut in the portfolio was rejected for a
reason a PM *can* judge (a claim the evidence does not support, a story that
opened on the wrong idea, a label that overstated maturity, a pronunciation
that sounded wrong) — but the tooling put a wall of mechanics between them
and that judgement.

## 3. Goals and non-goals

**Goals**

- G1 A teammate who has never opened a reel repo makes a 3-scene footage
  reel from one 5-minute recording without reading a stack trace or a path.
- G2 Every claim in a film is traceable to an owner-confirmed fact or an
  evidence-register row; unconfirmed claims cannot reach TTS.
- G3 Footage, fonts and generated media never leave the machine and never
  enter git, by construction (hooks), not by convention.
- G4 Three film forms are supported from day one: **diagram** (Hyperframes),
  **footage / evidence** (Hyperframes), **illustrated explainer**
  (vector plates, no Hyperframes).
- G5 Every delivery carries a receipts-only handover that states what was
  and was not humanly reviewed.
- G6 One installed version for the whole team (`~/.claude/plugins`).

**Non-goals**

- Not a general video editor. No timeline UI, no music, no effects library.
- Does not approve films. Automated checks never substitute for a human
  watch-and-listen; the plugin makes that explicit, it does not remove it.
- Does not pick the argument. The owner is the only claims source (L2).
- Does not publish. No cloud render, no upload, no `hyperframes publish`.
- Does not fix product bugs discovered during capture (L46).

## 4. Users

| Persona | Can do | Cannot do | Plugin gives them |
|---|---|---|---|
| **Owner** (PM / lead) | decide the argument, confirm facts, approve text, watch and note | edit JS, read ffmpeg errors | `/cmo:brief`, `/cmo:screenplay`, `/cmo:review` as conversations |
| **Operator** (any teammate) | run commands, answer prompts, look at frames | know pipeline order | `/cmo:new`, `/cmo:cuts`, `/cmo:assemble`, `/cmo:deliver` |
| **Reviewer** (named human) | watch, listen, sign | — | `marketing-producer` records their name and hash; refuses "done" without it |
| **Engineer** (maintainer) | extend packs, pins, hooks | — | `governance`, tests, pins table |

## 5. Reference portfolio

The design is distilled from these films. They are the evidence for every
rule below. All live in two worktrees of `or-itom-portal-prototype`; read
their files with Bash (the Read tool is fenced to the current project).

**Worktree A** — `~/go/src/github.com/hpe-hybrid-cloud/itom-portal-prototype-hyperframes-reel`,
branch `media/hyperframes-reel-toolkit`, everything in `demo/` uncommitted.

| Film | Path | Length | Form / pipeline | Role |
|---|---|---|---|---|
| Learn reel | `demo/learn-reel/` | 6:57 | Playwright-driven product, B-roll cards; `RECIPE.md` rev 4 | sync lessons (marker retiming) |
| Digital Twin toolkit film | `demo/hyperframes-reel-kit/` | 12:28 | product-in-perspective proof frames, fabricated data; Hyperframes | generic machinery; `PRODUCTION_HANDOVER.md`, `OSS_REVIEW.md` |
| On-prem architecture journey | `demo/opsramp-onprem-architecture-reel/` | 13:33 | diagrams on a 1744×632 stage, question bookend; Hyperframes; 84/84 checks | **reference for the DIAGRAM form** → `onprem-reel-style-pack/` |
| SDLC evidence reel (third cut) | `demo/hpe-opsramp-sdlc-demo/production/` | 15:00 | real screen recordings left ⅔, conclusions right ⅓; Hyperframes; 69/69 checks; Andrew **-12%** | **reference for the FOOTAGE form** → `evidence-reel-style-pack/` |

**Worktree B** — `~/go/src/github.com/hpe-hybrid-cloud/itom-portal-prototype-ai-first-reel`,
branch `media/ai-first-sdlc-auditor-reel`.

| Film | Path | Length | Form / pipeline | Role |
|---|---|---|---|---|
| Digital Twin engineering film, integrated cut 2 | `demo/ai-first-sdlc-reel/out/organization-integrated-cut/` | 7:07.23 | hero → approved 40.5 s technical-intro insert → telemetry → Code to Design; Playwright/Chromium + FFmpeg; 150 checks | owner-approved; story-frame lessons (L40); approved-insert reuse (L44) |
| GTM enablement continuation | `demo/learn-reel/gtm/out/` | 3:44.73 | real capture of Demo/Teach/Certify against pinned app; 42 shots, 35 cues | capture-bug handling (L46), editorial summaries (L47), owner-authority skip (L48) |
| Shift-left SecOps story, cut 5 | `demo/secops-ai-first-reel/out/` | 5:21.5 | **illustrated vector plates**, 40 states, 36 dissolves, 7.47 s animated close; **no Hyperframes (owner rejected it)**; 139 checks; review player | **reference for the EXPLAINER form** (pack to be written); ASR pronunciation (L42); reviewer gate (L43) |
| Evidence-led auditor reel | `demo/ai-first-sdlc-reel/out/opsramp-ai-first-sdlc-auditor-reel.mp4` | 7:07 | repo evidence / PR statistics | **REJECTED** 2026-09-20 — the negative example for L40; same length as the approved film, never confuse |
| Technical-intro previews rev 1 / rev 2 | `…/out/technical-intro-preview{,-v2}/` | 29.87 s / 40.5 s | standalone architecture animation | rev 2 approved; reused byte-for-byte |
| Original organizational cut | `…/out/organization-first-cut/` | 6:08 | predecessor | preserved, hash-checked |

Three pipelines: Hyperframes (2 films), Playwright/Chromium + FFmpeg (4),
vector plates via Chromium (1). Voice `en-US-AndrewMultilingualNeural` at
**+2%** on six films; **-12%** only on the SDLC evidence reel.

## 6. Principles

P1 **Script is data; everything else is generated.** One source file
(screenplay) drives narration, cues, captions, compositions and the
storyboard. Hand-maintained copies drift within a day (L1).

P2 **The owner is the only claims source.** Decks, web pages and transcripts
are terminology aids. They never choose the argument (L2, L51).

P2a **Every claim needs a source; truth is a human judgement.** (Owner
decision 2026-10-03.) The plugin enforces that each spoken sentence traces
to a source — a captured session, a recording's register row, or an
owner-confirmed fact — and that the source's kind is visible. It does
**not** verify that a confirmed fact is true, and it will not be extended
to do so: no evidence grades that refuse claims, no diagram-vs-system or
diagram-vs-repository checks. Decks, PDFs and web pages remain context, not
sources.

P3 **Prompts guide, hooks enforce.** Anything that *must* hold is a hook
with a test, not a sentence in a prompt.

P4 **Judge from artifacts, never from narrative.** Receipts
(`check.json`, `finish.json`, `verification.json`, footage/speech/preservation
receipts, ASR report) are the only inputs to the producer and to "done".

P5 **Automated checks never approve a film.** Every handover ends with the
name of the human who watched it, or "human review: NOT RECORDED" (L33).

P6 **Footage never leaves the machine.** Only approved narration text goes
to Edge TTS, and only after the owner approves the script for external
speech processing (L26).

P7 **One form per film.** Diagram, footage and explainer are different
grammars and are never mixed in one film (L28).

P8 **Every step reduces to one of four owner actions:** answer one question,
approve text, say yes/no to two frames, give timestamped notes.

## 7. Architecture

```
~/.claude/plugins/cmo-plugin/
├── .claude-plugin/plugin.json          name, description, author, version
├── DESIGN.md                           this document
├── README.md                           teammate-facing: install, first reel in 20 minutes
├── commands/                           Layer 1 — gates as conversations
│   ├── new.md
│   ├── brief.md
│   ├── screenplay.md
│   ├── cuts.md
│   ├── assemble.md
│   ├── review.md
│   └── deliver.md
├── skills/                             Layer 2 — the craft
│   ├── story-craft/SKILL.md
│   ├── narration/SKILL.md
│   ├── footage/SKILL.md
│   ├── frame-and-motion/SKILL.md
│   └── governance/SKILL.md
├── agents/                             Layer 3 — the marketing agents
│   ├── marketing-fact-checker.md
│   ├── marketing-sync-editor.md
│   ├── marketing-privacy-reviewer.md
│   └── marketing-producer.md
├── hooks/                              Layer 4 — validators
│   ├── hooks.json
│   ├── cmo_guard.py                    one entry point, dispatches by tool + argv
│   └── tests/test_cmo_hooks.py
└── packs/                              style packs copied by /cmo:new (each self-contained)
    ├── diagram/        ← onprem-reel-style-pack + machinery/ (Hyperframes reference project)
    ├── footage/        ← evidence-reel-style-pack + machinery/ (incl. prepare-footage/-focus, OCR)
    └── explainer/      ← written 2026-10-03 from secops-ai-first-reel: guides, templates,
                           machinery/ (+ lib/ shared helpers, imports rewritten), reference/ (docs + hero SVGs)
    each pack: CLAUDE.md · STYLE_FRAME · NARRATION_GUIDE · CUTS_AND_MOTION · PROCESS ·
               (STORY_STRUCTURE / FOOTAGE_GUIDE where applicable) · MACHINERY_NOTES.md ·
               templates/ · assets/fonts/ · source-receipt.json (worktree, commit, hashes)
```

`MACHINERY_NOTES.md` in each pack records what was copied, what was
rewritten, what remains reel-specific and must be adapted, and known
inconsistencies to resolve on the first spin. Read it before scaffolding.

Fonts (HPE Graphik OTFs, internal licence) ship **inside the packs** and
nowhere else; the pre-commit hook refuses to stage them to a non-internal
remote (L31).

### 7.1 A reel project, as the plugin creates it

```
<reel>/
├── BRIEF.md                   owner-confirmed audience, argument, scope
├── EVIDENCE_REGISTER.md       footage form: what each recording shows / does NOT establish / exclusions
├── SCREENPLAY.md              THE source (P1); parsed by scenes.mjs
├── REVIEW_DISPOSITIONS.md     finding / resolution / evidence rows (L43)
├── CAPTURE_NOTES.md           footage form: product issues met and routed around (L46)
├── production/                pipeline copied from the pack; scenes.mjs, shots.mjs, …
│   ├── hyperframes.json       (diagram, footage forms)
│   ├── source-receipt.json    hashes of every input + prior films (L44)
│   ├── reports/               check.json, timeline.json, hooks.log, APPROVED-<fp>, asr.json
│   └── out/                   MP4, SRT, chapters, review.html, verification.json, contact sheets
└── PRODUCTION_HANDOVER.md     written by marketing-producer from receipts only
```

Generated files (`STORYBOARD.md`, `SCRIPT.md`, `index.html`,
`compositions/*.html`, `*.motion.json`, `reports/**`) are hook-protected
from hand edits once `scenes.mjs` exists.

## 8. Layer 1 — Commands

Each command is a gate. "Stops for" is the only moment it waits on a human;
everything else it does or reports.

**Convention for every `/cmo:*` command (owner request 2026-10-03):**
`/cmo:<x> help` (also `--help`, `-h`, `?`, `usage`) prints a fixed usage
block — purpose, arguments, what it does, what it never does, where it sits
in the pipeline — and ends the turn without loading skills, reading packs or
asking anything. Commands also accept pre-answered arguments (`--form`,
`--title`, `--dir`, …) to skip questions the owner has already answered;
an invalid value is answered conversationally, never with an error trace.

### 8.1 `/cmo:new`

| | |
|---|---|
| Asks | form (**diagram / footage / explainer**), target length, audience, working title |
| Does | copies `packs/<form>/` into `<reel>/production/`, fonts, `.gitignore`; `npm ci`; `doctor`; compiles `inspect-frames.swift` (footage); writes `source-receipt.json` skeleton |
| Writes | `<reel>/production/` skeleton, `BRIEF.md` stub |
| Stops for | the form choice (P7) |
| Must not | assume Hyperframes — the explainer pack is Playwright/Chromium + FFmpeg (L39) |

### 8.2 `/cmo:brief`

| | |
|---|---|
| Asks | one question at a time: who watches, what they must leave believing, what they must NOT be told, owner-confirmed facts, source hierarchy |
| Accepts | an audio memo (transcribed locally; transcript is an aid, fallible on acronyms), documents, decks — all ranked below the owner's own words (L51) |
| Footage form | `ffprobe` every recording; per recording: what it shows, what it does **not** establish, exclusion ranges, actor; redaction status |
| Writes | `BRIEF.md`, `EVIDENCE_REGISTER.md`, `source-receipt.json` (hashes of all inputs and any prior film the reel must preserve) |
| Stops for | owner confirms the register row by row |

### 8.3 `/cmo:screenplay`

| | |
|---|---|
| Does | drafts in groups of 3–5 scenes; every sentence tagged to a register row or an owner fact; unconfirmed → **CHECK**; writes `cues[]` (3–6 word phrases, exact-once) and `spoken()`/`displayCaption()` pairs; applies the status-label taxonomy (L41) and the organization-first ban list (L40) |
| Runs | `marketing-fact-checker` before showing any group; its table becomes rows in `REVIEW_DISPOSITIONS.md` |
| Writes | `SCREENPLAY.md`, `scenes.mjs`, `REVIEW_DISPOSITIONS.md` |
| Stops for | every CHECK; then **TTS approval**: "This text will be sent to Microsoft Edge TTS. Approve?" (P6) |
| Estimate | words ÷ rate → seconds, shown before approval (L38) |

### 8.4 `/cmo:cuts` (footage form only)

| | |
|---|---|
| Does | approved screenplay → `shots.mjs` sources map + OCR targets; `narrate` → `prepare-footage` → `prepare-focus`; renders first and last crop frame per shot |
| Writes | `shots.mjs`, `focus.json`, excerpts (`.partial.mp4` → rename), receipts |
| Stops for | one yes/no per shot: "Is what the narrator names readable and in frame?" |
| If capture meets a product bug | document in `CAPTURE_NOTES.md`, route around through the real UI, never fix or inject state, never claim resolved (L46) |

### 8.5 `/cmo:assemble`

| | |
|---|---|
| Does | `narrate` → **ASR pronunciation check** (L42) → `build` → `test` → `check` → `animation-map` → `snapshot`; duration guards (L45) |
| Loops | until green; never stops for a human |
| Translates | every failure to one plain sentence + the fix location |

Failure translations (the contract; tests assert these strings exist):

| Raw | Plain |
|---|---|
| cue resolves twice | "The phrase 'X' appears twice in scene 11. Pick a longer phrase." |
| avg tail > 1.95 s | "Scene 7 has 6 s of silence. Add one sentence or cut 20 s of footage." |
| no OCR match | "The excerpt for scene 5, point 2 never shows the text the narration names." |
| ASR mismatch | "The narrator says 'Secretary Ops' at 0:39. Try the speech-only hint 'Seck-ops'." |
| duration guard | "The film is 6:16; the brief allows 5:00–6:00. Cut 16 s or raise the limit in the brief." |
| prepare-footage before narrate | "Narration has not been generated yet. Running it first." (and does) |

### 8.6 `/cmo:review`

| | |
|---|---|
| Builds | **local review player** `out/review.html` (embedded captions, chapter jumps, verified in Chrome) (L49); or `preview --background` on a free port; or a `render:review` watch copy if playback won't cooperate (historical "audio unreliable" reports were operator unfamiliarity — owner correction 2026-10-04) |
| Collects | timestamped notes; maps each to the screenplay line / scene it touches; appends to `REVIEW_DISPOSITIONS.md` |
| Re-runs | only the affected stages (iterate table, L34) |
| Writes | `reports/APPROVED-<fingerprint>` when the owner says "approved" — or a logged **owner-authority skip** entry when the owner says "finish without further stops" (L48) |
| Stops for | the owner's notes |

### 8.7 `/cmo:deliver`

| | |
|---|---|
| Does | `render:base --approved` → `finish` → `verify`; new `FILM.id` and new generation folder per cut; prior films hash-verified unchanged (L44) |
| Runs | `marketing-producer` |
| Writes | MP4, SRT, chapters, `verification.json`, contact sheets, `PRODUCTION_HANDOVER.md` |
| Stops for | a **named human reviewer + MP4 hash** before it will say "done" (P5) |
| Estimate | render time from the pins table before starting (L38): SDLC 15:00 took 1064 s @ 25.4 fps; on-prem 606 s @ 40 fps |

## 9. Layer 2 — Skills

Skills carry the craft; commands reference them by name. Lesson numbers
refer to Appendix A.

| Skill | Lessons | Contents |
|---|---|---|
| `story-craft` | 1–12, 40, 41, 47, 51 | the three arcs: **question-bookend** (diagram: open on a question, answer it verbatim in the last frame); **evidence** (idea → case → N actors → real outcome → proposal → return); **organization-first explainer** (hero → mechanism → one labelled hypothetical → ownership → maturity → animated close). Claims rule, status-label taxonomy, banned audit items, editorial-summary labelling, source hierarchy |
| `narration` | 13–18, 42, 50 | voice/rate per form (+2% default, -12% evidence footage), sentence shapes, banned words, timing math (≈153 wpm at +2%; 2.45 w/s at -12%), `spoken()` vs `displayCaption()`, speech-only hints, ASR check, cue-offset per pipeline (0.35 / 0.40) |
| `footage` | 19–27, 46, 47 | recording checklist, register template with "does not establish", shots map, encode profile, OCR fixed crop, rectangle policy, label vocabulary, redaction, capture-notes template |
| `frame-and-motion` | 28–31 (+ explainer anatomy) | 15 tokens, HPE Graphik weights, three frame anatomies (diagram 1744×632 stage; evidence well 64,165 1168×710 + panel 1280,174 w552; explainer content x 104–1816 y 170–887, footer ≤ 951, captions 965–1064), colour grammar (green structure / amber boundary / mint evidence / blue human authority), cut grammar, motion do-nots |
| `governance` | 32–38, 43, 44, 45, 48, 49 | pins table, gates, preservation receipts, privacy boundaries, duration guards, delivery target, handover and dispositions contents, review player, owner-authority skip, OSS review status |

## 10. Layer 3 — Marketing agents

All four are **read-only** (no Write/Edit/NotebookEdit). Each outputs a
table keyed by scene and quote so its rows drop straight into
`REVIEW_DISPOSITIONS.md`. None can write an approval marker.

| Agent | Reads | Flags |
|---|---|---|
| `marketing-fact-checker` | `SCREENPLAY.md`, `EVIDENCE_REGISTER.md`, `BRIEF.md` | sentences the "does not establish" column rules out; numbers without source + interval + definition + denominator (L10); unlabelled assumptions (L9); promo words; contributor names, PR counts, test totals, paths, commands (L40); status labels outside the taxonomy or "in production" used loosely (L41); repeated proof disclaimers (L5) |
| `marketing-sync-editor` | `reports/timeline.json`, animation map, word JSONL, `footage.json` | reveal before its screen anchor; cue within 1 s of a scene boundary; tail > 1.5 s; excerpt touching an exclusion range; cue offset that does not match the pipeline's (L50) |
| `marketing-privacy-reviewer` | OCR frames per excerpt (`reports/focus-tracking/`) | text shaped like names, e-mails, keys, tokens, notifications — listed for a human to clear; **never clears anything itself** (L25) |
| `marketing-producer` | receipts only: `check.json`, `finish.json`, `verification.json`, footage/speech/preservation receipts, `asr.json`, dispositions | writes `PRODUCTION_HANDOVER.md`; "human review: NOT RECORDED" unless a reviewer line was supplied in-session; records any owner-authority skip verbatim |

## 11. Layer 4 — Hooks

One Python entry point, `hooks/cmo:guard.py`, registered for `PreToolUse`
on `Bash`, `Edit`, `Write`. Plain `python3`, ≈50 ms. **Fails open** when
no reel project is detected (a `scenes.mjs` or `SCREENPLAY.md` in the cwd
ancestry) so daily sessions are untouched. Logs to the reel's
`production/reports/hooks.log`, never to a cwd-relative `logs/`.

| # | Trigger | Denies | Rule |
|---|---|---|---|
| H1 | Bash | `hyperframes publish`, `--cloud`, lambda / cloud-run render flags; `curl`, `scp`, `rsync`, `gh release upload`, `aws s3 cp` whose argv contains `.mov` `.mp4` `.webm` `.otf` | P6, L26 |
| H2 | Bash | any `hyperframes` / `npx hyperframes` without `HYPERFRAMES_NO_TELEMETRY=1` | L32 |
| H3 | Edit/Write | generated files when `scenes.mjs` exists: `STORYBOARD.md`, `SCRIPT.md`, `index.html`, `compositions/*.html`, `*.motion.json`, `reports/**` | P1, L1 |
| H4 | Bash | `render:base`, `render.mjs`, `finish.mjs` unless `reports/check.json` is `ok:true` with fingerprint == current composition **and** `reports/APPROVED-<fingerprint>` exists (or a logged owner-authority skip) | L35, L48 |
| H5 | Bash | any production step when `source-receipt.json` / `preservation.json` hashes no longer match inputs or prior films; "rebaseline" is an explicit owner action | L44 |
| H6 | Bash (`git add`, `git commit`) | staging `*.mov` `*.mp4` `*.webm` `assets/audio/**` `assets/footage/**` `renders/**` `out/**`; staging `*.otf` if the remote is not an internal host | L26, L31 |

Tests first (`hooks/tests/test_cmo_hooks.py`, same style as
`~/.claude/hooks/tests/test_scope_guardrails.py`): one red test per row
above, plus fail-open outside a reel project, plus the log location.

## 12. Pins

| Component | Pin | Why |
|---|---|---|
| hyperframes | 0.8.62; registry `1b8f8a43d43bc2456075215b066b23e11d821435` | render-diff reviewed |
| edge-tts | 7.2.8 | word boundaries are the clock (L13) |
| @ffmpeg-installer/ffmpeg / ffprobe | 1.1.0 / 2.1.2 | encode profile |
| faster-whisper | 1.2.1, model `base.en`, no prompt | ASR pronunciation check (L42) |
| GSAP | bytes recorded in `assets/manifest.json` | motion determinism |
| Voice | `en-US-AndrewMultilingualNeural`; +2% default, -12% evidence footage | portfolio |
| Fonts | HPE Graphik 400/500/600/700 from `itom-portal-prototype/app/public/fonts/` @ `5c90c52` | licence |

Any upgrade = new dependency, licence, security, render-diff and privacy
review (`OSS_REVIEW.md`, L32).

## 13. Build plan

| Step | Deliverable | Risk | Exit test |
|---|---|---|---|
| 1 ✅ | `plugin.json`, `/cmo:new` (+help), five skills, **explainer pack written from `secops-ai-first-reel`**, machinery bundled into all three packs with receipts, README | lowest: reshaping existing text | **Done 2026-10-03.** Still to run: `/cmo:new` end-to-end for each form; `npm ci && npm run doctor` on a scaffolded diagram/footage project; `node --test` on a scaffolded explainer once a SCRIPT.md exists. Machinery is syntax-checked (`node --check`), not yet executed from its new home |
| 2 | H1–H6 + `test_cmo_hooks.py` (red first) | small; protects footage from day one | all tests green; fail-open verified |
| 3 | `/cmo:screenplay` + `marketing-fact-checker` | the pair that removes the most rework — every rejected cut was a claims or story-frame problem | re-run on the rejected auditor treatment flags L40 items; on SDLC cut one flags L5 |
| 4 | `/cmo:brief`, `/cmo:cuts`, `/cmo:assemble`, `/cmo:review`, `/cmo:deliver`; the other three agents | integration | rebuild the SDLC third cut byte-equal from its screenplay |
| 5 | **Dry run**: a teammate who has never opened a reel repo makes a 3-scene footage reel from one 5-minute recording, observed and timed | the real test of G1 | every stack trace or path they had to read becomes a fix |

## 14. Risks

| Risk | Mitigation |
|---|---|
| Studio playback controls confuse first-time reviewers (the two historical "no audio" reports were operator unfamiliarity — owner correction 2026-10-04, NOT a Studio defect) | /cmo:review walks the owner through the controls + sound check; render:review watch copy as fallback; review player (L49) still good for non-technical owners |
| Explainer form has no pack yet | step 1 writes it from the SecOps reel's `BRIEF`, `SCREENPLAY`, `illustrations.mjs`, `build-board.mjs`, `closing-motion.mjs` |
| Reference films sit in two worktrees, uncommitted | `source-receipt.json` in each pack records their hashes; packs are self-contained copies |
| Fonts are internal-licence | ship only inside packs; H6 refuses non-internal remotes; never in README screenshots |
| Owner-authority skip abused to bypass review | skip is logged verbatim with timestamp and quoted instruction; producer prints it in the handover |
| Hooks slow down unrelated sessions | fail-open with one `stat` when no reel markers in cwd ancestry; measured ≤ 50 ms |
| Command edits look live but aren't (spin finding #2, 2026-10-03) | the harness snapshots `commands/*.md` at plugin load — an edited help block kept serving the old text within the session. When iterating on command wording, restart the session (`claude --plugin-dir …`) before judging the change |

### Spin findings 2026-10-04 (scaffold-one-of-each-form, ~/tmp/spin-*)

**Status 2026-10-04, same session: #3–#6 FIXED in the packs** (doctor
de-reeled + hardened in both Hyperframes packs; footage pack gained the lock
file, an asset manifest and the boundary lines in its BRIEF template;
explainer skeleton ships 10 spec entries; new.md swiftc translation covers
toolchain skew). Verified: `npm run doctor` fully green in BOTH spin
scaffolds; explainer skeleton loads and fails only on placeholder content.
Each pack's MACHINERY_NOTES.md records the delta from the verbatim copy.

What worked: the Step 2 copy recipe (cpio path) with all three `*.reference.*`
exclusions; fonts, gitignores and first receipts; `npm ci` green in both
Hyperframes packs (138 pkgs, ~4 s); all all-form toolchain checks green;
xmllint + Chromium headless shell found for the explainer.

| # | Finding | Fix owner |
|---|---|---|
| 3 | Diagram `npm run doctor` CANNOT pass on a scaffold: it hard-requires `assets/reference/private-integrations.receipt.json`/`.png` (reference-reel capture, never bundled) and reads `BRIEF.md` from `PROJECT` = `production/` while /cmo:new writes it at `<reel>/` (the markdown-home gap, now proven for diagram too). It crashes with a raw ENOENT stack trace instead of a check line — the owner sees exactly what the command promised they never would | de-reel doctor.mjs in the pack (reference check only-if-present; decide markdown home) |
| 4 | Footage pack is missing `HYPERFRAMES_SKILLS.lock.json` (diagram pack has it); its doctor crashes ENOENT on it immediately | add the file to packs/footage/machinery |
| 5 | `swiftc` gate failed with an SDK/toolchain MISMATCH (CLT Swift 6.3.3 vs SDK 6.4) — tools are installed, so /cmo:new's canned "Xcode command-line tools are needed" would mislead; needs a "present but mismatched — update CLT" translation + the FOOTAGE_GUIDE §5 OCR fallback pointer | commands/new.md Step 3 table |
| 6 | Explainer skeleton `story.mjs` ships only 3 spec entries (with a `// 03 … 09 likewise` comment) while SCRIPT.template.md has 10 sections → import throws "Script must have exactly 3 sections" BEFORE checkPreserved, so even the documented expected-fail path is a stack trace, not the receipt message | ship 10 spec entries in story.skeleton.mjs (or derive spec length from SCRIPT.md) |
| 7 | **Live bypass (found by the recorded-dry-run session, 2026-10-04):** every Bash guard keyed project detection off the payload cwd alone, so `cd <reel> && <anything>` sailed through — the 1.1 probe's `npx hyperframes publish` actually REACHED the CLI (publish prompt unanswered; a telemetry ping possibly fired). FIXED same hour, RED-first (suite 86/86): H1+H2 are now GLOBAL (no project needed), H3–H6 arm from cwd AND any `cd` target / path argument; `npm <flags> run` forms now match H4/H5. Deny-before-exec also makes re-probing telemetry-safe | shipped |
| 8 | **Phase-1 live findings (dry-run session, 2026-10-04):** (a) global H1 matched command TEXT, not commands — a heredoc appending a log line that quoted the publish command was denied; fixed RED-first: heredoc bodies are stripped before analysis, newline is a command separator, real commands after a heredoc still deny (89/89). (b) Global denies outside a project left no audit line — now logged to `$CLAUDE_PLUGIN_DATA/hooks.log`. (c) Harness pins the shell cwd to the session start dir (`cd` in a separate call does not persist) — so cd-PREFIX commands are the canonical form in reel work, and the cd/path arming from finding 7 is the load-bearing detection path, not a fallback | shipped |
| 9 | **Format split (dry run, 2026-10-04, serious):** the screenplay lint's contract format (`## S01. / Points: / Narration: / Cues:`) and the footage pack's STORYBOARD_REVIEW + scenes.mjs format (`### 01. / **Right panel:** / > narration`) are two different languages — the lint passed VACUOUSLY on a zero-scene file. Immediate fix shipped RED-first (90/90): `no-scenes` is a finding, never OK. REMAINING WORK (top post-dry-run item): reconcile the formats — either teach the lint the pack format or make the lint format canonical with a scenes.mjs translator in /cmo:screenplay Step 4 | **SHIPPED 2026-10-04**: lint format is canonical; footage skeleton parses it (cues now live in the markdown, scene count derived); explainer parseScript accepts it and strips tags; lint gained `Slot:` validation + `--cues-per-point`; cross-language contract tests drive both skeletons under node (suite 97/97) |
| 10 | **Dry-run friction batch (2026-10-04):** (a) /cmo:new asks a length the footage machinery can't honour (900 s master hardcoded in scenes.skeleton/draft-render/timeline); (b) the swiftc skew on this Mac emits a DIFFERENT message than new.md anticipates ("cannot suppress '~Copyable'…") — key the translation on compiler/SDK mismatch generally; (c) doc drift: /cmo:new puts BRIEF.md at reel root, pack CLAUDE.md says production/; (d) macOS screen-recording filenames carry U+202F before AM/PM — typed paths fail; /cmo:brief should propose renaming to a plain id before registering; (e) /cmo:brief's ~8 single questions fatigued the owner at #4 — propose a filled draft row the owner edits once; (f) agent cost estimates must include ~5k-token startup context (~$0.036 for an echo); (g) filming: pre-size tmux panes (agent pane takes 149 cols, lead squeezed to 64) and clear finished panes before a take | (a) (d) (e) (f doc'd in screenplay.md) SHIPPED in review round 2; (b) swiftc keying + (g) pane sizing remain in prompts/runsheet |
| 11 | **Owner call-out (2026-10-04): "Did we hardcode 15 min into our plugin? This should be based on interview/review."** Correct — the reference reel's commissioned shape survived as constants beyond the 10a fix: verify.mjs demanded exactly 15 scenes and named a "fifteen-minute target", draft-render hardcoded data-duration=900 and a "/ 15:00" label, timeline's error text and 51.2s scene floor were reference pacing, and the skeleton froze act boundaries (DARK_SCENES 01/08/14/15) and the proposal scene (14). ALL de-reeled test-first (109/109): master = final Slot end; scene count = the screenplay's; `Theme:`/`Status:` are per-scene screenplay fields (lint-validated); verify checks brief-length + unique ids; floors overridable via FILM. Principle recorded: lengths and structure come from the brief/screenplay interview — a constant inherited from a reference film is a bug | shipped |
| 6b | BRIEF.template.md has no `title:` field though /cmo:new Step 2 says "title … filled in" (spin used an HTML comment) | add a title line to the three BRIEF templates |

## 15. Open questions

1. Commit the two existing style packs to worktree A's toolkit branch, or
   leave them as tarballs and copies inside this plugin? (asked 2026-09-29)
2. Should `/cmo:brief` call the local transcriber for audio memos, or ask
   the owner to paste notes? (Default: transcribe locally, label fallible.)
3. Marketplace: private HPE marketplace entry, or plain directory install?
   (`claude --plugin-dir <path>` exists in this build; that is the spin
   route.)
4. Explainer Playwright dependency: pin `playwright-core` locally per
   project, or rely on `PLAYWRIGHT_MODULE` / cached headless shell?
5. Where does a reel's markdown live — `<reel>/` (skeleton) or
   `production/` (archive-cut)? Recommend `<reel>/`.
6. ~~Should `/cmo:new` exclude `*.reference.*` on copy?~~ Resolved
   2026-10-03: yes, the command now excludes them on copy and never deletes.

## 16. Decisions log

| Date | Decision |
|---|---|
| 2026-09-29 | Two style packs generated (diagram, footage); forms never mixed |
| 2026-10-03 | Plugin designed (then `reel-studio`); four layers; guardrails pattern |
| 2026-10-03 | Second worktree read: portfolio is seven films, three pipelines; third form added; lessons 39–51 |
| 2026-10-03 | Renamed `cmo-plugin`; agents are `marketing-*` ("our own technical marketing team") |
| 2026-10-03 | Plugin lives in `~/.claude/plugins/cmo-plugin/` |
| 2026-10-03 | Source of truth: every claim needs a source (session, recording row, or owner fact); the truth of a claim is a human judgement. No machine verification of claims will be added (P2a) |
| 2026-10-03 | Packs are self-contained: each ships its reference pipeline in `machinery/` (Hyperframes scripts/tests/pins for diagram and footage; the SecOps Node/Chromium/FFmpeg pipeline with imports rewritten to `lib/` for explainer) plus a `source-receipt.json` naming the worktree, commit and hashes it was copied from. The explainer pack also carries the SecOps reel's documents and hero SVGs under `reference/` for study |
| 2026-10-03 | Every `/cmo:*` command prints help on `help` / `--help` / `-h` / `?` and exits; commands accept pre-answered `--flags` to skip questions |
| 2026-10-04 | **Owner correction — Studio audio was never broken.** The lesson-49 lore ("Studio audio unreliable on two runs") is wrong: the operator didn't know the playback controls; once learned, "it was fine" (owner, verbatim). Corrected in the governance skill, review.md and the risks table. Consequences: /cmo:review now teaches the controls instead of distrusting Studio; fix 5 (review-player port) downgrades from "last machinery gap" to a nice-to-have for non-technical reviewers; the render:review watch-copy path stays (still useful, no longer load-bearing). Filed under: the claims discipline applies to our own documentation |
| 2026-10-05 | **Owner challenge: "make sure we indeed captured this capability before hallucinating that we could."** Verified against the code: the product-capture harness is real (capture-product.mjs + lib/capture.mjs, config-driven Playwright recording — the GTM and Learn films were made with it) but was NOT runnable from a scaffold: the example config was never bundled and Playwright resolved via the original worktree's layout. Fixed test-first (118 tests): resolver bundled pack-locally, path corrected, capture.config.example.mjs shipped with plain-words comments. PM-facing docs calibrated to "the studio sets the capture up with you". HONEST STATUS: live capture has never been exercised from a scaffolded reel — do a real capture run before the PM dry run |
| 2026-10-05 | **FULL END-TO-END TEST COMPLETE (throwaway reel).** Every stage produced a real artifact: scaffold+doctor+swiftc → brief (receipt frozen, register with a real exclusion) → canonical screenplay (lint clean; fact-check declined and recorded) → TTS (owner-approved, 72.6 s) → ASR diagnostic → 9 excerpts (exclusion enforced in code) → OCR focus on every shot → build → 5/5 rewritten project tests → check → render:review watch copy → finish REFUSED the draft → owner-authority skip via approve.py (quote verbatim) → render --approved → finish (loudnorm −16.28 LUFS) → verify 33/33 → producer handover (receipts-only; refused to write while fenced, wrote with relayed receipts; "human review: NOT RECORDED"). Deliverable: 75 s MP4, sha256 4cadf062…. Four pack bugs found and fixed mid-run (PyAV pin, probe-driven VFR, generated-storyboard header, ASR error passthrough) + the session-rooting finding for plugin agents. The toolkit has now made a film |
| 2026-10-04 | **Review round 4: the fix-6 deadlock closed with a review-draft render path.** The reviewer proved the Studio-no-audio fallback circular (watch copy needs render → render needs marker → marker needs the owner to have watched). Fix, test-first (117/117): `npm run render:review` / `render.mjs --review-draft` renders a WATCH COPY with green checks required but NO approval marker; output is forced to `out/review/<id>-REVIEW-DRAFT.mp4` (no --output override), finish refuses any input under out/review (both packs), H4 allows the draft form while still demanding the marker for real renders. Note: a Hyperframes review PLAYER (queued fix 5) needs an encoded MP4 anyway, so this path is its prerequisite, not a rival |
| 2026-10-04 | **External review round 3 (pipeline completeness per form) absorbed.** Test-first where contractable (test_pack_pipelines.py, 5 tests): footage package.json gained prepare:footage/prepare:focus; BOTH Hyperframes packs gained the lesson-42 ASR diagnostic (`npm run pronunciation` — ported transcribe-pronunciation.py + a NEW hyperframes comparator reading assets/audio/NN-<id>.mp3 + voiceover.json; no alias table — spoken() in scenes.mjs is the respelling layer; refuses plainly pre-narrate). cuts.md may run node; assemble records `pronunciation: pending` and continues when the recognizer can't run; review.md requires a 10-s audio check before handing a Studio preview to the owner (two prior failures). Explainer timing.mjs chapter count now derives from the spec (was `!== 10` — finding-11 class). 10b: swiftc translation keyed on the mismatch CLASS. QUEUED with status: review.mjs port to Hyperframes packs (either/or satisfied by the audio check meanwhile); the explainer's artistic de-reeling (illustrations/closing-motion are per-film by design; verify/reel.test reference assertions remain documented in MACHINERY_NOTES); CLT 27.0 install is the owner's one-liner |
| 2026-10-04 | **External review round 2 absorbed, test-first (suite 107/107, v0.2.0).** MUST 2: cd/pushd chains, subshells, `git -C`, `npm --prefix` all arm the guards; heredocs fed to an interpreter (bash/sh/zsh/python/node) are analysed, prose heredocs stay stripped. MUST 3: explainer reels approve/render — H4 scopes check.json to Hyperframes forms; approve.py accepts `out/verification-report.json` (technicalPass + sha256). MUST 4: reviewer agents are Read/Grep/Glob only; producer keeps Write (it IS the handover writer), nobody has Bash. MUST 5: the APPROVED marker is forge-proof (touch/cp/redirect and Write-tool denied; only approve.py) and approve.py requires --by on both paths. MUST 6: H1 covers ssh/sftp/rclone/nc and the media DIRECTORIES, and is DOCUMENTED as best-effort. Carryovers: H5 streams hashes; `git add …fonts/` caught; BRIEF templates have `title:`; /cmo:new may run find/cpio/rsync; cues standardised to 3–6 words (lesson 16) across lint, skills, commands; footage master duration now DERIVES from the final Slot (finding 10a); /cmo:brief drafts-once instead of eight questions (10e) and proposes renaming U+202F recording filenames (10d) |
| 2026-10-04 | **First end-to-end dry run COMPLETE** (owner-driven; steering + execution sessions over SendMessage/SESSION_LOG): /cmo:new → /cmo:brief → /cmo:screenplay to the TTS gate, nothing synthesized; 24 findings; receipt frozen with the owner's 6:08 capture incl. a confirmed exclusion range for a real privacy hit (colleague names on screen); two guard bugs and the lint's vacuous zero-scene pass fixed live mid-run (suite 90/90). **Owner decision: the fact-checker is OPTIONAL** — /cmo:screenplay offers it, records a decline, never blocks. §13 step-5's naive-teammate run (someone who has never opened the repo, observed and timed) remains open. Top open item: finding 9 format reconciliation |
| 2026-10-04 | **Build step 4 shipped (TDD).** Three enforcement tools RED-first (28 tests; suite 83/83): `scripts/receipt.py` (add/verify/rebaseline — freeze is explicit, rebaseline demands the owner's recorded reason; same {id,path,sha256} shape H5 and checkPreserved() verify), `scripts/translate_failure.py` (raw pipeline error → 1–3 plain-English lines with the fix location; unmatched = exit 3 and NO raw echo), `scripts/approve.py` (the ONLY writer of `APPROVED-<fp>`; skip requires the owner's verbatim quote; green check.json required on BOTH paths — the quality floor is not skippable, the approval stop is; integration-tested against the H4 hook). Commands `/cmo:brief`, `/cmo:cuts`, `/cmo:assemble`, `/cmo:review`, `/cmo:deliver` orchestrate those tools; agents `marketing-sync-editor`, `marketing-privacy-reviewer` (lists, never clears), `marketing-producer` (receipts only; `human review: NOT RECORDED` literal) ship read-only |
| 2026-10-04 | **Build step 3 shipped (TDD).** `scripts/screenplay_lint.py` — the machine-checkable slice of story-craft as code (claims tags, lesson-41 taxonomy, lesson-40 ban list, promo words, cue arithmetic, point limits, title length, dispositions-table shape) — contract pinned RED-first by `hooks/tests/test_screenplay_lint.py` (24 tests; suite 55/55). `commands/screenplay.md`: draft in groups of 3–5, lint until clean BEFORE the owner sees a group, fact-check, every CHECK and PENDING stops, scene file written only when clear, verbatim TTS-approval gate recorded in BRIEF.md. `agents/marketing-fact-checker.md`: read-only judgement layer (evidence overreach, number contracts, unlabelled assumptions, maturity inflation, people/agent conflation, chronology splices); output is a PENDING-only dispositions table validated by the lint; it can never approve |
| 2026-10-04 | **Build step 2 shipped.** `hooks/cmo_guard.py` (H1–H6, single entry point, stdlib-only, fail-open outside reel projects) wired via plugin `hooks/hooks.json` on PreToolUse Bash + Edit/Write/MultiEdit/NotebookEdit; contract pinned RED-first by `hooks/tests/test_cmo_hooks.py` (31/31). Reel detection: ancestry holding CMO.md, or hyperframes.json+scenes.mjs, or story.mjs+production.mjs. Denies log JSON lines to `<production>/reports/hooks.log` (payload-derived path, never cwd-relative). Measured ~64 ms median per call (python3 startup floor). Hooks load with the plugin — active from the NEXT session |
| 2026-10-03 | **Spin finding #1 → naming change.** Plugin commands are ALWAYS namespaced `/<plugin>:<command>` (docs: the prefix cannot be removed; frontmatter `name` only replaces the last segment), so the planned bare `/cmo_new` never existed — first launch surfaced `/cmo-plugin:cmo_new`. User decision: plugin `name` is now **`cmo`** (directory stays `~/.claude/plugins/cmo-plugin/`, `displayName` keeps `cmo-plugin`), command files drop the `cmo_` stem, skills drop the `cmo-` prefix → invocations are `/cmo:new`, `/cmo:brief`, … and skills surface as `cmo:story-craft` etc. Supersedes the `/cmo_*` + `cmo-*` naming of the original design |

---

## Appendix A — The 51 lessons

Each is a rule the plugin encodes, with the film that taught it.

### Story and claims

1. **Script is data; everything else is generated.** Learn: `scenes.mjs` →
   tts/record/finish. On-prem: `scenes.mjs` → narrate/build. SDLC:
   `STORYBOARD_REVIEW_V3.md` parsed by `scenes.mjs`. Every hand-maintained
   storyboard drifted within a day.
2. **The owner is the only claims source.** Runbook: "Reference material
   can help with terminology… It does not get to choose the reel's
   argument." Every draft that reasoned from a deck or web page was rejected.
3. **Open on the idea, close by returning to it.** SDLC cut one opened on
   the ticket and read as a challenge-response pitch; V3 opens on the
   operating model. On-prem opens "Are we building a second platform?" and
   answers it verbatim in frame 20.
4. **Preserve the real outcome.** SDLC S13 ends on "Local commit retained /
   Push access blocked / Jira records the state". Never splice later success
   into chronology.
5. **One limit, said once, where it changes the next decision.** The
   "screen-only assertion rule" produced hedging in every sentence; V3
   reversed it. Remove repeated proof disclaimers.
6. **Right panel = conclusions, not transcript.** Three per scene, ≤ ~34
   chars, each on a spoken phrase.
7. **Thread the differentiating idea early.** Telemetry moved from a closing
   S14 into S01 + S04; a test asserts the cut lands before 240 s.
8. **Distinguish people from agents, recordings from handovers.** "Engineer
   three takes up the implementation"; never imply a filmed handover.
9. **Assumptions said once and labelled on screen**, never contradicted by a
   green check.
10. **A number needs a source, interval, definition and denominator.** The
    15-minute SDLC reel reports zero productivity metrics because there was
    no comparable baseline; S14 says so in one sentence.
11. **The proposal scene is a question** over real artifacts labelled
    PROPOSED; no mock-up of the artifact that does not exist.
12. **Close with an invitation, not a CTA.**

### Sync and timing

13. **Word-boundary timestamps from TTS are the clock.** Edge TTS 7.2.8
    `WordBoundary`; reveals bound to phrases (`tokens()`-normalised,
    exact-once, `at = offset + wordStart`), never to guessed seconds.
14. **Measured speech sets durations.** Learn v1 drifted ~8 s video / ~11 s
    audio over 7 min (Playwright video clock ≠ wall clock); fix: 16×16
    magenta marker per scene scanned at 30 fps. SDLC: fixed 900 s master,
    throws if avg tail > 1.95 s. On-prem: min scene 8 s.
15. **Change the words and everything downstream moves — by design.**
16. **Cues must resolve exactly once** or the build fails; 3–6 words.
17. **Spoken vs displayed spelling are separate layers.** `spoken()`
    (OPSEXT → "O P S E X T", ITOM → "eye tom") mirrored by
    `displayCaption()`. Test every product name before synthesising.
18. **Captions: two lines × 42 chars, ≤ 6 s, split at sentence ends,
    selectable `mov_text` + SRT, never burned in.** Caption-zone check is
    error-severity.

### Footage

19. **Fixed crop chosen by OCR from what the narration names.** Default: no
    rectangle; camera `tl.set` once per excerpt, never `tl.to`. Rectangles
    ≤ 2 per film; shipped with zero.
20. **Record continuously, native res, silent, with handles.** Excerpts
    `fps=30, scale=2560:-2, h264_videotoolbox 12 Mbps, +faststart`; VFR
    sources need `trim` not `-ss`; `.partial.mp4` then rename; receipts
    fingerprint shot + source + profile.
21. **Label everything a viewer could misread.** Source strip
    `<actor> / <mm:ss> / excerpt at 1x`; `HELD FRAME`; amber boundary
    labels; `RECORDING PENDING` only for agreed missing captures;
    `DRAFT nn / <status>` until final.
22. **Speed is always 1x; shorten the excerpt instead.**
23. **Exclusion ranges are code, not notes.** `prepare-footage.mjs`
    hard-fails the lock-screen and unrelated-chat ranges.
24. **Evidence register before screenplay**, with a "does not establish"
    column that becomes the claim boundary.
25. **Redaction reviews the full moving footage, not sampled frames.**
    Receipts carry "redaction review pending" until a named person signs.
26. **Footage never leaves the machine.** Only narration text goes to Edge
    TTS, after owner approval for external speech processing.
27. **Playwright capture traps:** lazy routes need real `page.goto`; regular
    Chromium lost the bottom ~87 px of recorded video while screenshots were
    fine — use the headless shell and inspect actual video.

### Visual system

28. **One palette, three frames.** 15 tokens (forest #061C19, warmCanvas
    #F3F4ED, green #01A982, amber #F4B942 …), HPE Graphik 400/500/600/700,
    88 px edge, 160 px caption band, 1920×1080@30. Never mix forms.
29. **Colour is grammar.** Green = structure / active relationship; amber =
    boundary, risk or question; mint = connected evidence; blue = human
    authority; footage keeps its own colours.
30. **Motion follows meaning.** 0.44 s dissolves on scene boundaries only;
    one settle-in zoom when the product first appears; no pans, bounces,
    spins, glows, loops, speed changes.
31. **Fonts are licensed, internal, local.** Never from network, never in
    public source or hosted assets.

### Production discipline

32. **Pin everything and record the pins** (§12). Upgrade = full review.
33. **Automated checks never approve a film.** Handover names reviewer,
    hash, what was watched/heard, findings.
34. **New cut, new filename; re-run only the affected stages.**
35. **Gates are human and sequential:** evidence → brief → screenplay
    (+TTS approval) → cuts → assembly → quality → review → delivery → human
    review. Render refuses without approval + matching fingerprint.
36. **Studio handoff = `preview --background`**, never a backgrounded
    `npm run dev`.
37. **Delivery target is fixed:** H.264 1080p30 BT.709, AAC 48 kHz 192 kb/s,
    loudnorm two-pass I=-16 TP=-1.8 LRA=7, selectable captions + SRT,
    chapters, exact master duration, full decode, contact sheets.
38. **Give an estimate before anything that costs** (TTS, render).

### From the second worktree (2026-10-03)

39. **A third form exists: the illustrated explainer** — vector plates,
    progressive states, no footage, no Hyperframes (the owner refused it for
    the SecOps reel).
40. **Organization-first, never an audit.** The rejected cut led with repo
    evidence and PR counts; the approved film leads with the organizational
    change. Ban contributor roll calls, PR statistics, test counts, file
    paths, command inventories from narration.
41. **Status-label taxonomy:** CURRENT REPOSITORY SNAPSHOT · MERGED IN THE
    TWIN · WORKING PROTOTYPE · APPROVED PROPOSAL · NOT SHIPPED · IMPLEMENTED
    PROPOSAL · UNDER REVIEW · OPEN · NOT YET RUN. "In production" is never
    shorthand for "in the Twin".
42. **Pronunciation is verified by listening, not metadata.** `Sec Ops` was
    spoken "Secretary Ops"; found by local faster-whisper on the real audio,
    report bound to audio hashes. Fix `Seck-ops`; literal respellings of
    "security" made it worse.
43. **Independent reviewer gate + dispositions table.** Pause for a named
    reviewer with numbered questions; every finding gets a
    finding / resolution / evidence row.
44. **Preservation receipts before every step.** Hash-check inputs and prior
    films; new cut = new generation folder; approved narration reused
    byte-for-byte; only changed sections synthesised; never splice films.
45. **Duration guards are code:** film window, closing ≤ 12 s, stale inputs,
    too-short picture states all hard-fail.
46. **Capture can expose a product bug — document, route around, never fix
    or inject.** GTM's history-dedup defect: alternate valid collector via
    the real UI; both digests recorded; "not fixed" stated.
47. **Editorial summaries are labelled** "EDITORIAL SUMMARY · CAPTURED
    ASSESSMENT", original UI kept below.
48. **Owner authority can skip gates — recorded.** "Finish without further
    approval stops" is honoured and logged verbatim.
49. **Ship a local review player** (`out/review.html`) — embedded captions,
    chapter jumps; better than Studio for a non-technical owner.
50. **Cue offsets differ per pipeline** (0.35 s vs 0.40 s); never import
    another pipeline's offsets blindly.
51. **An audio memo can be the brief.** Explicit source hierarchy; transcript
    is an aid, fallible on acronyms; unconfirmed names stay generic until
    the owner confirms.
