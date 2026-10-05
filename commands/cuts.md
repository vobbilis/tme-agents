---
description: Footage reels only — turn the approved screenplay into the shots map and real excerpts, cue-timed narration first, OCR-chosen fixed crops, one yes/no per shot. Documents capture-exposed product bugs instead of fixing them. `/cmo:cuts help` prints usage and exits.
argument-hint: [help] [path-to-reel]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Bash(python3 *), Bash(npm run *), Bash(node *), Bash(ffprobe *), Bash(ls *), Bash(cat *)
---

# /cmo:cuts — cut the footage

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read the reel, do not ask anything.

```
/cmo:cuts — footage reels: from screenplay to real excerpts (cmo-plugin)

Usage
  /cmo:cuts                        in the reel folder (or pass its path)
  /cmo:cuts help                   this text

What it does
  1. requires: screenplay cleared by /cmo:screenplay, TTS approval
     recorded, inputs frozen (it verifies the receipt first)
  2. builds the shots map from the screenplay: which recording, which
     range, at 1x, with provenance labels
  3. runs narrate → prepare-footage → prepare-focus; every failure reaches
     you as plain English, never a stack trace
  4. shows you the first and last frame of every shot's crop and asks ONE
     yes/no each: "is what the narrator names readable and in frame?"
  5. if capture exposed a product bug: documents it in CAPTURE_NOTES.md
     and routes around it through the real UI — never fixes, never injects

What it never does
  speed up or loop footage · touch an exclusion range · fix a product bug
  on camera · proceed past a shot you have not cleared

Pipeline   /cmo:new → /cmo:brief → /cmo:screenplay → [/cmo:cuts] →
           /cmo:assemble → /cmo:review → /cmo:deliver
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

---

You are the footage gate of `cmo-plugin`. Footage is the one thing a slide
cannot fake — which is exactly why nothing here may be faked. Load the
`footage` and `frame-and-motion` skills first. This command applies only to
footage reels; for other forms, say so and point at `/cmo:assemble`.

## Step 1 — Prerequisites (stop if missing)

- The screenplay has zero `[CHECK]` tags and zero PENDING dispositions.
- BRIEF.md records `Speech processing: owner approved Edge TTS <date>`.
- `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/receipt.py" verify --reel <reel>`
  prints OK — frozen inputs only.

## Step 2 — The shots map

From the screenplay, fill `production/scripts/lib/shots.mjs`: per scene,
the source recording (register row), the excerpt range, and the OCR target
text the narration names. Rules that are not negotiable (footage skill):
speed is always 1x; exclusion ranges from the register become hard-failing
code; every excerpt carries its provenance label (`<actor> / <mm:ss> /
excerpt at 1x`, `HELD FRAME`, amber boundary labels); a fixed crop
rectangle only under the lesson-19 conditions, at most two per film.

## Step 3 — Run the pipeline, translate every failure

In `production/`, in order: `npm run narrate`, `npm run prepare:footage`
(or the pack's script name — read package.json), `npm run prepare:focus`.
On any failure, pipe the output through
`python3 "${CLAUDE_PLUGIN_ROOT}/scripts/translate_failure.py" --step <name>`
and show the owner ONLY the translation (exit 3 = untranslated: summarize
the failure in one plain sentence yourself and record the raw tail in
`reports/` for the toolkit to learn from). Estimate cost before narrate
(words ÷ rate; Edge TTS is an external call for already-approved text).

## Step 4 — One yes/no per shot

For each shot, show the first and last crop frame (from
`reports/focus-tracking/`) and ask exactly one question: **"Is what the
narrator names readable and in frame?"** A no reopens that shot's map
entry; nothing else moves until the shot is cleared.

## Step 5 — Capture bugs (lesson 46)

If capture exposes a product defect: record both digests and the behavior
in `CAPTURE_NOTES.md` ("not fixed"), pick a valid route through the real
UI, and tell the owner. Never fix the product, never inject data.

## Step 6 — Hand off

Say which shots are cut and cleared, where CAPTURE_NOTES.md is if it
exists, and: "Run `/cmo:assemble` when you are ready."

## Never

- Cut inside an exclusion range, or within a recording's unprobed region.
- Imply a filmed handover between people (lesson 8).
- Ask more than one question per message.
