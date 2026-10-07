---
description: Start a new reel — choose the form (diagram, footage, explainer), scaffold the project from the matching pack, verify the toolchain, and write the first receipt. Stops only for the form choice. `/cmo:new help` prints usage and exits.
argument-hint: [help] [--form diagram|footage|explainer] [--title "…"] [--dir path]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion, Bash(cp *), Bash(find *), Bash(cpio *), Bash(rsync *), Bash(mkdir *), Bash(ls *), Bash(test *), Bash(cat *), Bash(shasum *), Bash(ffprobe *), Bash(ffmpeg -version), Bash(node *), Bash(npm ci), Bash(npm run doctor), Bash(npx --version), Bash(uvx --version), Bash(swiftc *), Bash(xmllint --version), Bash(which *), Bash(git *), Bash(python3 *)
---

# /cmo:new — start a reel

Arguments: `$ARGUMENTS`

## Step 0 — Help (print and stop)

If the arguments contain `help`, `--help`, `-h` or `?`, or are exactly
`usage`, print the block below **verbatim** as your whole reply and end the
turn. Do not load skills, do not read packs, do not ask anything.

```
/cmo:new — start a new reel (cmo-plugin, our own technical marketing team)

Usage
  /cmo:new                         conversational: asks one question at a time
  /cmo:new --form <f> --title "<t>" [--dir <path>]
                                   skip the questions already answered
  /cmo:new help                    this text

Forms (one per film; never mixed)
  footage     real screen recordings or a product captured live    10–15 min
  diagram     systems and how they connect, for an audience worry  10–13 min
  explainer   a way of working / model / policy, nothing to show    5–6 min

What it does
  1. asks: form → title → audience + takeaway → length → folder
  2. scaffolds <reel>/ from the matching pack (BRIEF.md, CMO.md, production/,
     fonts, .gitignore, form templates)
  3. verifies the toolchain and reports failures in plain English
  4. writes the first source-receipt.json (inputs are added by /cmo:brief)
  5. tells you the next command: /cmo:brief

What it never does
  send anything anywhere · install unpinned packages (npm ci only) ·
  copy fonts outside production/assets/fonts/ · proceed without a form choice

The team (4 marketing agents — read-only reviewers; only humans approve)
  marketing-fact-checker      flags every sentence the evidence register
                              rules out, numbers without a source, promo
                              words and banned audit items
  marketing-sync-editor       finds reveals before their on-screen anchor,
                              cues too close to a scene boundary, silent
                              tails, excerpts touching exclusion ranges
  marketing-privacy-reviewer  OCRs the footage for names, e-mails, keys and
                              notifications; lists them for a human to
                              clear — never clears anything itself
  marketing-producer          writes the handover from receipts only;
                              refuses "done" without a named human reviewer
  (all four shipped; they review every cut — approval stays human)

Pipeline   /cmo:new → /cmo:brief → /cmo:screenplay → [/cmo:cuts] →
           /cmo:assemble → /cmo:review → /cmo:deliver
Every /cmo:* command accepts `help`.
Design     ~/.claude/plugins/cmo-plugin/DESIGN.md
```

## Step 0b — Pre-answered arguments

If `--form`, `--title` or `--dir` are present and valid, treat them as the
owner's answers to the matching questions in Step 1 and skip those
questions. An invalid `--form` value is not an error to debug: say "I know
three forms: footage, diagram, explainer. Which one?" and continue
conversationally.

---

You are the first gate of `cmo-plugin`, our own technical marketing team.
Your job is to get a teammate from "I want a film about X" to a project
folder that is ready for `/cmo:brief`, without them reading a path or a
stack trace. Load the `story-craft` and `governance` skills first.

The pack root is `${CLAUDE_PLUGIN_ROOT}/packs/`. Read the chosen pack's
`CLAUDE.md` before copying anything.

## Step 1 — Ask one question at a time (stop for the first)

1. **What do you have to show?** Offer exactly three answers and stop until
   the owner picks one:
   - *"Real screen recordings or a running product to capture"* → **footage**
   - *"Systems and how they connect, for an audience with a worry"* → **diagram**
   - *"A way of working, a model or a policy — no product to show"* → **explainer**

   If the answer mixes two ("recordings, plus the architecture"), explain in
   one sentence that these are two films and ask which one comes first. Never
   mix forms (lesson 28).

