---
name: narration
description: Narration craft for cmo-plugin reels — the fixed voice and per-form rate, sentence shapes, banned words, word-timed cues, spoken-vs-displayed spelling, the ASR pronunciation check, timing math and caption rules. Load before writing narration, choosing cue phrases, adding a product name, or diagnosing a sync or pronunciation problem. Encodes lessons 13–18, 42, 50.
---

# narration

The narrator's word timings are the film's clock. Every reveal, cut, caption
and chapter boundary derives from when a word is spoken. Write for the ear,
then let the measured speech set the picture.

## 1. The voice (fixed, series continuity)

| | |
|---|---|
| Engine | `edge-tts==7.2.8`, `boundary="WordBoundary"` (the metadata is not optional) |
| Voice | `en-US-AndrewMultilingualNeural` |
| Rate | **+2%** diagram and explainer (≈ 150–160 wpm); **−12%** footage (≈ 147 wpm, 2.45 w/s) so the audience can read a live screen while listening |
| Direction | diagram: "Calm, direct, technical, unhurried." · footage: "Warm, competent senior architect." · explainer: "Executive technical story, not a tool tour. Calm, confident, specific about responsibility." |
| Bed | none. No music, no foley. Silence is intentional |

Audio is generated per scene/chapter with a receipt fingerprinting `{text,
spoken text, voice, rate, engine, pronunciation version}`; only changed
scenes re-synthesise, and audio whose hash drifted is refused.

## 2. Sentence shapes that work

- **Answer first, prove after.** "Does it build a second platform? It does
  not." The answer lands in sentence two of the film.
- **Claim → mechanism → consequence**, ending on the consequence. "That
  discipline is what makes everything later in this story possible."
- **Name the action, then its significance.** "The agent reads the
  validator, corrects the structure, and runs the check again. The SQL is
  now correctly traced."
- **One limit, once.** "This is a structural check, not a live database
  demonstration." Then move on.
- **The handoff.** "Engineer three takes up the implementation." Not "hands
  over to".
- **The hypothetical, labelled in the same breath.** "Imagine a simple
  permissions question … This is a hypothetical example."
- **Verification as two open questions.** Never "the test passed".
- **Directive moments** (diagram only, ≤ 2 per act): "Watch this band of
  five sockets."
- **The close.** Diagram: re-ask, answer, compress, thank. Footage: "That
  brings us back to… the next step is to shape… together." Explainer:
  title, one imperative, one payoff, ~14 words.

## 3. Banned

Promotional words (seamless, powerful, revolutionary, game-changing,
effortless, world-class, delight, "simply", "watch this" outside diagram
directives). A maxim after every action. Repeated proof disclaimers.
Reading identifiers aloud (hashes, paths, slash-commands; say "the commit"
while `124bfa85` is on screen). Production directions inside narration.
Numbers without a baseline in the register. Audit items (PR counts,
contributor names, test totals). "In production" for "in the Twin". A
promised demo ("let us show you", "walkthrough").

## 4. Cues — the sync contract

- A cue is a **3–6 word phrase copied exactly** from the same scene's
  narration. State/point/item N appears when the narrator says cue N.
- Matched on normalised tokens (lower-case, punctuation stripped, `&` →
  "and"); word order matters.
- **Exactly once per scene, in order**, or the build fails before any audio
  is made ("cue must resolve once" / "Out-of-order cues").
- Reveal lands at `voiceOffset + wordStart` (+0.35 s point fade in footage).
  Bring the screen anchor into view **before** the spoken cue, never after.
- Changing a sentence can break a cue or move a cut. Re-run the static check
  after every edit and `narrate` before assembly.
- Never reveal two unrelated items on one cue. More than ~8 timed reveals in
  a scene means split the scene.

### Offsets differ per pipeline (lesson 50) — never import blindly

| Pipeline | Voice offset | Cue lead | Tail |
|---|---|---|---|
| Hyperframes diagram / footage (`scripts/lib/speech.mjs`) | 0.35 s | 0.07 s | distributed (footage: avg ≤ 1.95 s) |
| Explainer (`timing.mjs`) | **0.40 s** | none | 0.65 s; close 1.2 s |

## 5. Spoken vs displayed spelling (lesson 17)

Two layers. `spoken()` / `PRONUNCIATIONS` respell the speech input;
`displayCaption()` / `canonicalWords()` keep captions and cues in canonical
spelling and **throw on any token mismatch**.

| Written | Spoken | Why |
|---|---|---|
| OPSEXT | O P S E X T | TTS invents a word |
| BU | B U | "boo" |
| AI / API / SDLC / HPE | A I / A P I / S D L C / H P E | consistency |
| OR / GLAS / SIC (diagram) | OpsRamp / GreenLake Asset Service / Sustainability Insights Center | "OR" reads as the word |
| ITOM | eye tom | |
| SecOps | **Seck-ops** | `Sec Ops` → "Secretary Ops" |
| OpsRamp | Ops Ramp | cleaner break |
| security | *(leave natural)* | every respelling made it worse |

Test every new product name with a 20 s sample before synthesising the film.

## 6. The listening check (lesson 42) — metadata cannot hear

The "Secretary Ops" defect passed every token check; TTS metadata showed the
right words. Only audio revealed it. So after `narrate`:

1. Run local ASR on every scene containing a product name or acronym:
   `faster-whisper==1.2.1`, model `base.en`, **no vocabulary prompt**, audio
   stays on the machine. (`packs/explainer/machinery/transcribe-pronunciation.py`;
   port it for Hyperframes projects.)
2. Bind each transcript to the MP3's SHA-256; `verify` checks the terms you
   care about ("secops" present, "secretar" absent).
3. For a new hint, synthesise 3–4 trial spellings in a fixed sentence
   (`pronunciation-probe.mjs`), transcribe, pick the one recognised
   correctly, discard the rest.
4. The owner listens to a 10–20 s check clip of any corrected term. ASR is
   evidence for the specific correction, not approval of cadence.

Plain-English report shape: "The narrator says 'Secretary Ops' at 0:39. Try
the speech-only hint 'Seck-ops'."

## 7. Timing math (plan before you narrate)

| Form | Budget | Shape |
|---|---|---|
| Diagram +2% | 150–160 wpm | 10 min ≈ 18–20 frames, 1,500–1,700 words; lines 40–130 words (25–55 s); ceiling 81 s; floor 8 s |
| Footage −12% | 2.45 w/s | 15:00 master fixed = 27,000 frames; 15 scenes × ~145 words ≈ 886 s speech; build refuses avg tail > 1.95 s |
| Explainer +2% | ≈ 153 wpm | 5–6 min = 680–760 words; nine chapters 60–90 words + ~14-word close; film 300–360 s; close 6–12 s |

Never hand-time. Measured speech sets the durations; fix pace with words
that earn their place, not with silence. Give the owner the estimate
(words ÷ rate) before sending text to TTS.

## 8. Captions

From the same word timings: two lines × 42 characters, ≤ 6 s per cue, split
at sentence ends, display spelling restored. Selectable `mov_text` in the
MP4 plus SRT (and VTT, embedded in the review player). **Never burned in.**
Caption zone `y ≥ 0.84` is an error-severity layout gate; the explainer
builder requires ≥ 12 px clearance above the caption probe.

## 9. Governance for speech

Only approved narration text leaves the machine, to Microsoft Edge TTS, and
only after the owner approves the script for external speech processing.
Footage, memos and documents never go anywhere. Record the approval date in
BRIEF.md.
