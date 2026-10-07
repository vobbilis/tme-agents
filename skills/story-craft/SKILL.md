---
name: story-craft
description: Story and claims craft for narrated product films — the three arcs (question-bookend diagram, evidence footage, organization-first explainer), the claims rule, the status-label taxonomy, the organization-first ban list, editorial-summary labelling and the source hierarchy. Load before writing or reviewing a brief, screenplay or script for any cmo-plugin reel. Encodes lessons 1–12, 40, 41, 47, 51.
---

# story-craft

The story is the owner's argument, told in the form that fits the evidence.
This skill tells you which arc to use, what every scene must contain, and
what may never be said. The pack for the chosen form has the full worked
reference; read its `STORY_STRUCTURE.md` (footage, explainer) or `CLAUDE.md`
(diagram) alongside this.

## 1. Pick the form first, never mix

| Evidence on hand | Form | Pack | Arc |
|---|---|---|---|
| Systems, components, relationships; an audience worry | **diagram** | `packs/diagram/` | question-bookend |
| Real screen recordings of real work | **footage** | `packs/footage/` | evidence |
| A way of working, a model, a policy; no product to show | **explainer** | `packs/explainer/` | organization-first explainer |

One form per film. If a story seems to need two, it is two films.

## 2. The three arcs

**Question-bookend (diagram, ~13 min, 18–20 frames).** Frame 1 asks the
audience's worry as a question and answers it in one word within ten
seconds. Each act proves part of the answer and ends in a recap frame. One
anchor object (the on-prem reel's five-socket band) returns in every act.
The last frame re-asks the question verbatim, answers it, compresses the
argument into 3–4 sentences, thanks the audience.

**Evidence (footage, 10–15 min, 10–15 scenes).** Open on the operating idea,
then "let's get into a real, recent request." Follow one request through N
real actors. Preserve the real outcome, including a failure and its repair.
A proposal scene framed as a question over real artifacts labelled
PROPOSED. Close by returning to the idea with an invitation, not a CTA.
Theme flips mark act boundaries only.

**Organization-first explainer (5–6 min, 10 chapters).** Title and the shift
→ the cost of the old way → the familiar loop customised → context changes
the question (introduce the one labelled hypothetical) → a controlled place
to run → distinct roles, one evidence trail → close the loop → clear
authority → maturity, honestly → animated close ≤ 12 s. Ownership revealed
early enough to read.

## 3. What every scene contains

- A **title that is itself a conclusion** ("The Existing Code Changes The
  Answer", "Good work. Too much distance."), ≤ ~45 characters.
- **One dominant idea.** If a frame needs two sentences of support copy, it
  is two frames.
- **Right-side or on-screen text = conclusions, not transcript.** Three
  points ≤ ~34 chars (footage) or four state captions ≤ ~45 chars
  (explainer). Never narration fragments.
- **Narration** 60–170 words depending on form, each cue phrase 3–6 words
  occurring exactly once.
- **Claims tag.** Every substantive sentence traces to an owner-confirmed
  fact or an evidence-register row. Unconfirmed → **CHECK**.

## 4. The claims rule (verbatim, adjust names)

> Every substantive line comes from <NAMED OWNER>'s own account. Reference
> material supplies terminology and, where quoted, principles in their own
> order; it does not choose the argument. Items marked **CHECK** need the
> owner's confirmation before speech is generated. Names the owner has not
> confirmed stay generic.

Whether a confirmed claim is true is the owner's judgement (design P2a).
Your job is traceability and labelling, not verification.

## 5. Source hierarchy (write it into BRIEF.md)

1. The owner's latest follow-up (title, framing, corrections).
2. The owner's memo or conversation. A transcript is an aid, fallible on
   acronyms ("glass wing" → say "shared security harness").
3. Supplied documents, GRADED in the register (owner decision 2026-10-06):
   each registered PDF/deck carries a row saying what it may ground —
   terminology, principles, scope, product facts, dates — and what it may
   not. A citation `[src:doc-<id>-p<n>]` is valid only inside that grade.
   If a document calls its flow "future state" and its benefits
   "expected", so does the film.
4. Prior reels: style and voice only, never evidence.

A document never chooses the film's argument, whatever its grade — the
argument is the owner's alone (the rule that cost a full cut). An
UNREGISTERED deck, PDF or web page is never a claims source at all.

## 6. Organization-first: the ban list (lesson 40)

The rejected engineering cut led with repository evidence. Never in
narration or on a slide: contributor names or roll calls, PR counts, test
totals, file paths, command inventories, hashes, "we are leading / mature /
unusually active". Active use is shown by separate authors, merged changes,
working screens and repeated workflows, not asserted.

## 7. Status-label taxonomy (lesson 41)

Use these exact labels on screen when maturity could be misread; nothing in
between, and "in production" is never shorthand for "in the Twin":

`CURRENT REPOSITORY SNAPSHOT` · `MERGED IN THE TWIN` · `WORKING PROTOTYPE` ·
`APPROVED PROPOSAL · NOT SHIPPED` · `IMPLEMENTED PROPOSAL · UNDER REVIEW` ·
`OPEN · NOT YET RUN`

Footage adds boundary labels in amber: `/jira-ticket-creation`,
`PRODUCT REQUIREMENTS DOCUMENT`, `EDITED EXCERPTS – …`, `LOCAL COMMIT – push
access blocked`, `PROPOSED RETURN HANDOFF`, `RECORDING PENDING`.
Explainers add `HYPOTHETICAL · <QUESTION>` and `Operating-model
illustration`.

## 8. Rules that cost a cut each

1. **Open on the idea, not the ticket** (SDLC cut one was called a
   challenge-response pitch).
2. **Preserve the real outcome.** "Local commit retained / Push access
   blocked." Never splice later success into chronology.
3. **One limit, said once, where it changes the next decision.** Then move
   on. Repeated proof disclaimers were the first-cut disease.
4. **Thread the differentiating idea before minute four** and show it on
   screen when you say it.
5. **People are not agents; recordings are not handovers.** "Engineer three
   takes up the implementation." An agent that reproduces is a "Challenge"
   role in mint; a human who validates is blue.
6. **Assumptions said once, labelled on screen**, never contradicted by a
   green check.
7. **A number needs a source, interval, definition and denominator**, or it
   is not said. The 15-minute SDLC reel reports zero productivity metrics
   and says why in one sentence.
8. **A failure is a scene, not an embarrassment.** It is the one thing a
   slide cannot fake.
9. **The proposal scene is a question** over real artifacts; never a mock-up
   of the thing that does not exist.
10. **Close with an invitation or a payoff, not a CTA**, and not "let us
    show you".
11. **Editorial summaries are labelled** `EDITORIAL SUMMARY · CAPTURED
    ASSESSMENT` with the original UI kept below (lesson 47).
12. **Future state is said as future state.** "Intended outcomes, to be
    measured as the capability matures."

## 9. Working with the owner

One question at a time. Present the screenplay in groups of 3–5 scenes (or
3 chapters). Every CHECK stops the conversation until answered. Before TTS:
"This text will be sent to Microsoft Edge TTS. Approve?" When a line is
corrected, edit the single source (screenplay / SCRIPT.md); everything else
regenerates.
