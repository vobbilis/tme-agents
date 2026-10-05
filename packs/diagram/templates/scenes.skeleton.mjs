// Source of truth for the <reel title> reel.
// Narration (vo) is verbatim from SCREENPLAY.md. Diagram coordinates are in
// stage pixels: the stage is 1744 x 632 and sits under the scene title.
// A cue is a phrase from the scene's own narration; the item appears when the
// narrator says it. A null cue means the item is on screen from the first frame.

export const FILM = {
  id: '<kebab-id>',
  title: '<Reel title>',
  subtitle: '<the message, compressed to a subtitle>',
  voice: 'en-US-AndrewMultilingualNeural',
  rate: '+2%',
  fps: 30,
  width: 1920,
  height: 1080,
  transitionSeconds: 0.44,
  minimumDurationSeconds: 600,      // match the BRIEF's length
  minimumSceneSeconds: 8,
  sourceStatus: '<Owner account, dates> · <audience context>',
  message: '<BRIEF message, verbatim>',
  audience: '<audience>',
  arc: '<Question → Act 1 → Act 2 → … → Ledger>',
  chaptersComment: '<one line embedded in MP4 chapter metadata>'
}

// Helpers (styled by assets CSS; signatures fixed — do not extend casually)
const node = (id, x, y, w, h, label, options = {}) => ({ type: 'node', id, x, y, w, h, label, ...options })
const zone = (id, x, y, w, h, label, options = {}) => ({ type: 'zone', id, x, y, w, h, label, ...options })
const text = (id, x, y, w, h, label, options = {}) => ({ type: 'text', id, x, y, w, h, label, ...options })
const edge = (id, points, options = {}) => ({ type: 'edge', id, points, ...options })
const row = (id, y, label, source, badge, cue) => ({ type: 'row', id, x: 0, y, w: 1744, h: 58, label, source, badge, cue })
const beat = (cue, act, targets, options = {}) => ({ cue, act, targets: [targets].flat(), ...options })

// Name your recurring anchor object's parts ONCE and reuse them everywhere:
// const SOCKETS = ['AuthN', 'Tenancy', 'Subscription', 'User mgmt', 'Notifications']

const PART1 = 'PART 1 · <ACT ONE KICKER, TRACKED CAPS>'

export const SCENES = [
  {
    id: '01-question',
    chapter: 'The question',
    kind: 'diagram',
    theme: 'dark',                      // dark = major idea; light = mechanics
    eyebrow: '<SUBJECT> · <FILM KICKER>',
    title: '<The audience worry, as a question?>',
    support: 'For <the audience>.',     // one factual line under the title
    status: 'OPENING',                  // the evidence kicker (top-right strip)
    vo: `<Line 0 narration from SCREENPLAY.md, verbatim.>`,
    diagram: {
      items: [
        text('no', 0, 0, 1744, 200, '<One-word answer.>', { size: 'xl', cue: '<the answer phrase>' }),
        text('same', 0, 214, 1744, 60, '<the core claim sentence>', { size: 'md', cue: '<its phrase>' }),
        node('p1', 0, 320, 560, 170, '<Pillar 1>', { sub: '<one-line sub>', tone: 'green', cue: '<phrase>' }),
        node('p2', 592, 320, 560, 170, '<Pillar 2>', { sub: '<one-line sub>', tone: 'green', cue: '<phrase>' }),
        node('p3', 1184, 320, 560, 170, '<Pillar 3>', { sub: '<one-line sub>', tone: 'green', cue: '<phrase>' }),
        text('proof', 0, 540, 1744, 60, 'The journey, and the proof →', { size: 'md', tone: 'accent', cue: 'Here is the journey' })
      ],
      beats: [beat('and the proof', 'glow', ['p1', 'p2', 'p3'], { hold: 2.2 })]
    }
  },

  // Frame 2..N: one dominant idea each. Patterns to copy from the reference
  // reel (demo/opsramp-onprem-architecture-reel/scenes.mjs):
  //   03-onboarding  — zones + the anchor band + traced edges (mechanism frame)
  //   06-one-click   — a single cursor moment ({ type: 'cursor', ... })
  //   08-part-one-recap — row() ledger recap closing an act
  //   19-reuse-ledger   — the full-film ledger (rows with source + badge)
  //   20-the-answer     — the bookend (re-ask, one-word answer, compression)
]
