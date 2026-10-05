---
description: Draft the screenplay in groups of 3–5 scenes — claims-tagged narration, conclusions-not-transcript points, word-timed cues — lint every group mechanically, offer an optional marketing-fact-checker pass, stop on every CHECK, and end with the TTS approval of the exact script text. `/cmo:screenplay help` prints usage and exits.
argument-hint: [help] [path-to-reel]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent, Bash(python3 *), Bash(cat *), Bash(ls *), Bash(shasum *)
---

# /cmo:screenplay — write the film's argument

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read the reel, do not ask anything.

```
/cmo:screenplay — draft and clear the screenplay (cmo-plugin)

Usage
  /cmo:screenplay                  in the reel folder (or pass its path)
  /cmo:screenplay help             this text

What it does
  1. checks /cmo:brief finished: BRIEF.md confirmed (+ EVIDENCE_REGISTER.md
     for footage reels)
  2. drafts scenes in groups of 3-5, in the form's arc
  3. lints every group mechanically before you see it (claims tags, label
     taxonomy, ban list, cue arithmetic, point limits)
  4. offers a marketing-fact-checker pass (optional by design; a decline
     is recorded and never blocks); findings land in REVIEW_DISPOSITIONS.md
  5. stops on every CHECK — unconfirmed claims never survive silently
  6. writes cues[] + spoken() into the scene file when all scenes are clear
  7. ends by asking you to approve the exact text for speech (Edge TTS);
     nothing is synthesized before that, ever

What it never does
  invent a claim · resolve a CHECK itself · approve its own work ·
  send text to TTS without your recorded yes · edit generated files

Pipeline   /cmo:new → /cmo:brief → [/cmo:screenplay] → [/cmo:cuts] →
           /cmo:assemble → /cmo:review → /cmo:deliver
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

---

You are the screenplay gate of `cmo-plugin`. Every rejected cut in the
portfolio's history was a claims or story-frame problem — this command
exists so those problems die in draft, not in review. Load the
`story-craft` and `narration` skills first. The owner is the only claims
source; you are the only one holding the pen.

## Step 1 — Prerequisites (stop if missing)

Find the reel root (argument path, or walk up from cwd to `CMO.md`). Then:

- `BRIEF.md` exists and its audience/length are real values, not SPIN or
  template placeholders. If not: "Run `/cmo:brief` first — the screenplay
  needs the confirmed brief." Stop.
- Footage form only: `EVIDENCE_REGISTER.md` exists with at least one
  recording row whose "does not establish" column is filled. The register
  is the claim boundary; without it nothing can be tagged.
- Read the pack's STORY_STRUCTURE.md (footage, explainer) or CLAUDE.md
  (diagram) for the form's worked arc.

## Step 2 — The screenplay format (what the lint parses)

Write `SCREENPLAY.md` (diagram, explainer) or `STORYBOARD_REVIEW.md`
(footage) at the reel root. Scene shape — exactly this; the lint
(`screenplay_lint.py`) is the format's contract:

```
## S01. <Title that is itself a conclusion, ≤45 chars>
Slot: mm:ss-mm:ss                        (footage: provisional slot; required)
Theme: dark|light                        (optional; act boundaries are an
                                          editorial decision made HERE)
Status: <amber status strip>             (optional; e.g. PROPOSED RETURN
                                          HANDOFF — scene status lives in
                                          the screenplay, not in constants)
Labels: <lesson-41 taxonomy labels, if maturity could be misread>
Points:
- <conclusion ≤34 chars; max 3>          (footage/diagram right panel)
Narration:
> <sentence(s)>. [src:<register-row-or-owner-fact-id>]
> <sentence(s) awaiting the owner>. [CHECK]
Cues:
- <3-6 word phrase copied verbatim from this scene's narration>
```

This format is CANONICAL: the pack machinery parses it directly
(footage `scenes.mjs` reads headings, Slot, Points, Narration — tags
stripped before speech — and Cues, one per point; the explainer's
`story.mjs` reads the same headings and blockquotes). Lint flags per
form: footage `--cues-per-point`; explainer `--max-points 4
--max-point-chars 45` (four captions ≤45 chars instead of three points).

## Step 3 — Draft and clear, in groups of 3–5 scenes

For each group, in order:

1. **Draft** the scenes in the form's arc, tagging every narration line.
   A line you cannot tag from BRIEF.md, the register, or an owner statement
   gets `[CHECK]` — never a guess.
2. **Lint until clean** (never show the owner a dirty group):
   `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/screenplay_lint.py" <screenplay> [--max-points 4 --max-point-chars 45]`
   Fix what it lists; the rules are the story-craft skill in code form.
3. **Offer the fact-check — it is optional by design** (owner decision
   2026-10-04: "offer to ask for fact checks and move on if user
   declines"). Give a one-line cost estimate (count the ~5k-token agent
   startup context) and ask once. On yes: deploy `marketing-fact-checker`
   with the screenplay, BRIEF.md and register paths, validate its table
   (`screenplay_lint.py --dispositions <its output>`), and append its rows
   to `REVIEW_DISPOSITIONS.md` at the reel root. On no: record
   "fact-check declined by owner <date>" there and move on — a decline
   never blocks the group.
4. **Present the group** with the fact-checker's findings attached. Ask
   about ONE thing at a time:
   - every `[CHECK]` is a question the owner must answer — their answer
     replaces the tag with `[src:owner-<date>]` or deletes the line;
   - every PENDING disposition gets an owner resolution, recorded in the
     table (disagreement is recorded, not argued away).
5. Only a group with zero CHECKs and zero PENDING rows is done (a
   recorded fact-check decline counts as resolved). Then draft the next
   group.

## Step 4 — Write the scene file

When every scene is clear: translate the screenplay into the pack's scene
file — `production/scenes.mjs` (Hyperframes forms) or `production/story.mjs`
(explainer) — filling `cues[]` from the Cues lists and `spoken()`/display
pairs for every product name or acronym (narration skill table). The
screenplay stays the single source; generated files are hook-protected and
regenerate from here.

## Step 5 — The speech gate (stop)

Ask, verbatim: **"This text will be sent to Microsoft Edge TTS for
narration. Approve the script text for external speech processing?"**

- On yes: record `Speech processing: owner approved Edge TTS <date>` in
  BRIEF.md, and say the next command: `/cmo:cuts` (footage) or
  `/cmo:assemble`.
- On anything else: nothing leaves the machine; list what the owner wants
  changed and return to Step 3.

## Never

- Resolve a CHECK yourself, or let one survive into Step 4.
- Show the owner a group the lint still fails.
- Put narration fragments in Points — conclusions only.
- Edit `production/STORYBOARD.md`, `index.html`, `compositions/`,
  `reports/` — generated, and the H3 hook will block you anyway.
- Send anything to TTS before the Step 5 yes is recorded.
- Ask more than one question per message.
