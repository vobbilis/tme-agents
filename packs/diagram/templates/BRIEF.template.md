---
title: "<Reel title>"
workflow: general-video
flow: automation
storyboard: no
message: "<ONE sentence. The thing the audience should repeat afterward.>"
destination: internal-review
aspect: 1920x1080
language: en
audience: <exact audience, e.g. "HPE Chief Technologist council">
length: <e.g. 10m+>
voice: en-US-AndrewMultilingualNeural
---

## Intent

<2–4 sentences. Name the audience's actual worry and state that this reel
answers it directly. Example shape: "A narrated architecture journey for
<audience>: <arc in one breath>. It answers one worry directly: <the worry,
as a question>?">

## Sources

- The claims, structure, and wording come from <NAMED OWNER>, captured in
  `SCREENPLAY.md` and `scenes.mjs`.
- <"No product capture is used; every visual is a generated diagram." OR name
  the pinned product commit and capture plan.>

## Customizations

- Microsoft Edge TTS voice `en-US-AndrewMultilingualNeural` at `+2%`.
- Diagram scenes (`kind: 'diagram'`, `scripts/lib/diagram.mjs`) reveal blocks,
  arrows, and highlights on the narration's own word timings.
- Selectable English captions and chapter metadata in the final MP4.

## Notes

- Hyperframes is pinned to `0.8.62`.
- Set `HYPERFRAMES_NO_TELEMETRY=1` on every Hyperframes command.
- Do not use `publish` or hosted/cloud rendering for internal material.
- <Reference decks/material> are terminology and big-picture context only —
  they do not supply claims, evidence, story order, or conclusions.
- <List the load-bearing factual constraints the owner has set: what is TBD,
  what must NOT be claimed, hedges that must survive editing.>
