# NARRATION_GUIDE — the voice, the sentences, the sync

## The voice (series continuity)

- Engine `edge-tts==7.2.8`, voice `en-US-AndrewMultilingualNeural`.
- **Rate `-12%`** for this style. The architecture reel reads at `+2%`
  because it is diagram-paced; the evidence reel slows down so the audience
  can read a live screen while listening. The reference measured 886.4 s of
  speech for ~2,170 words (≈ 2.45 words/s, 147 wpm) at `-12%`.
- Per-scene MP3 + WordBoundary JSONL + VTT, fingerprinted by
  `{text, voice, rate, engine}`; `npm run narrate` re-synthesises only
  scenes whose fingerprint changed.
- Clean narration, no music bed. The recordings are silent; do not add
  keyboard or click foley.

## Voice direction (first line of SCRIPT.md, generated from FILM)

> Andrew Multilingual Neural, -12%. Warm, competent senior architect.
> Opening invitation: genuine lift and forward energy, not a presenter
> flourish.

A senior architect explaining work they know well to peers: measured,
conversational, natural contractions, technically precise, unhurried. Not a
narrator, not a salesperson, not a compliance officer.

## Sentence shapes that work (from the reference script)

- **Name the action, then its significance.** "The agent reads the
  validator, corrects the structure, and runs the check again. The SQL is
  now correctly traced, and remaining scope-drift warnings stay visible for
  review."
- **Say the finding plainly.** "The important finding is that the Azure
  Local template already exists and maps to Azure Stack HCI. Repeating the
  proposed template split would miss the real gap."
- **One limit, once, where it changes the next decision.** "This is a
  structural check, not a live database demonstration." Then move on.
- **The handoff sentence.** "Engineer three takes up the implementation of
  the same request." Not "hands over to", not "the team then".
- **The invitation.** "We want to shape that handoff together: what does
  Private Cloud need to assess the result, who needs to receive it, and
  which decisions should it support?"
- **The return.** "That brings us back to …" opens the final scene.

## Banned

- Promotional words: seamless, powerful, revolutionary, game-changing,
  effortless, "watch this", "simply".
- A maxim after every action ("and that's how we ensure quality").
- Repeated proof disclaimers. State the owner's confirmed facts as facts.
- Reading identifiers aloud: say "the commit" while `124bfa85` is on screen;
  say "the ticket" after introducing it once as "O P S E X T twenty-four
  oh four". Never read hashes, paths, or slash-commands.
- Production directions inside narration ("pause here", "zoom in").
- Productivity percentages, savings, or speedups without a baseline in the
  evidence register. The reference reel states explicitly that it reports
  none.

## Screen-to-voice rule

Each right-panel point has a **cue**: a phrase from the same scene's
narration. The point fades in 0.35 s after the narrator begins that phrase,
and the footage cuts to that point's excerpt at the same moment. Therefore:

- Bring the screen anchor into view **before** the spoken cue, never after.
  If the cut must lead the voice by more, give the excerpt an earlier
  `sourceStart`.
- A cue must match **exactly once** in the scene's tokens, or the build
  fails (`cue must resolve once`). Pick 3–6 word phrases that do not recur.
- Cues are matched on normalised tokens (lower-case, punctuation stripped,
  `&` → "and"), so capitalisation and commas do not matter; word order does.
- Changing a sentence can break a cue or move a cut. Re-run `narrate` and
  `build` after every wording change and read the new durations.

## Spoken substitutions (pronunciation vs. display)

`scenes.mjs` applies them to `vo` and to cues; `displayCaption()` reverses
them for the SRT/VTT so captions keep normal spelling:

| Written | Spoken | Why |
|---|---|---|
| OPSEXT | O P S E X T | TTS otherwise invents a word |
| BU | B U | "bee you", not "boo" |
| HPE / API / SDLC | H P E / A P I / S D L C | consistency; captions show the acronym |
| Hyperframes | Hyper Frames | if the product name is ever spoken |

Add your own pairs in `spoken()` in `scenes.mjs` **and** in
`displayCaption()` in `scripts/lib/speech.mjs`. Test a 20-second sample
covering every product name before synthesising the film.

## Claims rule (put at the top of STORYBOARD_REVIEW.md, adjusted)

> The owner's confirmed account is authoritative for narration. Recordings
> illustrate the work; the register's "does not establish" column is a hard
> boundary. Assumptions are said once and labelled on screen. The actual
> outcome is preserved. No metric without a source, interval, definition,
> and denominator. No tokens (`{R02_…}`) survive into a rendered cut.

## Timing math (plan before you narrate)

- Master: 900 s fixed. Voice offset: 0.35 s into each scene. Transition:
  13/30 s overlapping the next scene.
- Budget ≈ 2.45 words/s at `-12%`. Fifteen scenes of ~145 words ≈ 59 s each
  ≈ 886 s of speech, leaving ~14 s of distributed tails (< 1 s per scene).
- The build distributes remaining frames equally and **refuses** if the
  average tail would exceed ~1.95 s. A test asserts every tail ≤ 2 s.
  Under-running is fixed with words that earn their place, not pauses.
- Reading time is in the footage, not in silence: the audience reads the
  screen while the narrator speaks the next sentence. That is why the right
  panel is three short conclusions and not the transcript.
- Minimum useful scene ≈ 50 s; a 15-scene, 15:00 film is the proven shape.
  For a 10:00 film keep ~10 scenes rather than 15 short ones.

## Captions

Generated by `buildCaptions()`: two lines × 42 characters, ≤ 6 s per cue,
split at sentence ends, display spelling restored. Delivered as selectable
`mov_text` in the MP4 plus a standalone SRT — never burned in, because the
right panel already occupies the reading eye. The caption zone check
(`y ≥ .84`) is an error-severity gate in `npm run check`.
