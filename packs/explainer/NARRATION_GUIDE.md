# NARRATION_GUIDE — the voice, the sentences, the sync, the listening check

## The voice (series continuity)

- Engine `edge-tts==7.2.8` via `uvx`, voice `en-US-AndrewMultilingualNeural`,
  **rate `+2%`** (`lib/narrator.mjs`). The explainer is diagram-paced like the
  architecture reel; only the footage form slows to −12%.
- Narration is the only soundtrack. Silence underneath is intentional. No
  music, no attack sounds, no typing.
- Per-chapter MP3 + raw WordBoundary JSONL + canonical words JSONL + receipt,
  fingerprinted by `{script text, spoken text, voice, rate, pronunciation
  version, aliases}`; `narrate.mjs` re-synthesises only chapters whose
  fingerprint changed, and refuses to reuse audio whose hash drifted.
- The reference measured 682 words → 321.5 s including offsets and tails
  (≈ 153 spoken words per minute).

## Voice direction (first lines of SCRIPT.md)

> An executive technical story, not a tool tour. Calm, confident, specific
> about responsibility. Plain English. No alarm, no hype.

## Sentence shapes that work (from the reference script)

- **Name the shift in one phrase, then contrast.** "In a traditional
  workflow, detailed security checks arrive near release. Shift-left starts
  at design and continues with each commit and build."
- **Respect the roles, locate the cost.** "Each step has a purpose. The
  difficulty is the distance between them."
- **The hypothetical, labelled in the same breath.** "Imagine a simple
  permissions question: could a read-only user change a protected setting?
  This is a hypothetical example."
- **Read a supplied principle in its own order.** "AI analyzes. Security
  validates. Engineering fixes. AI re-validates. Security governs."
- **Verification as two questions, both left open.** "Are read-only users
  prevented from changing the protected setting? And can an authorized user
  still make the legitimate change?"
- **Scope the evidence.** "Those results establish evidence for the tested
  conditions; broader coverage comes from further investigation and review."
- **Maturity, plainly.** "This capability is being developed area by area.
  Product-wide coverage is still to be earned."
- **The close.** Title, one imperative, one payoff. Fourteen words.

## Banned

- Promotional words: seamless, powerful, revolutionary, game-changing,
  effortless, "simply", "watch this".
- Measurements the sources did not supply ("days to hours", percentages,
  counts, scores). Say "intended outcomes, to be measured".
- Deployment claims for future-state flows.
- Repeated qualifications. State the boundary once where it matters.
- Audit items: PR counts, contributor names, test totals, file paths,
  commands, hashes.
- A promised demo or presenter ("let us show you", "walkthrough").

## Cues

Each chapter has three cue phrases; state N appears on cue N.

- 3–7 words, copied exactly from the chapter's own blockquote text.
- Matched on normalised tokens (lower-case, punctuation stripped); each must
  occur **exactly once** in its chapter and the three must be in order.
  `checkScript()` throws otherwise, before any audio is made.
- Changing a sentence can break a cue. Re-run the static check after every
  edit; re-run `narrate` before assembly.
- Leave readable time after the last cue: the reference asserts the
  human-ownership state (chapter 3 state 3) holds ≥ 8 s.

## Spoken vs displayed spelling (`pronunciation.mjs`)

Only the speech input is respelled. Captions, cues and the script keep the
canonical spelling; `canonicalWords()` maps TTS word boundaries back onto the
display words and throws on any token mismatch.

| Written | Spoken | Why |
|---|---|---|
| AI | A I | otherwise "ay" |
| SDLC / API / HPE | S D L C / A P I / H P E | consistency |
| SecOps | **Seck-ops** | `Sec Ops` was expanded to "Secretary Ops" |
| OpsRamp | Ops Ramp | cleaner syllable break |
| security | *(natural)* | every syllable respelling made it worse |

Add pairs in `PRONUNCIATIONS` and bump `PRONUNCIATION_VERSION`; the
fingerprint changes and affected chapters re-synthesise.

## The listening check (lesson 42 — do not skip)

TTS metadata cannot tell you a word was mispronounced; only audio can. After
`narrate`:

```bash
uvx --from faster-whisper==1.2.1 --python 3.12 python production/transcribe-pronunciation.py \
  --output production/out/pronunciation-review/revised-transcripts.json \
  production/out/audio/<every chapter containing a product name or acronym>.mp3
```

`base.en`, no vocabulary prompt, audio stays local; each result is bound to
the MP3's SHA-256 and `verify.mjs` checks the bound transcripts for the
terms you care about (reference: "SecOps" recognised, "secretary" absent, in
all four affected chapters). For a new hint, generate 20 s trial samples
with `pronunciation-probe.mjs` and compare transcripts before changing the
film. Local ASR is evidence for a specific correction, not approval of
cadence or every phoneme; the owner still listens to the short check clip.

## Timing math (plan before you narrate)

- Offset 0.40 s before voice in each chapter; tail 0.65 s; close tail 1.2 s.
  Do not import the footage pack's 0.35 s / 0.07 s lead — `timing.mjs`
  deliberately does not use them.
- Budget ≈ 153 words/minute. A 5–6 minute film is 680–760 words across nine
  narrated chapters of 60–90 words plus a 10–15 word close. The reference's
  first draft at 841 words measured 6:16 and failed the 300–360 s guard.
- Ten-frame dissolves (⅓ s) centred on each cue; the new state is fully
  established when its explanation begins.
- Every state needs ≥ 1 s + one dissolve; the close's three motions use
  ≤ 42 % of their interval each.

## Captions

Generated from the canonical words: two lines × 42 characters, ≤ 6 s,
split at sentence ends, canonical spelling. Delivered as selectable
`mov_text` in the MP4 plus SRT and VTT, and embedded in `review.html` so
captions work from `file://`. Never burned in.
