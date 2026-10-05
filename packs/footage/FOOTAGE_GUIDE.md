# FOOTAGE_GUIDE — real screen recordings as the proof

This is the part of the style that has no equivalent in the diagram reels.
Everything here was learned on the SDLC reel's three cuts.

## 1. Recording

- Record **continuously, at native resolution, silent**. The reference
  sources are 3456×2098 QuickTime screen recordings at ~60 fps (variable
  frame rate), 13–27 minutes each, no audio. Keep 5–10 s of handles around
  anything you expect to use.
- Record **the whole flow, not a tour**. The editor needs the moment a
  command is typed, the moment the answer lands, and the scroll in between.
- One recording per actor/phase. The reference used one each for ticket
  preparation, analysis, and delivery, plus a 30 s capture of the operating
  model page. The actor label on screen comes from which file a shot uses.
- Browser zoom high enough that body text is legible once the frame is
  scaled to 1168 px wide. Rule of thumb: if you cannot read it at 33% in
  QuickTime, the audience cannot read it in the well.
- Nothing you would not want on screen: close unrelated chats, silence
  notifications, use a clean profile. Redaction later is a cut, not a blur.

## 2. Register and probe

For every file, in `EVIDENCE_REGISTER.md`:

```bash
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of json <file>.mov
```

Record duration, resolution, fps, codec, **what it shows**, **what it does
not establish**, and **exclusion ranges**. Reference exclusions: a lock
screen at 20:00–22:00 in analysis.mov and unrelated chat after 12:00 in
jira-creation.mov. `prepare-footage.mjs` hard-fails any excerpt that
touches an exclusion range — write them in as code, not as a note.

Source timecodes in the screenplay are **search windows for the editor**,
not edit decisions. Final in/out points are chosen against motion in phase 3.

## 3. The shot model (`scripts/lib/shots.mjs`)

One scene has three right-panel points; by default one excerpt per point.
The `sources` map is the entire edit decision list:

```js
const sources = {
  s02: [[jira, 645], [jira, 655], [analysis, 475]],
  s04: [[analysis, 42, false, 'Engineer two sets'],
        [analysis, 104, false, 'State retains'],
        [model, 22, true, 'Telemetry records how the flow executes'],
        [analysis, 149, false, 'The feature-analysis agent loads']],
  s15: [[model, 0], [model, 8, true], [model, 17, true]]
}
//  [recording, startSeconds, holdLastFrame?, cueOverride?]
```

- The **cut point** between excerpts is the measured time the narrator
  speaks the next point's cue (rounded to 1/30 s). Change the words and the
  cuts move with them. A fourth entry overrides the cue when you need a
  cut that is not a panel reveal (S04 cuts to the model page mid-scene).
- `holdLastFrame: true` lets a short source (the 30 s model page) fill a
  longer excerpt; ffmpeg clones the last frame (`tpad`) and the renderer
  appends ` / HELD FRAME` to the source strip from the moment the hold
  begins. A freeze without that label is forbidden.
- The owner label is derived from the file: `Engineer 1: ticket
  preparation`, `Engineer 2: analysis and planning`, `Engineer 3:
  implementation and delivery`, `Operating model`. Edit the map in
  `shots.mjs` for your actors.
- Excerpt files are `assets/footage/<scene>-<n>.mp4` with a `.json`
  receipt (fingerprint of shot+source, sha256, profile, review status).
  Re-running `prepare-footage` only re-encodes shots whose fingerprint
  changed.

## 4. Preparing excerpts (`node scripts/prepare-footage.mjs [--only s04-2]`)

- Requires complete narration first (cuts are at measured cue times), the
  system `/opt/homebrew/bin/ffmpeg` + `ffprobe`, and ≥ 5 GB free disk.
- Profile: `fps=30, scale=2560:-2, h264_videotoolbox 12 Mbps, yuv420p,
  silent, +faststart`. 2560 wide leaves headroom for a 2.2× crop at 1168.
- Constant-frame-rate sources use `-ss` input seeking; the variable-frame-
  rate model capture uses a `trim` filter so the excerpt starts at exactly
  0.000 s (a test asserts `start_time < 1/30`).
