# cmo-plugin

**Our own technical marketing team, as a Claude Code plugin.**

Make a branded, fact-checked, narrated product film by having a conversation.
You answer one question at a time, approve text, look at two frames and say
yes or no, and watch a draft and leave timestamped notes. The plugin does
the rest, and refuses to do the parts that must stay human.

Status: **v0.2.0, proven end to end 2026-10-05.** All seven commands, four
marketing agents, hooks H1–H6 and the enforcement tools are built (117
tests), and the full pipeline has delivered a real film: a 66-second
throwaway test reel that went brief → screenplay → narration → cuts →
assembly → owner review ("the voice feels slow" → fixed cut in minutes) →
delivery, closing its production record with "This film is done." Every
`/cmo:*` command prints usage on `/cmo:<x> help`.

The teammate-facing introduction — what this is, the three film forms, the
craft it hands you, how to use it — is `docs/cmo-studio.html` in the aigile
repo (standalone page; not part of the coding-flow docs by owner decision).

Still open before handing to a teammate: distribution packaging (this is
one local directory loaded with `--plugin-dir`) and the observed
first-timer run (DESIGN.md §13 step 5). Production sessions must be opened
IN the reel's folder — agents cannot read files outside the session root.

## What exists today

| Piece | State |
|---|---|
| `DESIGN.md` | the design of record, 51 lessons, build plan |
| `packs/diagram/` | architecture-journey style: guides, templates, Hyperframes machinery, fonts |
| `packs/footage/` | evidence style (real recordings): guides, templates, machinery, OCR helper, fonts |
| `packs/explainer/` | illustrated-explainer style (no Hyperframes): guides, templates, self-contained Node/Chromium/FFmpeg machinery, reference reel, fonts |
| `skills/*` | five craft skills: story, narration, footage, frame-and-motion, governance |
| `commands/new.md` | the first gate; `/cmo:new help` prints usage and exits |
| `commands/screenplay.md` | drafts in groups, lint-gated (`scripts/screenplay_lint.py`), fact-checked, CHECK-stopped, TTS gate |
| `commands/brief.md, cuts.md, assemble.md, review.md, deliver.md` | the full pipeline; receipt/translator/approve tools in `scripts/` |
| `agents/marketing-fact-checker.md` | read-only claims auditor; dispositions-shaped output; cannot approve |
| `agents/marketing-{sync-editor,privacy-reviewer,producer}` | read-only reviewers + receipts-only handover writer; none can approve |
| `hooks/` | H1–H6 in `cmo_guard.py` + `hooks.json`; full suite 117 tests (`hooks/tests/`) |

## Three forms, one brand

| You have | Form | Proven length |
|---|---|---|
| Real screen recordings, or a product to capture | **footage** | 10–15 min |
| Systems and how they connect, for an audience with a worry | **diagram** | 10–13 min |
| A way of working, a model, a policy; nothing to show | **explainer** | 5–6 min |

Never mixed in one film. Same narrator, same palette, same fonts, same
delivery spec.

## First reel in five steps

1. `/cmo:new` — pick the form, get a project folder.
2. `/cmo:brief` — say who watches and what must be true; confirm every fact.
3. `/cmo:screenplay` — approve the words, three to five scenes at a time;
   approve them for speech.
4. `/cmo:cuts` (footage) → `/cmo:assemble` — say yes or no to crop frames;
   the assembler loops until green.
5. `/cmo:review` → `/cmo:deliver` — watch in the review player, leave notes;
   name the human who watched the final hash.

## Rules the plugin enforces for you

- Every spoken sentence traces to a source: a captured session, a
  recording's register row, or a fact you confirmed. Whether it is *true* is
  your judgement, not the plugin's.
- Footage, fonts and generated media never leave the machine and never
  enter git.
- Only narration text you approved goes to the speech service.
- Nothing renders without your approval marker, and nothing is called
  "done" without a named human who watched it.

## Install

```bash
# already at ~/.claude/plugins/cmo-plugin on this machine
# for a teammate: copy the folder to their ~/.claude/plugins/ (internal channels only — the fonts are licensed)
```

HPE Graphik OTFs inside the packs are HPE-internal. Do not publish this
plugin to a public marketplace or repository.

## Where the craft came from

Seven films across two worktrees: Learn reel, Digital Twin toolkit film,
on-prem architecture journey, SDLC evidence reel, Digital Twin engineering
film, GTM enablement reel, Shift-left SecOps story. `DESIGN.md` §5 lists
them; Appendix A is the 51 lessons they taught.
