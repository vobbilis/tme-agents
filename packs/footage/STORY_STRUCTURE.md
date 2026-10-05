# STORY_STRUCTURE — exposition carried by live evidence

The reference reel ("OpsRamp's AI-First SDLC: One Model, Three Engineers",
15 scenes, 15:00) is an exposition of an operating idea, proven by following
one real request through real recordings. This file is the arc and the rules
that made it hold together. Copy the arc; change the idea, the case, and the
actors.

## The arc (15 scenes ≈ 60 s each; scale the middle, keep the bookends)

| Act | Scenes | Job | Left screen | Theme |
|---|---|---|---|---|
| Open | 01 | State the operating idea; name the real case; promise the journey ("we'll follow three engineers…") | the idea's own page, then the request | dark |
| Case | 02–03 | What the requester needs; how the request was made usable (actor 1) | the ticket; the preparation flow | light |
| Phase A | 04–07 | Actor 2's work: start, discovery, requirements, reviewed plan | the agent conversation, artifacts | light |
| Handoff | 08 | Actor 3 picks up the plan; the decision that bounds the work | end of one recording, start of the next | dark |
| Phase B | 09–13 | Implementation, tests, a failure and its repair, release reconciliation, the real delivery state | code, test output, validator, git | light |
| Proposal | 14 | What should come back to the requester — framed as a question to shape together | the actual artifacts, labelled PROPOSED | dark |
| Close | 15 | Return to the operating idea; what was followed; the invitation | the idea's page again, short reprises | dark |

Theme flips mark act boundaries (01, 08, 14, 15 are dark). Inside an act the
surface stays light. That is the only large-scale visual rhythm; do not add
recap frames or title cards between scenes — the chapter label and progress
line carry the position.

## One scene = one phase = one conclusion set

Every scene has exactly this shape (the template enforces it):

- **Chapter title** — a sentence fragment that is itself a conclusion
  ("The Existing Code Changes The Answer", "Testing Is Part Of
  Implementation"). Title Case in the reference; keep it under ~45 chars so
  it fits the right panel at 40 px in two lines.
- **Left screen direction** — which excerpts, in what order, what must be
  readable, and "No rectangle." unless a highlight is justified (see
  FOOTAGE_GUIDE). Name the actor label when the actor changes.
- **Right panel** — three points, slash-separated, each ≤ ~34 characters
  so it fits 552 px at 31 px in two lines. Points are conclusions ("Parent
  fields stay pending"), never narration fragments.
- **Highlight** — "Candidate only: …" or absent. Default absent.
- **Narration** — one blockquote paragraph, 120–170 words, spoken as written.

## Rules the reference reel learned the hard way

1. **Open on the model, not the ticket.** First cut opened on the request
   and the review called it a challenge-response pitch. The fix: idea →
   "let's get into a real, recent request" → journey promise.
2. **Explain the differentiating concept before minute four, and show it
   on screen when you say it.** Telemetry was originally a closing segment
   (S14 measurement contract); V3 moved it into S01 and S04, cutting to the
   observability section of the model page on the phrase "Telemetry records
   how the flow executes." A test asserts that cut lands before 240 s.
3. **Distinguish people from agents, and recordings from handovers.** The
   owner confirmed three different engineers; the footage shows three
   recordings. Say "Engineer three takes up the implementation" and label
   the source strip; do not say they met or handed anything over on camera.
4. **Preserve the actual outcome.** Push was permission-blocked; the reel
   ends delivery on "Local commit retained / Push access blocked / Jira
   records the state". Never splice a later success into the chronology.
   If later footage arrives, it is a new scene with its own label.
5. **The owner's account is authoritative for narration.** V3 replaced an
   earlier "screen-only assertion" rule that produced constant hedging
   ("the page describes the standard, not proof that…"). Narrate the
   owner's confirmed facts (six months, enforced baseline, local
   customization) plainly; mention a limit once, where it changes the next
   decision; then move on.
6. **Assumptions stay labelled, in narration and on screen.** "We assume
   outer-loop approval has happened for this demonstration" is said once
   (S03) and never contradicted by a green check or an approval stamp.
7. **Right panel = conclusions.** The first drafts put narration fragments
   in the panel; the review called it "a second transcript". Three short
   claims per scene; the number badge and the top rule are the only
   decoration.
8. **A failure is a scene, not an embarrassment.** S11 is the trace-schema
   rejection and its repair, shown in order: failed command, validator
   inspection, revised file, rerun. It is the most persuasive scene in the
   film because it is the only one a slide could not fake.
9. **The proposal scene is a question.** S14 asks "What changed? / What
   was checked? / What needs a decision?" over the real artifacts, labelled
   PROPOSED RETURN HANDOFF. It does not mock up the artifact that does not
   exist yet.
10. **Close with the opening page and an invitation.** "That brings us back
    to…" + what we followed + "the next step is to shape … together" +
    "while holding the governing principles constant." No CTA card.

## Evidence register before screenplay

Write `EVIDENCE_REGISTER.md` first (template provided). For every recording:
owner/actor, duration, what it shows, **what it does not establish**, and
exclusion ranges. The "does not establish" column is where the claim
boundary comes from; the screenplay may not say anything that column rules
out. The reference register:

| Recording | Shows | Does not establish |
|---|---|---|
| jira-creation.mov (12:56) | field-aware intake, human refinement, ticket creation | the 12 proposed stories are rows, not linked issues |
| analysis.mov (27:28) | ticket fetch, state init, prior-art research, PRD, design, POC, plan | fresh receiver continuation, requester-approved scope |
| deliver.mov (26:21) | scoped SQL, Python harness, trace rejection/repair, release correction, local commit, Jira update | real MySQL execution, independent reviewers, successful PR, acceptance |
| model page (0:30) | the declared operating model | that this request satisfied every requirement |

## If a number appears on screen or in narration

It needs a source, an interval, a definition, and a denominator. The
reference reel reported **no** productivity gain or savings because there
was no comparable baseline; S14 says so in one sentence. Prefer "the
recordings show failed checks and the actions taken to repair them" over any
percentage. Session time, screen time, agent time, and lead time are
different quantities; never let one stand in for another.

## Missing footage

Keep the slot, show a neutral slate (the renderer has one: `RECORDING
PENDING / <id> / <expected evidence title>`), mute the outcome in narration
("We're waiting for the second engineer's recording here"), and label the
draft `DRAFT – PENDING RECORDINGS`. Never fill a slot with a screenshot pan,
a loop, or a fabricated screen. The reference reel ultimately used only the
four supplied recordings and a test asserts that `pending` is empty.
