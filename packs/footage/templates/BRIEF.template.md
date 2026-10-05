---
title: "<Reel title>"
workflow: general-video
flow: automation
storyboard: yes
---

# <Reel title> — <cut name>

The approved parent `../STORYBOARD_REVIEW.md` supplies narration and panel
text; `scenes.mjs` reads it directly. Measured speech sets the scene
boundaries within the <15>-minute master; the screenplay's scene times are
provisional.

- Audience: <who, and what they decide after watching>.
- Length: exactly <15:00>, including <measured> s of narration and brief
  scene tails.
- Treatment: HPE Graphik, forest/warm canvas, playing footage left
  two-thirds, three word-cued conclusions right third.
- Opening: <the operating idea, then "let's get into a real, recent …">.
  Pronunciation notes: <…>.
- Sources: <N> recordings per `../EVIDENCE_REGISTER.md`. Owner confirmed
  that <recordings> show <N> different engineers. No additional recordings
  are expected.
- Narrative authority: the owner's confirmed account (<facts>) is narrated
  directly over the relevant recordings. Preserve the actual outcome:
  <e.g. the push-access blocker>. No invented savings or acceptance.
- Scope / claim boundary: <assumptions named once>; no <runtime / acceptance
  / publication> claims.
- Ending: <the invitation>.
- Audio: Andrew Multilingual Neural, -12%, measured reading, no music.
  Frame-aligned scene timing rejects long silent tails.
- Speech processing: owner approved Microsoft Edge TTS for the script text
  on <date>. Raw footage stays local.
- Privacy: local-only preview/render, telemetry disabled, no publish/cloud
  paths. Redaction review of full moving footage before any distribution.
- Dependencies: pinned kit modules; Hyperframes 0.8.62; edge-tts 7.2.8.
- Delivery: a separately named MP4 per cut; preserve earlier cuts.
- Do not use `publish` or hosted/cloud rendering for internal material.
- Reference material is terminology and big-picture context only — it does
  not choose the reel's argument.
  Technical verification does not replace audiovisual or redaction review.

## Local Production

Narrate first, then footage preparation (validates source bounds and
exclusion ranges, writes partial files before finalising, fingerprints
clips), then focus, build, tests, checks, snapshots. Needs 5 GB free disk
and the system FFmpeg/FFprobe. Do not interrupt a running encode. Choose a
free Studio port. Preserve all originals.

## Status

<narration measured? excerpts ready? tests passing? which cut exported?
which reviews pending?>
