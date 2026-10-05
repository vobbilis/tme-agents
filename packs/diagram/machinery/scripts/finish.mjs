import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { FILM } from '../scenes.mjs'
import {
  PROJECT,
  REPORTS_DIR,
  RENDERS_DIR,
  durationOf,
  ensureDirs,
  ffmpeg,
  formatBytes,
  projectRelative,
  sha256File,
  writeJson
} from './lib/project.mjs'
import { buildTimeline } from './lib/timeline.mjs'

ensureDirs()
const args = process.argv.slice(2)
const valueAfter = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null
const base = resolve(
  PROJECT,
  valueAfter('--input') ?? `renders/${FILM.id}-base.mp4`
)
const output = resolve(
  PROJECT,
  valueAfter('--output') ?? `renders/${FILM.id}.mp4`
)
const subtitles = resolve(REPORTS_DIR, `${FILM.id}.srt`)
const metadata = resolve(REPORTS_DIR, 'chapters.ffmetadata')
for (const path of [base, subtitles, metadata]) {
  if (String(path).includes('out/review')) throw new Error('Review drafts are never shipped — finish takes the approved base render from renders/. Approve via /cmo:review, render with --approved, then finish.')
  if (!existsSync(path)) throw new Error(`Missing finishing input: ${projectRelative(path)}`)
}

const timeline = buildTimeline()
if (!timeline.narrationComplete) throw new Error('Cannot finish without complete narration')

const run = command => spawnSync(ffmpeg(), command, {
  cwd: PROJECT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024
})

const analysis = run([
  '-hide_banner',
  '-nostats',
  '-i',
  base,
  '-map',
  '0:a:0',
  '-af',
  'loudnorm=I=-16:TP=-1.8:LRA=7:print_format=json',
  '-f',
  'null',
  '-'
])
const json = analysis.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]
if (analysis.status !== 0 || !json)
  throw new Error(`Unable to measure base audio:\n${analysis.stderr}`)
const measured = JSON.parse(json)
const loudnorm = [
  'loudnorm=I=-16:TP=-1.8:LRA=7',
  `measured_I=${measured.input_i}`,
  `measured_TP=${measured.input_tp}`,
  `measured_LRA=${measured.input_lra}`,
  `measured_thresh=${measured.input_thresh}`,
  `offset=${measured.target_offset}`,
  'linear=true',
  'print_format=summary'
].join(':')

const command = [
  '-y',
  '-hide_banner',
  '-loglevel',
  'warning',
  '-i',
  base,
  '-i',
  subtitles,
  '-i',
  metadata,
  '-map',
  '0:v:0',
  '-map',
  '0:a:0',
  '-map',
  '1:0',
  '-map_metadata',
  '2',
  '-map_chapters',
  '2',
  '-metadata',
  `title=${FILM.title}`,
  '-metadata',
  `comment=${FILM.sourceStatus}. Neural narration. Reference product data is fabricated.`,
  '-metadata:s:s:0',
  'language=eng',
  '-metadata:s:s:0',
  'title=English',
  '-c:v',
  'copy',
  '-af',
  `${loudnorm},aresample=48000,aformat=channel_layouts=stereo`,
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-c:s',
  'mov_text',
  '-movflags',
  '+faststart',
  '-t',
  timeline.duration.toFixed(6),
  output
]
const started = Date.now()
const result = run(command)
process.stdout.write(result.stdout)
process.stderr.write(result.stderr)
if (result.status !== 0 || !existsSync(output))
  throw new Error(`Finishing failed:\n${result.stderr}`)

const report = {
  finishedAt: new Date().toISOString(),
  input: projectRelative(base),
  inputSha256: sha256File(base),
  output: projectRelative(output),
  outputSha256: sha256File(output),
  bytes: statSync(output).size,
  duration: durationOf(output),
  timelineDuration: timeline.duration,
  captions: projectRelative(subtitles),
  chapters: projectRelative(metadata),
  audioTarget: {
    integratedLufs: -16,
    preEncodeTruePeakDbtp: -1.8,
    deliveryTruePeakMaximumDbtp: -1.5
  },
  firstPassLoudness: measured,
  wallSeconds: (Date.now() - started) / 1000
}
writeJson(resolve(REPORTS_DIR, 'finish.json'), report)
console.log(`Delivery MP4: ${report.output} · ${formatBytes(report.bytes)}`)
