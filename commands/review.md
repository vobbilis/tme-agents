---
description: Put the cut in front of the owner — local review player with captions and chapter jumps — collect timestamped notes one at a time, map each to its scene, re-run only affected stages, and write the approval marker (or a logged owner-authority skip) that unlocks rendering. `/cmo:review help` prints usage and exits.
argument-hint: [help] [path-to-reel]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent, Bash(python3 *), Bash(npm run *), Bash(node *), Bash(ls *), Bash(cat *), Bash(open *)
---

# /cmo:review — the owner watches

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read the reel, do not ask anything.

```
/cmo:review — watch the cut, give notes, approve (cmo-plugin)

Usage
  /cmo:review                      in the reel folder (or pass its path)
  /cmo:review help                 this text

What it does
  1. requires a green assembly (reports/check.json ok)
  2. builds the local review player (out/review.html — captions, chapter
     jumps, works from file://) and opens it for you; Studio preview is
     the fallback, never a backgrounded dev server
  3. optionally runs the review agents first (sync-editor,
     privacy-reviewer) so their findings reach you with the cut
  4. takes your notes one at a time ("2:41 the label is wrong"), maps each
     to its scene, appends it to REVIEW_DISPOSITIONS.md, re-runs only the
     affected stages, and offers the cut again
  5. on your "approved": writes the approval marker bound to this exact
     cut's fingerprint — the only key that unlocks /cmo:deliver. An
     owner-authority skip is honored and logged verbatim

What it never does
  approve anything itself · render the deliverable · treat silence or a
  general "go" as a skip · lose a note

Pipeline   /cmo:new → /cmo:brief → /cmo:screenplay → [/cmo:cuts] →
           /cmo:assemble → [/cmo:review] → /cmo:deliver
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

---

You are the cut-review gate of `cmo-plugin`. Everything before this was
machinery; this is where the owner's eyes decide. Load the `governance`
skill (review player, dispositions, owner-authority skip).

## Step 1 — Prerequisites

`production/reports/check.json` must exist and be ok. If not: "The cut is
not green yet — run /cmo:assemble." Stop.

## Step 2 — Reviewers before the owner (optional, offer once)

Offer, with a one-line cost estimate each, to run `marketing-sync-editor`
and (footage) `marketing-privacy-reviewer` on the reports. On a yes,
deploy them read-only; validate each table
(`python3 "${CLAUDE_PLUGIN_ROOT}/scripts/screenplay_lint.py" --dispositions …`)
and append the rows to `REVIEW_DISPOSITIONS.md`. Their findings go in
front of the owner WITH the cut; they clear nothing themselves.

## Step 3 — The review player

Build `out/review.html` with the pack's review script (`npm run review` or
`node review.mjs` — read package.json): embedded captions, chapter jumps,
the verification summary, the "not yet humanly reviewed" notice. Open it
for the owner. If the pack has no player script, fall back to
`HYPERFRAMES_NO_TELEMETRY=1 npx hyperframes preview --background` on a free
port. Studio works — but its playback controls are not obvious to a
first-time reviewer (owner-confirmed 2026-10-04: the two historical "no
audio" reports were operator unfamiliarity, not a Studio defect). So walk
the owner through the controls before the first scene, and do a 10-second
sound check together. If playback still won't cooperate, render a watch
copy: `npm run render:review` (green checks required, NO approval marker;
lands at `out/review/<id>-REVIEW-DRAFT.mp4`; finish/deliver refuse it, so
it can never ship). Stop the preview after the session.

## Step 4 — Notes, one at a time

Take each owner note ("at 2:41 …"), map the timestamp to its scene via
`reports/timeline.json`, record it as a dispositions row (Finding = scene +
the owner's words; Resolution = what was changed; Evidence = where), apply
the fix in the single source, re-run only the affected stages (iterate
table), and offer the cut again. Repeat until the owner is done.

## Step 5 — The approval (the only thing that unlocks rendering)

When the owner says the cut is approved:

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/approve.py" --reel <reel> --by "<owner's name>"
```

If the owner instead authorizes finishing without further stops (lesson
48), record their words VERBATIM:

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/approve.py" --reel <reel> --skip --quote "<their exact words>" --by "<name>"
```

A skip is never inferred from silence or a general "go" — if in doubt, ask
the one question. Both paths still require the green check (the tool
refuses otherwise). Then: "Run `/cmo:deliver` for the final render."

## Never

- Write the approval marker by hand or on your own judgement.
- Re-run the whole pipeline for a one-scene note.
- Leave a Studio preview running after the review.
- Ask more than one question per message.
