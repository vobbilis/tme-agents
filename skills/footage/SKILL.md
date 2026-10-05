---
name: footage
description: Real screen recordings and live product capture as proof in cmo-plugin footage reels — recording checklist, the evidence register with its "does not establish" column, the shots map, encode profile, OCR-chosen fixed crop, rectangle policy, provenance labels, exclusion ranges as code, redaction, and what to do when capture exposes a product bug. Load before registering recordings, cutting excerpts, choosing crops, or capturing a product with Playwright. Encodes lessons 19–27, 46, 47.
---

# footage

Footage is the one thing a slide cannot fake, which is why every rule here
protects its honesty: real speed, real chronology, real outcome, labelled
provenance, and a register that says what each recording does **not** prove.
The full worked reference is `packs/footage/FOOTAGE_GUIDE.md`; read it for
the exact scripts and numbers.

## 1. Two kinds of footage

| Kind | Source | Proof grade | Used by |
|---|---|---|---|
| **Screen recording** | a human recorded continuous work (QuickTime, 3456×2098, ~60 fps VFR, silent, 13–27 min) | someone really did this, in this order, with this outcome | SDLC evidence reel |
| **Scripted capture** | Playwright drives the real product at a pinned commit, with assertions and receipts | the product really does this, at that commit, with these fabricated inputs | Learn, GTM, toolkit film |

Both are "footage" to the frame. Both need a register row. Neither is
tinted, sped up, looped or frozen without a label.

## 2. Recording checklist (give this to the person recording)

- Continuous, native resolution, silent. 5–10 s handles around anything
  useful. The whole flow, not a tour: the moment a command is typed, the
  moment the answer lands, the scroll between.
- One recording per actor/phase. The actor label on screen comes from which
  file a shot uses.
- Browser zoom high enough that body text is legible once scaled to
  1168 px wide (if you cannot read it at 33 % in QuickTime, the audience
  cannot).
- Clean profile, notifications silenced, unrelated chats closed. Redaction
  later is a cut, not a blur.
- Playwright traps (Learn reel): lazy routes need a real `page.goto`; the
  lesson panel docks on a list-row click; regular Chromium lost the bottom
  ~87 px of recorded video while screenshots looked fine — use the dedicated
  headless shell and inspect the actual video; record a 16×16 magenta marker
  per scene and scan it at 30 fps to correct the Playwright video clock.

## 3. The evidence register — before the screenplay (lesson 24)

```bash
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of json <file>
```

Per recording: code, file, duration, resolution/fps/codec, **actor label**,
**shows**, **does not establish**, **exclusion ranges**. Then: owner-
confirmed facts, the historical outcome to preserve, identifiers approved to
remain readable, redaction decisions, review status. The owner signs it.

The "does not establish" column **is the claim boundary**: the screenplay may
not say anything that column rules out. Reference rows: "jira-creation.mov:
the 12 proposed stories are rows, not linked issues"; "deliver.mov: no real
MySQL execution, no independent reviewers, no successful PR, no acceptance".

Exclusion ranges are **code** (`prepare-footage.mjs` hard-fails an excerpt
touching them), never a note.

## 4. The shots map — the entire edit decision list

```js
const sources = {
  s04: [[analysis, 42, false, 'Engineer two sets'],
        [analysis, 104, false, 'State retains'],
        [model, 22, true, 'Telemetry records how the flow executes']],
}  // [recording, startSeconds, holdLastFrame?, cueOverride?]
```

- One excerpt per right-panel point by default. The **cut point** is the
  measured time of the next point's cue, rounded to 1/30 s. Change the words
  and the cuts move.
- `holdLastFrame: true` lets a short source fill a longer excerpt; ffmpeg
  clones the last frame (`tpad`) and the source strip appends ` / HELD
  FRAME` from the hold start. A freeze without that label is forbidden.
- Screenplay timecodes are **search windows**, not edit decisions.

## 5. Excerpts — the encode profile (lesson 20)

