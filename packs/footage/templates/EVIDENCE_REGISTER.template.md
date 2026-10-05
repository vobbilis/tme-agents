# Evidence register — <reel title>

Written before the screenplay. Every recording the reel may use, what it
shows, what it must not be made to say, and the ranges that may never appear.
The owner signs this before phase 1.

## Recordings

| Code | File | Duration | Resolution / fps / codec | Actor (label on source strip) | Shows | Does not establish |
|---|---|---|---|---|---|---|
| M | `<page-capture>.mov` | 0:30 | 2560×1600 / vfr / h264 | Operating model | the declared idea/principles page | that this case satisfied every principle |
| J | `<actor-1>.mov` | 12:56 | 3456×2098 / ~60 / h264 | Engineer 1: <phase> | <…> | <…> |
| A | `<actor-2>.mov` | 27:28 | 3456×2098 / ~60 / h264 | Engineer 2: <phase> | <…> | <…> |
| D | `<actor-3>.mov` | 26:21 | 3456×2098 / ~60 / h264 | Engineer 3: <phase> | <…> | <…> |

Probe command used: `ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_name -of json <file>`.

## Exclusion ranges (encoded as hard failures in `scripts/prepare-footage.mjs`)

| File | Range | Reason |
|---|---|---|
| `<actor-2>.mov` | 20:00–22:00 | lock screen |
| `<actor-1>.mov` | after 12:00 | unrelated chat |

## Owner-confirmed facts (authoritative for narration)

- <e.g. six months of practice; enforced baseline; local customization>
- <e.g. three different engineers across the three recordings>
- <e.g. the ticket key is the entry point; do not invent a predecessor>

## Historical outcome to preserve

- <e.g. local commit `<hash>`; push permission-blocked; ticket moved to
  Code Review at the engineer's request. Code Review is not acceptance.>

## Identifiers approved to remain readable on screen

- <issue keys, commit hashes, test file names, release folder names>

## Redaction decisions

| Item | Decision | Who | When |
|---|---|---|---|
| <assignee names in ticket sidebar> | <keep / avoid via crop / exclude range> | | |

## Review status

- [ ] Full moving footage scrubbed for credentials, notifications, personal data — reviewer: ______ date: ______
- [ ] Every excerpt in `reports/footage.json` traced back to a row above
