import { mkdirSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

import { FILM } from '../scenes.mjs'
import {
  PROJECT,
  REPORTS_DIR,
  RENDERS_DIR,
  compositionFingerprint,
  durationOf,
  ensureDirs,
  formatBytes,
  freeDiskBytes,
  projectRelative,
  readJson,
  sha256File,
  writeJson
} from './lib/project.mjs'
import { buildTimeline } from './lib/timeline.mjs'
import { hyperframesBinary, hyperframesEnv } from './hf.mjs'

ensureDirs()
const args = process.argv.slice(2)
// --review-draft: a pre-approval WATCH COPY for /cmo:review when Studio
// audio fails. Green checks still required below; output is forced under
// out/review/ and finish refuses it — a draft can never ship.
const reviewDraft = args.includes('--review-draft')
if (!reviewDraft && !args.includes('--approved') && process.env.REEL_RENDER_APPROVED !== '1') {
  throw new Error(
    'Rendering requires final-preview approval. Re-run with --approved after that review, or render a watch copy with --review-draft.'
  )
}

const checkPath = resolve(REPORTS_DIR, 'check.json')
if (!existsSync(checkPath)) throw new Error('Run npm run check before rendering')
const check = readJson(checkPath)
const fingerprint = compositionFingerprint()
if (!check.ok || check.fingerprint !== fingerprint)
  throw new Error('The passing Hyperframes check does not match the current composition')

const timeline = buildTimeline()
if (!timeline.narrationComplete)
  throw new Error('Narration is incomplete. Run npm run narrate and npm run build.')
if (timeline.duration < FILM.minimumDurationSeconds)
  throw new Error(`The reel is only ${timeline.duration.toFixed(2)} seconds`)

const valueAfter = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null
const quality = valueAfter('--quality') ?? 'looks'
const workers = valueAfter('--workers') ?? process.env.REEL_RENDER_WORKERS ?? '4'
const output = resolve(
  PROJECT,
  reviewDraft
    ? `out/review/${FILM.id}-REVIEW-DRAFT.mp4`              // never a --output override
    : valueAfter('--output') ?? `renders/${FILM.id}-base.mp4`
)
if (reviewDraft) mkdirSync(resolve(PROJECT, 'out/review'), { recursive: true })
const command = [
  'render',
  '--output',
  projectRelative(output),
  '--quality',
  quality,
  '--fps',
  String(FILM.fps),
  '--workers',
  String(workers),
  '--strict'
]

const freeBefore = freeDiskBytes()
if (freeBefore < 20 * 1024 ** 3)
  throw new Error(`Insufficient disk headroom: ${formatBytes(freeBefore)} free`)

console.log(
  `Rendering ${timeline.duration.toFixed(2)}s at ${FILM.width}×${FILM.height}, ` +
  `${FILM.fps}fps · ${quality} · ${workers} workers`
)
const started = Date.now()
const child = spawn(hyperframesBinary(), command, {
  cwd: PROJECT,
  env: hyperframesEnv({
    HYPERFRAMES_RUN_ID: `reel-kit-render-${fingerprint.slice(0, 16)}`
  })
})
let stdout = ''
let stderr = ''
child.stdout.on('data', chunk => {
  stdout += chunk
  process.stdout.write(chunk)
})
child.stderr.on('data', chunk => {
  stderr += chunk
  process.stderr.write(chunk)
})
const status = await new Promise((done, reject) => {
  child.once('error', reject)
  child.once('close', done)
})
const wallSeconds = (Date.now() - started) / 1000
writeFileSync(
  resolve(REPORTS_DIR, 'hyperframes-render.txt'),
  `${stdout}\n${stderr}`
)
if (status !== 0 || !existsSync(output) || statSync(output).size === 0) {
  throw new Error(`Hyperframes render failed with status ${status}`)
}

const report = {
  renderedAt: new Date().toISOString(),
  command: `HYPERFRAMES_NO_TELEMETRY=1 hyperframes ${command.join(' ')}`,
  output: projectRelative(output),
  sha256: sha256File(output),
  bytes: statSync(output).size,
  encodedDuration: durationOf(output),
  timelineDuration: timeline.duration,
  frames: Math.round(timeline.duration * FILM.fps),
  quality,
  workers,
  wallSeconds,
  framesPerSecond: Math.round(timeline.duration * FILM.fps) / wallSeconds,
  freeDiskBefore: freeBefore,
  freeDiskAfter: freeDiskBytes(),
  summary: `${stdout}\n${stderr}`.split(/\r?\n/).filter(line =>
    /capture|gpu|compile|setup|encode|rendered/i.test(line)
  ).slice(-12)
}
writeJson(resolve(REPORTS_DIR, 'render-performance.json'), report)
console.log(
  `Base render ready: ${report.output} · ${formatBytes(report.bytes)} · ` +
  `${wallSeconds.toFixed(1)}s wall time`
)
