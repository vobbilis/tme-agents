// story.mjs — the explainer's spec. SCRIPT.md is the narration source; this
// file pairs each section with its act label, headline, four state captions
// and three word-timed cues, and declares the inputs/films to preserve.
// Copy over machinery/story.mjs and fill in every <...>.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RATE, VOICE } from './lib/narrator.mjs'

export { RATE, VOICE }
export const DIR = dirname(fileURLToPath(import.meta.url))      // production/
export const REEL = resolve(DIR, '..')                           // <reel>/
export const OUT = resolve(DIR, 'out')
export const NAME = '<org>-<subject>-story'                      // output basename
export const TITLE = '<Reel title>'
export const SIZE = { width: 1920, height: 1080 }
export const FPS = 30
export const VERSION = '<subject>-story-cut-1'                   // bump per delivered cut
export const VOICE_OFFSET = 0.4                                  // seconds before voice in each chapter
export const MIN_DURATION = 300                                  // from BRIEF.md
export const MAX_DURATION = 360
export const DISSOLVE_FRAMES = 10

// Accepts both heading styles: `## 1. Title` and the canonical
// /cmo:screenplay `## S01. Title`. Claim tags ([src:…]/[CHECK]) are
// stripped from vo — they must never be spoken.
export function parseScript(text) {
  return text.split(/^## /m).filter(part => /^S?\d+\. /.test(part)).map(part => ({
    title: part.split('\n')[0].replace(/^S?\d+\. /, ''),
    vo: part.split('\n').filter(line => line.startsWith('>'))
      .map(line => line.slice(1).replace(/\s*\[(?:src:[^\]]+|CHECK)\]\s*$/, '').trim())
      .filter(Boolean).join(' ')
  }))
}

const narrative = parseScript(readFileSync(resolve(REEL, 'SCRIPT.md'), 'utf8'))

// One entry per SCRIPT.md section, in order. `cues` are 3–7 word phrases copied
// exactly from that section's blockquotes; each must occur once, in order.
// `captions[0]` describes state 0; captions[1..3] describe what cues 1..3 add.
// `theme` flips only where the argument turns. The last chapter carries
// `animation: '<name>'` and is rendered by closing-motion.mjs.
const spec = [
  { id: '01-<slug>', act: '<Act label>', theme: 'dark',
    headline: ['<Line one>', '<Line two, in green>.'],
    captions: ['<state 0>', '<state 1>', '<state 2>', '<state 3>'],
    cues: ['<cue 1>', '<cue 2>', '<cue 3>'] },
  { id: '02-<slug>', act: '<Act label>', theme: 'light',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '03-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '04-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '05-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '06-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '07-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '08-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '09-<slug>', act: '<Act label>', theme: '<dark|light>',
    headline: ['<Line one>', '<Line two>.'],
    captions: ['<…>', '<…>', '<…>', '<…>'],
    cues: ['<…>', '<…>', '<…>'] },
  { id: '10-<slug>', act: '<Payoff>', theme: 'dark', animation: '<motion-name>',
    headline: ['<Title line one>', '<Title line two>.'],
    captions: ['<start pose>', '<motion 1>', '<motion 2>', '<payoff>'],
    cues: ['<cue starting motion 1>', '<cue starting motion 2>', '<cue starting the payoff>'] }
]

if (narrative.length !== spec.length) throw new Error(`Script must have exactly ${spec.length} sections`)
export const SCENES = spec.map((scene, index) => ({
  ...scene, ...narrative[index], index,
  tail: index === spec.length - 1 ? 1.2 : 0.65,
  words: narrative[index].vo.split(/\s+/).length
}))
export const WORD_COUNT = SCENES.reduce((sum, scene) => sum + scene.words, 0)

// Inputs are hashed into out/source-receipt.json before production and
// checked by every script. They are never copied into a public artifact.
export const SOURCES = [
  { id: 'owner-memo', path: resolve(REEL, '<memo>.m4a') },
  { id: 'operating-model', path: '<absolute path to the supplied document>' }
]
// Prior films this reel must leave byte-for-byte unchanged.
export const PRESERVED = [
  { id: '<prior-film-id>', path: '<absolute path to prior MP4>' }
]
