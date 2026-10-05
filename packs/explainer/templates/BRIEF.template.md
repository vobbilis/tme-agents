# <Reel title>

<Org> · <Subject> · <Cut name>

## Request and production order

<What the owner asked for, quoted.> Produce the narration script first, then
the storyboard, original illustrations, and finally the production screenplay.
Use the explainer pack's local Node / Chromium / FFmpeg pipeline with the
established narrator. **No Hyperframes.**

The owner authorized production on <date>. This is a new isolated reel; do
not overwrite, splice, publish or change previous films.

## The story (one paragraph, then one sentence)

<What changes in the work, why it is trustworthy, what remains to be earned.>

The viewer should leave understanding <X> and <Y>. This is a self-contained
reel, not an introduction to a demonstration.

## Audience and form

- <Who>; accessible to reviewers who are not specialists in <the subject>.
- A narrated, illustrated explanation with a self-contained animated closing.
- Duration requirement: **<300–360> seconds** including opening and closing
  holds. `MIN_DURATION` / `MAX_DURATION` in `story.mjs` enforce it.
- 1920×1080, 30 fps, H.264 MP4, AAC stereo, English SRT/VTT and selectable
  captions. Voice `en-US-AndrewMultilingualNeural`, `+2%`.
- Audio identity: narration-led, deliberate silence underneath. No music.

## Source hierarchy

1. <The owner's latest follow-up: title, framing, corrections.>
2. <The owner's memo / conversation — path, length, what it supplies.> Its
   automatic transcript is an aid, fallible on acronyms and names.
3. <Supplied document(s) — path, size, what they supply: principles,
   ownership, scope. Note explicitly if the document calls its flow "future
   state" and its benefits "expected outcomes".>
4. Prior reels — production style and voice only, never evidence.

## Evidence boundaries

- Do not claim <measured savings, adoption, coverage, certification, safety>.
- Do not display made-up <scores, counts, tickets, fixes, scan results> or a
  fabricated screen as evidence.
- The <example> in chapters <4–7> is clearly labelled hypothetical; it
  illustrates intended process, not an outcome.
- <Unconfirmed names → generic phrasing until the owner confirms.>
- <Do not imply the illustrated environment is an existing named system.>
- Successful checks are scoped evidence, not proof of <safety / readiness>.
- Ownership: <who owns changes>; <who owns risk / decisions / exceptions>.
- <Thresholds and routing not supplied → diagrams distinguish lanes without
  inventing numbers.>

## What is available, and what is not

<Inputs on hand. No application URL or footage is required.> The reel ends
with <the animated close> and a completed thought, not a placeholder or a
promise of a later demo.

## Visual direction

Concept: <one recurring visual thread — e.g. an amber question that gathers
a mint evidence thread>. Amber marks a question or boundary, not a confirmed
problem; mint marks connected evidence, not safety; blue marks human
authority. HPE Graphik, deep forest / warm ivory, large editorial headlines,
original editable vector diagrams. No stock imagery.

Content within x 104–1816 and y 170–887; footer ends by y 951; y 965–1064
reserved for captions. Diagrams reveal progressively with a stable spatial
arrangement inside each chapter. The close: <what moves, from where to
where, and the payoff line>.

## Deliverables

`SCRIPT.md`, `STORYBOARD.md`, editable SVG illustrations, `storyboard.html`,
`SCREENPLAY.md`, `REVIEW_DISPOSITIONS.md`, reproducible scripts, the MP4,
captions, `review.html`, verification report, handover. All generated output
under `production/out/`. Technical verification is distinct from human
listening/viewing approval. Nothing is pushed or published.

## Status

<brief approved? script approved for TTS? board approved? review received?
narration measured? which cut delivered? which reviews pending?>