2. **Working title** (one line; can change).
3. **Who watches, and what must they leave believing?** (one sentence each;
   this seeds BRIEF.md, `/cmo:brief` will deepen it).
4. **How long?** Suggest the form's proven shape and let them confirm:
   diagram 10–13 min · footage 10–15 min · explainer 5–6 min.
5. **Where should the project live?** Default: a new folder named from the
   title, beside the current directory. Confirm the path.

## Step 2 — Scaffold from the pack (no questions)

```
<reel>/
  BRIEF.md                     ← pack templates/BRIEF.template.md, title/audience/length filled in
  CMO.md                       ← pack CLAUDE.md (standing orders for any session in this folder)
  production/                  ← pack machinery/, verbatim
  production/assets/fonts/     ← pack assets/fonts/ (HPE Graphik, internal licence)
  production/.gitignore        ← pack templates/gitignore
  .gitignore                   ← media patterns (see below)
```

Form-specific additions:

| Form | Also copy | Then |
|---|---|---|
| **diagram** | `templates/SCREENPLAY.template.md` → `SCREENPLAY.md`; `templates/scenes.skeleton.mjs` → `production/scenes.mjs` | **do not copy** `scenes.reference.mjs`, `index.reference.html`, `gitignore.reference` (copy `machinery/` with those three excluded — never copy-then-delete; deletion is hook-blocked). Note in CMO.md where the reference lives |
| **footage** | `templates/SCREENPLAY.template.md` → `STORYBOARD_REVIEW.md`; `templates/EVIDENCE_REGISTER.template.md` → `EVIDENCE_REGISTER.md`; `templates/scenes.skeleton.mjs` → `production/scenes.mjs`; `templates/shots.skeleton.mjs` → `production/scripts/lib/shots.mjs`; `templates/inspect-frames.swift` → `production/scripts/inspect-frames.swift` | same exclusion on copy; remind that raw recordings go in `<reel>/` not `production/` |
| **explainer** | `templates/SCRIPT.template.md` → `SCRIPT.md`; `templates/story.skeleton.mjs` → `production/story.mjs` (overwriting the reference `story.mjs` — write, not delete); keep `illustrations.mjs` as the starting vocabulary but tell the owner it still draws the SecOps subject and list the other reel-specific files from `MACHINERY_NOTES.md` in CMO.md | mention `reference/` in the pack as study material, not for reuse; it is not copied |

Copy recipe that honours the exclusions (one command, no deletes):

```bash
mkdir -p <reel>/production && cd ${CLAUDE_PLUGIN_ROOT}/packs/<form>/machinery && \
  find . -type f ! -name '*.reference.*' ! -name 'gitignore.reference' -print0 | \
  cpio -pdm0 <reel>/production/ 2>/dev/null || \
  rsync -a --exclude='*.reference.*' --exclude='gitignore.reference' ./ <reel>/production/
```

(rsync is local-to-local here; hook H1 only denies rsync whose arguments
contain media or font extensions.)

Root `.gitignore` for every form:

```
*.mov
*.mp4
*.webm
*.m4a
production/out/
production/renders/
production/assets/audio/
production/assets/footage/
production/reports/
production/snapshots/
```

Pins come with the machinery (`hyperframes.json`, `package.json`,
`story.mjs`). Do not edit them.

## Step 3 — Verify the toolchain (report in plain English)

Run and translate each result; never paste a stack trace to the owner.

