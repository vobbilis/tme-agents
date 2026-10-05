# STORY_STRUCTURE — the organization-first explainer

The reference reel ("OpsRamp's Shift-left SecOps", ten chapters, 5:21.5)
explains a way of working to leaders who are not specialists in it. There is
no product on screen and no recording to prove anything; the argument is
carried by illustrations that build up and by one hypothetical example that
travels through the middle chapters. Copy the arc; change the subject.

## The arc (ten chapters; nine narrated at 27–40 s, one animated close)

| # | Job | Reference chapter | Theme |
|---|---|---|---|
| 1 | **Title and the shift.** Name the change in one phrase. Contrast the old way with the new in two sentences. Say what the film will adapt or build on. | "Pulling security upstream, into everyday development." | dark |
| 2 | **The cost of the old way.** Respect every role; locate the problem in distance, delay or repetition, not in effort. | "Good work. Too much distance." | light |
| 3 | **The familiar thing, customised.** Show the regular loop the audience already knows, then the specialisation. Reveal human ownership before the concluding sentence. | "The familiar workflow. Customized for security." | dark |
| 4 | **Context changes the question.** Introduce the one hypothetical example, labelled. Show what context feeds the analysis. | "Imagine a simple permissions question…" | light |
| 5 | **A controlled place to run.** Boundary first, then the exercise inside it. Capture fields, not findings. | "A place to investigate. A boundary to respect." | dark |
| 6 | **Distinct roles, one evidence trail.** Who does what; what makes the output credible; what reaches a human reviewer. | "Different responsibilities. One evidence trail." | dark |
| 7 | **Close the loop.** Ownership of the change; verification as two questions; evidence scoped to tested conditions. | "Fix the concern. Preserve the behavior." | light |
| 8 | **Clear authority.** The source document's own operating principle, read in order. Routine lane and escalation lane without invented thresholds. | "Earlier feedback. Clear authority." | dark |
| 9 | **Maturity, honestly.** "In progress" visible from the first frame. Intended outcomes labelled as intended. | "Coverage is earned, area by area." | light |
| 10 | **Animated close.** Title, one movement that embodies the shift, one payoff line. ≤ 12 s, ~14 words. | "Security. Built in." | dark |

Theme alternation is deliberate rhythm: ivory chapters stop the technical
middle from becoming one long dark diagram. Flip where the argument turns,
not on a schedule.

## One chapter = one stable diagram = four states

Every chapter has exactly this shape (`story.mjs` and `checkScript()` enforce
it):

- **Act label** — short, tracked caps above the headline ("Security moves
  upstream").
- **Headline** — two lines; line one in ink, line two in brand green. A
  conclusion, not a topic ("Good work." / "Too much distance.").
- **Four state captions** — what each progressive state adds, ≤ ~45 chars.
  They become the storyboard's beat list and the plate `alt` text.
- **Three cue phrases** — 3–7 words from that chapter's own narration, in
  order, each occurring exactly once. State N appears on cue N.
- **Narration** — 60–90 words in 2–3 blockquote paragraphs. The close is one
  sentence.
- **Illustration** — one renderer function `(scene, phase, palette) → SVG`.
  Unchanged parts keep their coordinates across all four states so the
  dissolve reads as "something was added", never "the picture changed".

## The recurring record

If the arc follows one example, give it a persistent on-screen object with a
fixed position and an identity attribute (reference: `#evidence-record`,
`data-record="hypothetical-permissions"`, at x 104 / y 775 / w 1712 / h 112
from chapter 4 state 3 through chapter 7 state 3). Its question never
changes; only its stage label develops ("Linked to context and
assumptions" → "Reviewable record for reproducibility" → …). A test asserts
it is present and unmoved in every state where it belongs.

## Rules the reference learned the hard way (its review dispositions)

1. **Lead with the change, not the tooling.** The brief that reached the
   independent reviewer asked "is this a story or ten narrated slides?" The
   fix was the hypothetical example threaded through chapters 4–7.
2. **Agents are not humans.** An agent that reproduces a finding is a
   "Challenge" role in mint; a human who validates is blue. Never let an
   agent carry the human's colour or verb.
3. **Prioritisation needs no numbers.** "Prioritize actionable issues using
   risk and evidence" — no score, no threshold the sources did not give.
4. **Consolidate caveats.** Repeated "not X" dilutes the story. One maturity
   statement (chapter 9), one "intended outcomes" label, affirmative
   explanation elsewhere.
5. **Reveal ownership early enough to read.** The human-ownership state was
   moved before the chapter's concluding sentence; a test asserts its hold
   is ≥ 8 s.
6. **"Faster work" reads as a measurement.** It became "Earlier feedback".
7. **Internal notes are not for the audience.** A closing card that said
   "The story leads into…" was removed; a test asserts its absence.
8. **The old demo handoff became a standalone close.** When the owner said the
   film must stand alone, the "let us show you" ending was replaced by the
   animated shift; a test asserts no handoff language survives.
9. **Then the close was too long.** 30.97 s / 59 words → 7.47 s / 14 words.
   The guard now refuses a close over twelve seconds.

## Source hierarchy (write it into BRIEF.md)

1. The owner's latest follow-up (title, framing, corrections).
2. The owner's memo or conversation (intent, grounding, roles, maturity).
3. Supplied documents (an operating-model page, a policy) — for principles,
   scope and ownership, quoted in order when read aloud.
4. Prior reels — style and voice only, never evidence.

A transcript of the memo is an aid, fallible on acronyms and names. Anything
the owner has not confirmed stays generic.

## What this form must never do

- Show a fabricated product screen, dashboard, terminal, ticket, score or
  scan result as if it were evidence.
- Resolve the hypothetical into an outcome ("the test passed").
- Imply the illustrated sandbox or harness is an existing named system
  unless the owner has said so.
- Promise a demonstration, a presenter or a follow-up film.
- Use stock hacking imagery: hooded figures, shields, padlocks, red alerts.
