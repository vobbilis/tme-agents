---
title: <Reel title> - Storyboard Review V1
description: Proposed story, full narration, source scenes, and restrained visual treatment for editorial review before a render.
status: proposed-not-rendered
---

# <Reel title: the idea, then the case>

This is the editorial source of truth, in the canonical /cmo:screenplay
format. `production/scenes.mjs` parses: the `## S<nn>. Title` headings,
each scene's `Slot: mm:ss-mm:ss` line, its `Points:` list (right-panel
conclusions, ≤3 × ≤34 chars), its `Narration:` blockquotes (every line ends
`[src:<id>]` or `[CHECK]`; the tags are stripped before speech) and its
`Cues:` list (one per point, in order; 3–7 words occurring exactly once in
this scene's narration). `screenplay_lint.py --cues-per-point` checks the
same contract. Prose outside those fields (Left screen directions, this
guidance) is for humans.

**Claims rule:** The owner's confirmed account is authoritative for
narration. Recordings illustrate the work; the evidence register's "does not
establish" column is a hard boundary. Assumptions are said once and
labelled on screen. The actual outcome is preserved. No metric without a
source, interval, definition, and denominator. No `{TOKENS}` survive into a
rendered cut.

## The Story

<One paragraph. Who asks for what. Which real actors we follow. What
actually happened at the end — including the blocker. What question the
reel closes on.>

<One paragraph on the operating idea that is the main thread, and the
differentiating concept (the reference: telemetry) that must appear in the
opening and get a concrete explanation before minute four.>

## Editorial Decisions

- Keep the target length from BRIEF.md — the master is the final scene's
  Slot end, not a fixed number. Scene budgets are provisional; measured
  speech sets the final boundaries. Do not pad an under-running scene.
- Distinguish people from agents, and recordings from filmed handovers.
- Use only the recordings in the register. No promised footage.
- Say remaining work where it affects the next decision, then continue.
- One short right-panel point at a time, on its spoken phrase. Points are
  conclusions, not transcript.
- Pronunciation: <ACRONYM> as "<A C R O N Y M>". Normal spelling in captions.
- HPE Graphik, footage left two-thirds, conclusions right third, 13/30 s
  dissolves on scene boundaries only.

## Visual Treatment

**Default: no rectangle.** One fixed readable crop per excerpt. When the
passage scrolls out, cut to a newly framed excerpt at a sentence boundary.
A static rectangle only if: ≥ 8 s on the same passage, ≥ 6 s without
movement, fixed coordinates, no simultaneous camera change. At most two
candidates in the film. A frozen frame must say HELD FRAME.

## Source Register

| Code | Recording | Role and evidence |
| --- | --- | --- |
| M | <model/idea page capture> | <what it shows> |
| J | <actor-1 recording> | Engineer 1: <phase> |
| A | <actor-2 recording> | Engineer 2: <phase> |
| D | <actor-3 recording> | Engineer 3: <phase> |

Timecodes below are lookup windows into the originals, not edit decisions.

## Scene Map

| Scene | Target Film Time | Story Beat | Main Sources |
| --- | --- | --- | --- |
| 01 | 00:00-00:45 | <The idea, then the request> | M 00:00-00:17; J mm:ss-mm:ss |
| 02 | 00:45-01:25 | <What the requester needs> | J …; A … |
| 03 | 01:25-02:20 | <Actor 1 makes the request usable> | J … |
| 04 | 02:20-03:15 | <Actor 2 starts: state, checkpoints, telemetry> | A …; M … |
| 05 | 03:15-04:20 | <Discovery changes the answer> | A … |
| 06 | 04:20-05:20 | <Requirements kept distinct> | A … |
| 07 | 05:20-06:20 | <Approaches compared, plan reviewed> | A … |
| 08 | 06:20-07:25 | <Actor 3 picks up and bounds the work> | A …; D … |
| 09 | 07:25-08:25 | <The change itself> | D … |
| 10 | 08:25-09:30 | <Tests and their limits> | D … |
| 11 | 09:30-10:30 | <A failure and its repair> | D … |
| 12 | 10:30-11:35 | <Reconcile with the real repository> | D … |
| 13 | 11:35-12:45 | <The real delivery state> | D … |
| 14 | 12:45-14:10 | <What should return — a question> | D reprises |
| 15 | 14:10-15:00 | <Back to the idea; the invitation> | M; short reprises |

(This table is a HUMAN planning overview — it is not parsed. The parsed
slot is each scene's own `Slot:` line below; keep the two in step. The
15-row arc shown is the REFERENCE reel's shape — size yours to the brief:
scene count and master length are the owner's call, not a template rule.)

## Full Narration And Scene Direction

## S01. <The Idea, Then The Request>
Slot: 00:00-00:45

**Left screen:** <Begin on the idea's own page. Cut to <section> on the
phrase "<…>", then to the request. No rectangle.>

Points:
- <Conclusion one>
- <Conclusion two>
- <Conclusion three>

Narration:
> <Welcome to …. Common principles …. Let's get into a real, recent …
> request: …. We'll follow <N> engineers and their agents through …, with
> the work and its execution records connected throughout.> [src:<owner-fact-or-register-id>]
Cues:
- <3-7 word phrase from this scene>
- <…>
- <…>


## S02. <What The Requester Needs>
Slot: 00:45-01:25

**Left screen:** <Readable ticket description and criteria, then the agent
retrieving the same request. Keep the ticket identity visible. No rectangle.>

Points:
- <…>
- <…>
- <…>

Narration:
> <…> [src:<owner-fact-or-register-id>]
Cues:
- <3-7 word phrase from this scene>
- <…>
- <…>


## S03. <Actor 1 Makes The Request Usable>
Slot: 01:25-02:20

**Left screen:** <Explicit retrospective cut to field preparation, then
enrichment, then the created ticket. Label Engineer 1. No rectangle.>

Points:
- <…>
- <…>
- <…>

Narration:
> <…> [src:<owner-fact-or-register-id>]
Cues:
- <3-7 word phrase from this scene>
- <…>
- <…>


<!-- Repeat for 04–13: one phase each. Scene 08 switches recordings and
     actors: name it in narration ("Engineer three takes up …") and in the
     left-screen direction. Scene 11 is the failure-and-repair scene: keep
     the sequence failed command → inspection → revision → rerun. -->

## S14. <What Should Return To The Requester?>
Slot: 12:45-14:10

**Left screen:** <Revisit the real scope trace, test summary and ticket
summary as three readable excerpts. Boundary label: PROPOSED RETURN HANDOFF.
Use real artifacts while describing the proposal. No rectangle.>

Points:
- What changed?
- What was checked?
- What needs a decision?

Narration:
> <Now let's connect the engineering work back to …. We want to shape that
> handoff together: …> [src:<owner-fact-or-register-id>]
Cues:
- <3-7 word phrase from this scene>
- <…>
- <…>


## S15. <Return To The Operating Idea>
Slot: 14:10-15:00

**Left screen:** <Short reprise of the ticket, the finding, the delivery
summary; end on the idea page's <section>. Motion within available ranges;
no long unlabelled freeze. No rectangle.>

Points:
- <…>
- <…>
- <…>

Narration:
> <That brings us back to …. <N> engineers have worked through …. With
> <requester>, the next step is to shape …. We will keep refining … while
> holding the governing principles constant.> [src:<owner-fact-or-register-id>]
Cues:
- <3-7 word phrase from this scene>
- <…>
- <…>


## Before Another Render

This is a screenplay, not a rendered cut. Approve the story and narration
first; measure the voice; redistribute budgets within the master; select
excerpts against motion; leave highlight candidates off until their quiet
intervals pass playback review; rebuild and re-check after approval;
preserve every earlier MP4 and give the next export a new name.