- Encoded duration must match the shot within 0.1 s or the run fails.
- Output goes to a `.partial.mp4` and is renamed on success; an interrupted
  encode never leaves a plausible-looking file behind.
- `reports/footage.json` lists every shot with `ready: true/false`.

## 5. Choosing the crop (`node scripts/prepare-focus.mjs`)

The reel never shows the whole desktop. Each excerpt is shown through
**one fixed crop** of the 1168×710 well, chosen so the text the narrator
talks about is readable and stays in frame for the whole excerpt.

- `prepare-focus` samples each excerpt at 2 fps, runs Apple Vision OCR
  (`scripts/inspect-frames.swift`, compiled to `reports/inspect-frames`),
  and matches each shot's **target phrases** — a `|`-separated list of
  regexes of text you expect on screen:
  ```js
  's11-0': 'validator|schema|exits 1|scope drift',
  's12-2': 'Liquibase|changeset|September|2026.09|release|listing',
  ```
  Write targets from what the narration names; they are how you tell the
  tool "this is the passage that matters".
- Per-source `minimumX` filters ignore the left part of the screen (a chat
  column lives on the right in the agent recordings: 0.64; Jira: 0.12;
  model page: 0.10). Adjust for your layouts.
- The union of every matched paragraph box across the excerpt becomes the
  camera: `scale = min(2.6, 0.88/width, 0.68/height)`, translated so the
  box is centred and clamped to the well. The camera is **set once** at the
  excerpt start (`tl.set`, never `tl.to`): no pans, no follow.
- If a target never matches, the run fails: "no source text matched;
  choose a better excerpt or target". That is the tool telling you the
  excerpt does not show what the narration claims.
- Review: `reports/focus-tracking/<shot>/*.jpg` are the sampled frames.
  Look at the first and last. If the passage scrolls out, cut to a new
  excerpt at the next sentence boundary instead of chasing it.

Non-macOS fallback: any OCR that emits `{"file","lines":[{"text","x","y",
"width","height"}]}` (normalised 0–1, y from top) per frame can replace the
Swift binary; or hand-write the `box` for each shot in `assets/focus.json`.

## 6. Highlight rectangles: default OFF

Cuts one and two used OCR-following rectangles and camera pans; the review
called them distracting and they were removed. A static rectangle is allowed
only when **all** hold:

1. The narration discusses the same visible passage for ≥ 8 s.
2. Playback confirms the passage does not move for ≥ 6 s.
3. The outline fits at fixed coordinates, appears once, disappears before
   the screen moves.
4. No simultaneous camera movement, pulsing, resizing, or target switch.

At most two candidates per film. The reference shipped with zero. A test
asserts no `focus-rect` is rendered.

## 7. Labels the footage must carry

| Label | Where | When |
|---|---|---|
| `<actor> / <mm:ss> / excerpt at 1x` | source strip | every real excerpt |
| `… / recorded excerpt / HELD FRAME` | source strip | from the hold start |
| boundary label (amber) | well top-left | a reading the audience could get wrong: edited chronology, a document rather than a run, a blocked state, a proposal |
| `RECORDING PENDING` slate | whole well | only for an agreed missing capture |
| `DRAFT nn / <evidence status>` | status row | every frame until final |

Speed is always 1x. "Excerpts and accelerated waits must be labelled" was
the rule; the reel resolved it by never accelerating. Shorten the excerpt
around the useful moment instead.

## 8. Redaction and privacy

- Review the **full moving footage**, not sampled frames. OCR frames and
  contact sheets are production aids; a human must scrub every excerpt.
- Approved identifiers (issue keys, commit hashes, test names) stay
  readable; credentials, notifications, unrelated chats, personal data are
  cut out by choosing different excerpt bounds.
- Raw recordings never leave the machine: no Hyperframes publish/cloud
  render, no uploading to a TTS service, not committed to git. Only the
  narration text goes to Edge TTS, and only after the owner approves the
  script for external speech processing.
- Excerpt receipts record `review: 'complete audiovisual and redaction
  review pending'` until a named person signs the handover.