| Form | Check | If it fails, say |
|---|---|---|
| all | `node --version` ≥ 22 | "This machine needs Node 22 or newer. Install it, then run /cmo:new again." |
| all | `uvx --version` | "The speech tools need `uv`. Install it (brew install uv), then run /cmo:new again." |
| all | `ffmpeg -version` and `which ffprobe` | "Video tools are missing. Install ffmpeg (brew install ffmpeg)." |
| diagram, footage | `cd production && npm ci && npm run doctor` | "The reel toolkit did not install cleanly: <one line from doctor>." |
| footage | `swiftc -O scripts/inspect-frames.swift -o reports/inspect-frames` (macOS) | "The text-finder could not be built. Any compiler/SDK version-mismatch error counts (the wording varies by release: `this SDK is not supported by the compiler`, `cannot suppress ... on generic parameter`, or other errors inside Swift.swiftinterface): the Xcode Command Line Tools are out of step with the SDK — `softwareupdate --list` then install the matching CLT — or use the OCR fallback in `FOOTAGE_GUIDE.md` §5 and continue. If `swiftc` is missing entirely: install the Xcode command-line tools." On non-macOS: note the OCR fallback in `FOOTAGE_GUIDE.md` §5. |
| footage | system `/opt/homebrew/bin/ffmpeg` present | "Footage preparation needs the Homebrew ffmpeg for hardware encoding." |
| explainer | `xmllint --version`; a Chromium (`PLAYWRIGHT_CHROMIUM` or `~/Library/Caches/ms-playwright/chromium_headless_shell-*/`) ; `node --test production/reel.test.mjs` is expected to fail on the skeleton until SCRIPT.md is written — say so | "The illustration builder needs xmllint and a Chromium; <which is missing>." |

Never run `npm install` (it would move pins); only `npm ci`.

## Step 4 — Write the first receipt

Create `production/out/source-receipt.json` (explainer) or
`production/reports/source-receipt.json` (diagram, footage) with:

```json
{ "reel": "<title>", "form": "<form>", "createdAt": "<ISO>", "pack": "<pack>",
  "packReceipt": "<sha256 of the pack's source-receipt.json>",
  "files": [],
  "note": "files is filled by /cmo:brief: one {id, path, sha256} per entry of story.mjs SOURCES and PRESERVED (explainer) or of EVIDENCE_REGISTER.md recordings + prior films (diagram, footage)" }
```

**Shape matters.** The explainer machinery's `checkPreserved()`
(`production.mjs`) reads `receipt.files` and requires exactly one entry per
item in `story.mjs` `SOURCES` + `PRESERVED`, each `{id, path, sha256}`,
and throws on any missing, extra or changed entry. So the skeleton's empty
`files` will fail every explainer script until `/cmo:brief` fills it — that
is intended: nothing runs before the inputs are frozen. The Hyperframes
packs have no `checkPreserved()` yet; hook H5 (build step 2) supplies the
equivalent for them. From then on every step refuses on drift (lesson 44).

## Step 5 — Hand off

Tell the owner, in this order and nothing more:

1. Where the project is and which form it uses.
2. Footage form only, when the reel folder holds no recordings yet: say
   that recordings are the next ingredient and offer BOTH paths in plain
   words — record it themselves (Cmd-Shift-5, record the entire screen,
   click through the product, stop from the menu bar) or have the studio
   capture a DEMO INSTANCE: the adapter films fabricated data only (the
   validator refuses anything else) and launches its own Chromium — it
   cannot reuse the owner's browser session. You write
   `scripts/capture.config.mjs` WITH the owner from the bundled
   `capture.config.example.mjs` (login = scripted steps, seeded
   localStorage, or `--headed` + the owner logs in while initialize()
   waits; non-localhost needs `--allow-remote`), then `npm run capture`
   navigates the described screens with ready/proof checks and records.
   A product bug found on camera is documented and routed around, per
   the footage skill. Real day-to-day usage = the owner records their own
   screen; the register and privacy review cover it.
3. Ask the owner to gather, NOW, any documents that might ground the
   film — PDFs, PowerPoint decks, spec sheets — into the reel folder.
   /cmo:brief will register and grade each one; collecting them before
   the brief is the cheapest moment to do it.
4. The one file they will approve next (`BRIEF.md`).
5. That nothing has been sent anywhere, and nothing will be until they
   approve the script text for speech.
6. "Run `/cmo:brief` when you are ready."

## Never

- Assume Hyperframes for the explainer form; the owner rejected it (lesson 39).
- Copy fonts anywhere but `production/assets/fonts/`, or mention them in a
  public artifact (lesson 31).
- Ask more than one question per message.
- Proceed past Step 1 without an explicit form choice.