`fps=30, scale=2560:-2, h264_videotoolbox 12 Mbps, yuv420p, silent,
+faststart`. 2560 wide leaves headroom for a 2.2× crop at 1168. CFR sources
use `-ss`; VFR sources use a `trim` filter so the excerpt starts at exactly
0.000 s (a test asserts `start_time < 1/30`). Duration mismatch > 0.1 s
fails. Output to `.partial.mp4`, renamed on success. Receipts fingerprint
shot + source + profile; only changed shots re-encode. Requires narration
first (cuts are at measured cue times), system ffmpeg, ≥ 5 GB free.

## 6. The crop — chosen by OCR from what the narration names (lesson 19)

The reel never shows a whole desktop. Each excerpt is one **fixed crop** of
the 1168×710 well. `prepare-focus` samples at 2 fps, runs Apple Vision OCR
(`inspect-frames.swift`), matches each shot's **target phrases** (regexes of
text the narration names: `'validator|schema|exits 1|scope drift'`), unions
the matched boxes, and sets the camera once: `scale = min(2.6, 0.88/w,
0.68/h)`, centred, clamped. `tl.set`, never `tl.to` (a test asserts it).

If a target never matches, the run fails: the excerpt does not show what the
narration claims. Plain English: "The excerpt for scene 5, point 2 never
shows the text the narration names." Review `reports/focus-tracking/<shot>/`
first and last frames; if the passage scrolls out, cut to a new excerpt at
the next sentence, do not chase it.

### Rectangles: default OFF

Cuts one and two used OCR-following rectangles and pans; the review called
them distracting. A static rectangle only if **all** hold: same passage
narrated ≥ 8 s; no movement ≥ 6 s; fixed coordinates, appears once; no
simultaneous camera change. ≤ 2 per film. The reference shipped with zero.

## 7. Labels the footage must carry (lesson 21)

| Label | Where | When |
|---|---|---|
| `<actor> / <mm:ss> / excerpt at 1x` | source strip | every excerpt |
| `… / HELD FRAME` | source strip | from the hold start |
| amber boundary label | well top-left | a reading the audience could get wrong: edited chronology, a document not a run, a blocked state, a proposal |
| `RECORDING PENDING` slate | whole well | only an agreed missing capture |
| `DRAFT nn / <status>` | status row | every frame until final |
| `EDITORIAL SUMMARY · CAPTURED ASSESSMENT` | over any readable summary derived from captured records, original UI kept below | lesson 47 |

Speed is always 1x. Shorten the excerpt around the useful moment instead.

## 8. When capture exposes a product bug (lesson 46)

The GTM capture hit a history-deduplication defect: equal Teach/Certify
evidence suppressed the independent pass. The rule:

1. **Document** it in `CAPTURE_NOTES.md`: symptom, source location, both
   digests, reproduction.
2. **Route around** through the real UI with a valid alternate input (a
   different registered collector), so the unchanged app produces the
   distinct record.
3. **Never fix** the app, change storage, or inject a saved result.
4. **Never claim** it is resolved. Say "not fixed" in the notes and the
   handover; propose the separate application change out of scope.

## 9. Redaction and privacy (lessons 25, 26)

- Review the **full moving footage**, not sampled frames. OCR frames and
  contact sheets are production aids; a named human scrubs every excerpt.
  `marketing-privacy-reviewer` lists candidates; it never clears them.
- Approved identifiers (issue keys, hashes, test names) stay readable;
  credentials, notifications, chats, personal data are cut by choosing
  different excerpt bounds.
- Raw recordings never leave the machine: no publish, no cloud render, no
  upload, never committed (`*.mov *.mp4 *.webm assets/footage/**` are
  hook-denied at `git add`). Only narration text goes to Edge TTS, after
  owner approval.
- Receipts carry `review: 'redaction review pending'` until a named person
  signs the handover.

## 10. Owner questions per shot (the only gate the owner needs)

Show first and last crop frame. Ask one thing: **"Is what the narrator names
readable and in frame?"** Yes → next shot. No → different excerpt or target,
never a pan.
