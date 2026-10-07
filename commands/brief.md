---
description: Turn the owner's intent and raw inputs into the frozen brief — one question at a time, source hierarchy applied, every recording probed and bounded by what it does NOT establish, every input registered in the preservation receipt. `/cmo:brief help` prints usage and exits.
argument-hint: [help] [path-to-reel]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Bash(python3 *), Bash(ffprobe *), Bash(ls *), Bash(cat *), Bash(shasum *)
---

# /cmo:brief — freeze the inputs

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read the reel, do not ask anything.

```
/cmo:brief — intake the evidence and freeze the inputs (cmo-plugin)

Usage
  /cmo:brief                       in the reel folder (or pass its path)
  /cmo:brief help                  this text

What it does
  1. deepens BRIEF.md one question at a time (audience, takeaway, length,
     claim boundary), applying the source hierarchy: your latest word >
     your memo > supplied documents > prior reels (style only)
  1b. registers your PDFs and decks as GRADED sources: each gets an
     extract with page/slide anchors and a register row saying what it
     may ground (terminology, scope, product facts) and what it may not —
     a document never chooses the film's argument
  2. accepts an audio memo as the brief source; transcripts are an aid,
     fallible on acronyms — unconfirmed names stay generic
  3. footage reels: probes every recording (ffprobe), asks what each shows,
     what it does NOT establish, and the exclusion ranges; writes
     EVIDENCE_REGISTER.md and stops until you confirm it
  4. registers every input in the preservation receipt — from then on,
     every production step refuses if an input changes
  5. tells you the next command: /cmo:screenplay

What it never does
  treat a deck or web page as a claims source · leave a recording
  unregistered · guess what footage establishes · rebaseline silently

Pipeline   /cmo:new → [/cmo:brief] → /cmo:screenplay → [/cmo:cuts] →
           /cmo:assemble → /cmo:review → /cmo:deliver
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

---

You are the intake gate of `cmo-plugin`. After this command, the inputs are
frozen and the claim boundary is written down — everything downstream
traces back to what you capture here. Load the `story-craft` skill
(source hierarchy, claims rule) and, for footage reels, the `footage`
skill (register, exclusion ranges, recording checklist).

Find the reel root (argument path, or walk up from cwd to `CMO.md`); read
`BRIEF.md` and the receipt (`production/reports/source-receipt.json` or
`production/out/source-receipt.json`) to see what is already there.

## Step 1 — The brief: draft once, confirm once

(Dry-run finding, 2026-10-04: eight one-at-a-time questions tired the owner
by number four. Don't interrogate — draft.) Read everything already on
hand (MEMO, /cmo:new answers, documents), then present ONE message: a
filled draft of every BRIEF.md field below, each marked [from <source>] or
[GUESS]. Ask the owner to correct anything wrong and confirm the rest in
one reply. Only fields the owner corrects get a follow-up; a field you had
NO basis to draft is asked as its own single question. The fields:

1. **Sources on hand?** Memo (audio or text), documents, prior reels. Write
   the hierarchy into BRIEF.md verbatim: owner's latest follow-up > memo >
   supplied documents > prior reels (style only). Decks and web pages are
   never a claims source. An audio memo is a first-class brief (lesson 51):
   transcribe locally if tooling exists, flag acronym guesses, and keep
   unconfirmed names generic ("shared security harness") until confirmed.
2. **The one-sentence takeaway** the audience should repeat afterwards.
3. **Audience**, exactly who.
4. **Claim boundary** — what this film must NOT claim (no acceptance, no
   production status, no metrics without a baseline…). Future state is
   said as future state.
5. **Owner-confirmed facts** — names, counts of people, approvals; each
   gets an id (`owner-<topic>-<date>`) you will cite in `[src:…]` tags.

## Step 2 — Footage only: the evidence register

For every recording in the reel folder (`*.mov`, `*.mp4` at the reel root):

1. If the filename came from macOS screen recording, it carries an
   invisible narrow no-break space before "AM"/"PM" — typed paths will
   fail. Offer to rename it to a plain id first (e.g. `session-1129.mov`);
   register the renamed file.
2. Probe it: `ffprobe -v error -show_format -show_streams <file>` —
   duration, resolution, fps go in the register row.
3. Draft the full register row yourself from the probe and what you can
   see (shows / does **not establish** / exclusion ranges for lock
   screens, unrelated windows, chats), then ask the owner to correct and
   confirm the ROW in one reply — not field by field.
4. Write `EVIDENCE_REGISTER.md` rows — the "does not establish" column is
   the claim boundary; exclusion ranges later become code in
   `prepare-footage` (lesson 23).
5. **Stop** and ask the owner to confirm the register before going on.

## Step 2b — Documents: register and GRADE them

For every PDF and PowerPoint in the reel folder:

1. Extract it so it can be cited and checked:
   `uvx --with pypdf==6.19.0 --with python-pptx==1.0.2 python3 "${CLAUDE_PLUGIN_ROOT}/scripts/extract_source.py" <file> --output sources/<id>.extract.md`
   The extract carries page/slide anchors and the original's hash. A
   scan with no extractable text is reported plainly — ask the owner for
   a text version.
2. Draft ONE register row per document in EVIDENCE_REGISTER.md (a
   "Documents" table): what it is, and — the column that matters — what
   it MAY GROUND (terminology, principles, scope, product facts, dates)
   and what it may NOT. Example: a sales deck grounds product names and
   principles, never outcomes or metrics. The owner corrects and
   confirms the table once, not row by row.
3. A document never chooses the film's argument, whatever its grade —
   that stays the owner's alone (the rule that cost a full cut).
4. Register BOTH files in the receipt (original and extract), so a
   drifted source invalidates its citations:
   `… receipt.py add --reel <reel> --id doc-<id> --path <file>`
   `… receipt.py add --reel <reel> --id doc-<id>-extract --path sources/<id>.extract.md`

Narration cites a document as `[src:doc-<id>-p<n>]` (page) or
`[src:doc-<id>-s<n>]` (slide); the fact-checker greps the extract.

## Step 3 — Freeze everything

Register every input — memo, documents, each recording, and every prior
film this reel must leave untouched:

```
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/receipt.py" add --reel <reel> --id <id> --path <file>
```

Then prove the freeze: `… receipt.py verify --reel <reel>` must print OK.
If an input must change later, that is a rebaseline — the owner's reason
recorded, never implicit.

## Step 4 — Hand off

Tell the owner: what was frozen (ids + count), where the register and
brief live, that nothing has been sent anywhere, and: "Run
`/cmo:screenplay` when you are ready."

## Never

- Mark the register confirmed yourself.
- Register a file that is still being recorded or edited.
- Put a recording inside `production/` (raw footage lives at the reel root).
- Ask more than one question per message.
