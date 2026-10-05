# NARRATION_GUIDE — voice, tone, and script craft

## The voice (fixed — series continuity)

- Microsoft Edge TTS `en-US-AndrewMultilingualNeural` at rate `+2%`, with
  WordBoundary metadata (that metadata drives the diagram reveals — it is not
  optional).
- Generated per scene by `npm run narrate` into `assets/audio/` (mp3 +
  `.words.jsonl` + `.vtt`).

## Voice direction (put this line at the top of your SCRIPT)

> Plain English. Confident because the evidence is clear, not promotional.

Per-line delivery note used throughout the reference reel:
**"Calm, direct, technical, and unhurried."** Resist variety; sameness of
delivery is what lets the CONTENT carry the arc.

## Tone rules

1. **Answer first, prove after.** "It does not." lands in sentence two of the
   whole film. Never make an executive wait for the answer.
2. **No promotional language.** Banned: seamless, revolutionary, game-changing,
   world-class, delight, journey (as hype), "solutions". The evidence does the
   selling: "One bus, four consumers, and in each case OpsRamp is the source
   of observed truth."
3. **Short declaratives with one long evidence sentence per line.** Pattern:
   claim (short) → mechanism (medium) → consequence (short). End lines on the
   consequence: "That discipline is what makes everything later in this story
   possible."
4. **Speak to the audience's worry, not at the product.** "Some of you have
   asked whether…" — second person plural, direct, respectful.
5. **Numbers stay factual and hedged where reality is hedged.** "close to
   twenty-six Flex services", "The on-prem licensing model is TBD." Never
   round hedges away.
6. **Directive moments.** Once or twice per act, direct the eye: "Watch this
   band of five sockets. It is the most important object in this talk."
7. **The bookend.** The final line re-asks the opening question, answers it in
   one word, then compresses the whole argument into 3–4 short sentences and
   thanks the audience.

## Pronunciation rule (TTS reality)

On-screen text may use initialisms ("OR", "GLAS", "SIC"); the narration always
speaks the expanded form ("OpsRamp", "GreenLake Asset Service", "Sustainability
Insights Center") because the voice reads "OR" as the English word. Keep a
pronunciation table in SCRIPT.md and test any new acronym with `npm run
narrate` before locking the line.

## Claims rule (put this block in SCRIPT.md verbatim, adjusted)

> Every substantive line comes from the product owner's own account, given in
> the brainstorm on <dates>. <Reference decks> are not a source for any claim.
> Items marked **CHECK** need the owner's confirmation before recording.

## Timing math (plan before you narrate)

- Andrew at +2% lands ≈ 150–160 spoken words/minute.
- Reference-reel line lengths: opener ≈ 60 words / 25s; explanation lines
  ≈ 60–130 words / 25–55s; the densest evidence line ≈ 130 words / 52s;
  Morpheus (a two-direction mechanism) ran 81s — that is the ceiling.
- Scene minimum is 8s; a 10-minute film is roughly 18–20 frames and
  1,500–1,700 narration words. Write to that budget, then let `npm run
  narrate` produce the real timings — never hand-time.

## Captions

Selectable English captions ship in the MP4 (generated from the same TTS word
timings). Narration IS the caption text: write sentences that read well on
screen — no stage directions inside `vo`.
