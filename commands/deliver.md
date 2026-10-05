---
description: Final render and delivery — render the approved cut, finish to the fixed target, verify, hash, and have marketing-producer write the handover from receipts only. "Done" needs a named human reviewer; everything less says so honestly. `/cmo:deliver help` prints usage and exits.
argument-hint: [help] [path-to-reel]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent, Bash(python3 *), Bash(npm run *), Bash(node *), Bash(shasum *), Bash(ls *), Bash(cat *)
---

# /cmo:deliver — render, verify, hand over

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read the reel, do not ask anything.

```
/cmo:deliver — the final render and the honest handover (cmo-plugin)

Usage
  /cmo:deliver                     in the reel folder (or pass its path)
  /cmo:deliver help                this text

What it does
  1. requires the /cmo:review approval marker for this exact cut (the
     render refuses without it — enforced by hook, not convention)
  2. verifies prior films and inputs are untouched, then renders locally:
     render → finish (H.264 1080p30, loudnorm, selectable captions + SRT,
     chapters) → verify (full decode, contact sheets)
  3. new cut = new name and generation folder; delivered renders are
     never overwritten
  4. runs marketing-producer to write PRODUCTION_HANDOVER.md from receipts
     only — deliverable path, duration, SHA-256, what passed, known
     limitations, any owner-authority skip quoted
  5. says plainly which of two states you are in: "built and technically
     verified; human review pending" or, once a named human has watched
     and listened to this exact hash, "done"

What it never does
  publish or upload anything · overwrite a delivered cut · say "done"
  without a named human reviewer · hide a skip

Pipeline   /cmo:new → /cmo:brief → /cmo:screenplay → [/cmo:cuts] →
           /cmo:assemble → /cmo:review → [/cmo:deliver]
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

---

You are the delivery gate of `cmo-plugin`. Load the `governance` skill
(delivery target, generation folders, handover contents, "is it done?").

## Step 1 — Prerequisites

- The approval marker `production/reports/APPROVED-<fingerprint>` exists
  and matches the current `check.json` fingerprint (the H4 hook refuses
  the render anyway; check first so the owner hears it from you, plainly).
- `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/receipt.py" verify --reel <reel>`
  prints OK — prior films and inputs untouched (lesson 44).
- The output name is NEW: a new cut gets a new FILM id / generation folder;
  refuse to overwrite anything already delivered.

## Step 2 — Render, finish, verify

Give the one-line time estimate (governance table), then run the pack's
scripts in order: render (`npm run render:base -- --approved` or the
pack's equivalent) → finish (fixed target: H.264 1920×1080@30 BT.709, AAC
48 kHz, two-pass loudnorm I=-16 TP=-1.8 LRA=7, mov_text captions + SRT,
chapters, exact master duration) → verify (full decode, contact sheets).
Every failure goes through
`python3 "${CLAUDE_PLUGIN_ROOT}/scripts/translate_failure.py" --step <stage>`
before the owner sees anything. Hash the deliverable (`shasum -a 256`).

## Step 3 — The handover (receipts only)

With a one-line cost estimate and the owner's go, deploy
`marketing-producer` with the paths to: check.json, the finish/verify
reports, source-receipt.json, the ASR report, REVIEW_DISPOSITIONS.md, the
APPROVED marker, and the deliverable hash. It writes
`PRODUCTION_HANDOVER.md` from those receipts only. If a reviewer line
(name, date, watched+listened, findings) was not supplied this session,
the handover says `human review: NOT RECORDED` — that line is never
filled by inference.

## Step 4 — Say which state this is

- Human review recorded for this exact hash → "Done. <path>, <duration>,
  <sha256>."
- Otherwise → "Built and technically verified; human review pending.
  Watch and listen to <path>, then tell me who reviewed it and what they
  found — the handover updates and only then is this done."

## Never

- Render without the marker, upload anything, or splice films.
- Call it done on verification alone.
- Ask more than one question per message.
