import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RATE, VOICE } from './lib/narrator.mjs'

export { RATE, VOICE }
export const DIR = dirname(fileURLToPath(import.meta.url))
export const REPO = resolve(DIR, '../..')
export const OUT = resolve(DIR, 'out')
export const NAME = 'hpe-opsramp-ai-first-security-story'
export const TITLE = "OpsRamp's Shift-left SecOps"
export const SIZE = { width: 1920, height: 1080 }
export const FPS = 30
export const VERSION = 'secops-story-cut-5'
export const VOICE_OFFSET = 0.4
export const MIN_DURATION = 300
export const MAX_DURATION = 360
export const DISSOLVE_FRAMES = 10

export function parseScript(text) {
  return text.split(/^## /m).filter(part => /^\d+\. /.test(part)).map(part => ({
    title: part.split('\n')[0].replace(/^\d+\. /, ''),
    vo: part.split('\n').filter(line => line.startsWith('>'))
      .map(line => line.slice(1).trim()).filter(Boolean).join(' ')
  }))
}

const narrative = parseScript(readFileSync(resolve(DIR, 'SCRIPT.md'), 'utf8'))
const spec = [
  { id: '01-question', act: 'Security moves upstream', theme: 'dark',
    headline: ["OpsRamp's", 'Shift-left SecOps.'],
    captions: ['Pull security operations upstream', 'Move checks from release into design', 'The regular AI-First SDLC, adapted', 'Scan, fix, and verify inside development'],
    cues: ['In a traditional workflow', 'We bring that feedback into the work itself', 'Vulnerability scanning, fixing, and verification'] },
  { id: '02-handoff', act: 'The cost of the handoff', theme: 'light',
    headline: ['Good work.', 'Too much distance.'],
    captions: ['A familiar sequence', 'The handoffs continue', 'Context has to travel back', 'The process delays learning'],
    cues: ['raises tickets', 'The difficulty is the distance', 'The problem is not a lack of effort'] },
  { id: '03-development-loop', act: 'The regular AI-First SDLC', theme: 'dark',
    headline: ['The familiar workflow.', 'Customized for security.'],
    captions: ['Context, plan, implement, review, test', 'Specialize the loop for vulnerabilities', 'Scanning and fixes in the regular pipeline', 'Human ownership stays in the loop'],
    cues: ['Customize it for security', 'Develop the change and its security checks together', 'Human ownership stays in that loop'] },
  { id: '04-context', act: 'Grounded in the product', theme: 'light',
    headline: ['Product context', 'changes the question.'],
    captions: ['A generic harness is a starting point', 'A hypothetical permissions question', 'Context and threat model ground analysis', 'A reviewable question linked to assumptions'],
    cues: ['Imagine a simple permissions question', 'Product knowledge, architecture, and design intent', 'Grounded analysis turns'] },
  { id: '05-sandbox', act: 'An authorized running sandbox', theme: 'dark',
    headline: ['A place to investigate.', 'A boundary to respect.'],
    captions: ['A controlled running environment', 'Exercise the hypothetical read-only scenario', 'Capture role, action, state, and observation', 'A reviewable record for reproducibility'],
    cues: ['Within that authorized environment', 'Capture the role', 'The outcome is a reviewable record'] },
  { id: '06-evidence', act: 'Distinct roles. Reviewable evidence.', theme: 'dark',
    headline: ['Different responsibilities.', 'One evidence trail.'],
    captions: ['Exercise and observe', 'An agent challenges and reproduces', 'Correlate, deduplicate, prioritize by risk', 'Evidence for Security review'],
    cues: ['A separate agent challenges', 'Analysis can then correlate', 'The summary connects'] },
  { id: '07-verification', act: 'Fix, verify, preserve behavior', theme: 'light',
    headline: ['Fix the concern.', 'Preserve the behavior.'],
    captions: ['Give engineering actionable context', 'Engineering owns the change', 'Two verification questions', 'Keep scoped evidence with the finding'],
    cues: ['Engineering remains responsible for the change', 'Then verification asks two questions', 'Keep both results with the finding'] },
  { id: '08-governance', act: 'Clear authority', theme: 'dark',
    headline: ['Earlier feedback.', 'Clear authority.'],
    captions: ['The operating principle', 'Self-service, within governance', 'Security retains risk authority', 'Human attention where judgment matters'],
    cues: ['Developer self-service', 'Critical vulnerabilities', 'The goal is to focus human attention'] },
  { id: '09-progress', act: 'Progress, area by area', theme: 'light',
    headline: ['Coverage is earned,', 'area by area.'],
    captions: ['Capability in progress', 'Each area needs its own context', 'Learn from findings and human review', 'Intended outcomes to measure as the work matures'],
    cues: ['Each area brings its own', 'Findings and human review', 'Earlier feedback, less manual triage'] },
  { id: '10-shift-left', act: 'Security. Built in.', theme: 'dark', animation: 'shift-left',
    headline: ["OpsRamp's", 'Shift-left SecOps.'],
    captions: ['Shift-left SecOps', 'Shift security left', 'Build it in', 'Security. Built in.'],
    cues: ['Shift security left', 'and build it into', 'the way you develop'] }
]

if (narrative.length !== spec.length) throw new Error('Script must have exactly ten sections')
export const SCENES = spec.map((scene, index) => ({
  ...scene, ...narrative[index], index, tail: index === 9 ? 1.2 : 0.65,
  words: narrative[index].vo.split(/\s+/).length
}))
export const WORD_COUNT = SCENES.reduce((sum, scene) => sum + scene.words, 0)

// Inputs are frozen in the receipt, not copied into a new public artifact.
export const SOURCES = [
  { id: 'owner-memo', path: resolve(DIR, '../Rue Mirassou 9.m4a') },
  { id: 'operating-model', path: '/Users/vobbilis/Downloads/SecOps_AI_First_Operating_Model.html' }
]
export const PRESERVED = [
  { id: 'engineering-integrated', path: resolve(REPO, 'demo/ai-first-sdlc-reel/out/organization-integrated-cut/hpe-opsramp-digital-twin-integrated-cut.mp4') },
  { id: 'gtm-continuation', path: resolve(REPO, 'demo/learn-reel/gtm/out/hpe-opsramp-digital-twin-gtm-reel.mp4') },
  { id: 'technical-intro-v2', path: resolve(REPO, 'demo/ai-first-sdlc-reel/out/technical-intro-preview-v2/hpe-opsramp-digital-twin-technical-intro.mp4') }
]
