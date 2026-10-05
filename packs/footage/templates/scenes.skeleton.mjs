// production/scenes.mjs — parses ../STORYBOARD_REVIEW.md (the source of
// truth, written by /cmo:screenplay in the canonical screenplay format):
//   ## S<nn>. <Title>            one heading per scene
//   Slot: mm:ss-mm:ss            provisional slot; measured speech wins
//   Points:                      right-panel conclusions (≤3, ≤34 chars)
//   Narration:                   `> ` lines; [src:]/[CHECK] claim tags are
//                                STRIPPED here — they must never be spoken
//   Cues:                        one per point, in order; a 3–7 word phrase
//                                occurring exactly once in this scene's vo
// Scene count comes from the file. Change the screenplay, not this file,
// to change the film. (`screenplay_lint.py --cues-per-point` checks the
// same contract from the other side.)
import { readFileSync } from 'node:fs'



// Spoken substitutions: applied to narration AND cues. Mirror every pair in
// displayCaption() (scripts/lib/speech.mjs) so captions keep normal spelling.
const spoken = value => value
  .replace(/\bBU\b/g, 'B U')
  .replace(/\bOPSEXT\b/g, 'O P S E X T')

const TAG = /\s*\[(?:src:[^\]]+|CHECK)\]\s*$/
const seconds = value => value.split(':').map(Number).reduce((total, part) => total * 60 + part, 0)

const text = readFileSync(new URL('../STORYBOARD_REVIEW.md', import.meta.url), 'utf8')
const headings = [...text.matchAll(/^## S(\d{2})\. (.+)$/gm)]
if (headings.length === 0)
  throw new Error('No "## S<nn>. <Title>" scenes found in STORYBOARD_REVIEW.md — is it in the /cmo:screenplay format?')

const parseBody = body => {
  const points = []
  const cues = []
  const narration = []
  let slot = null
  let theme = null
  let status = null
  let section = null
  for (const raw of body.split('\n')) {
    const line = raw.trimEnd()
    if (/^Slot:/.test(line)) { slot = line.slice(5).trim(); section = null; continue }
    if (/^Theme:/.test(line)) { theme = line.slice(6).trim(); section = null; continue }
    if (/^Status:/.test(line)) { status = line.slice(7).trim(); section = null; continue }
    if (/^Points:\s*$/.test(line)) { section = 'points'; continue }
    if (/^Narration:\s*$/.test(line)) { section = 'narration'; continue }
    if (/^Cues:\s*$/.test(line)) { section = 'cues'; continue }
    if (/^Labels:/.test(line)) { section = null; continue }
    if (line.startsWith('>')) { narration.push(line.slice(1).replace(TAG, '').trim()); continue }
    if (line.startsWith('- ') && section === 'points') points.push(line.slice(2).trim())
    else if (line.startsWith('- ') && section === 'cues') cues.push(line.slice(2).trim())
    else if (line !== '') section = null
  }
  return { slot, theme, status, points, cues, narration: narration.filter(Boolean) }
}

export const SCENES = headings.map((heading, index) => {
  const id = heading[1]
  const fail = message => { throw new Error(`Scene S${id}: ${message}`) }
  const body = text.slice(heading.index, headings[index + 1]?.index ?? text.length)
  const { slot, theme, status, points, cues, narration } = parseBody(body)
  if (!slot || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)) fail('missing or malformed "Slot: mm:ss-mm:ss"')
  if (narration.length === 0) fail('no "> " narration lines')
  if (points.length !== cues.length)
    fail(`${points.length} points but ${cues.length} cues — one cue per point, in order`)
  const [start, end] = slot.split('-')
  return {
    id: `s${id}`,
    chapter: heading[2],
    title: heading[2],
    slotSeconds: seconds(end) - seconds(start),           // provisional; measured speech wins
    programStart: seconds(start),
    // theme flips and status strips are EDITORIAL decisions written in the
    // screenplay (Theme:/Status: per scene), never constants
    theme: theme === 'dark' ? 'dark' : 'light',
    pending: [],                                           // agreed missing captures only, e.g. ['R02']
    status: status || 'RECORDED EXCERPTS - owner-confirmed narrative',
    vo: spoken(narration.join(' ')),
    points: points.map((point, i) => ({ text: point, cue: spoken(cues[i]) }))
  }
})

// The master length is the screenplay's final Slot end — the length the
// owner chose in BRIEF.md, not a hardcoded number. (The reference reel's
// master was exactly 900 s; yours is whatever your slots say.)
const lastScene = SCENES[SCENES.length - 1]

export const FILM = {
  id: '<kebab-id>-first-cut',            // new id per cut; never overwrite a render
  title: '<Reel title> | First cut',
  width: 1920,
  height: 1080,
  fps: 30,
  voice: 'en-US-AndrewMultilingualNeural',
  rate: '-12%',                           // evidence-reel pace (architecture reel uses +2%)
  transitionSeconds: 13 / 30,
  minimumDurationSeconds: lastScene.programStart + lastScene.slotSeconds,
  sourceStatus: 'DRAFT 01 - <N> supplied recordings; owner-confirmed <idea> and <N> engineers'
}
