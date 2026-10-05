// Verify the encoded delivery artifact. A full watch-and-listen review remains
// a separate editorial gate.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { FILM, SCENES } from '../scenes.mjs'
import {
  PROJECT,
  REPORTS_DIR,
  compositionFingerprint,
  durationOf,
  ensureDirs,
  ffmpeg,
  formatBytes,
  projectRelative,
  readJson,
  sha256File,
  writeJson
} from './lib/project.mjs'
import {
  canonicalTokens,
  displayCaption,
  parseCaptions
} from './lib/speech.mjs'
import { buildTimeline } from './lib/timeline.mjs'

ensureDirs()
const args = process.argv.slice(2)
const valueAfter = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null
const output = resolve(
  PROJECT,
  valueAfter('--input') ?? `renders/${FILM.id}.mp4`
)
const timeline = buildTimeline()
const finish = readJson(resolve(REPORTS_DIR, 'finish.json'))
const checkReport = readJson(resolve(REPORTS_DIR, 'check.json'))
const renderReport = readJson(resolve(REPORTS_DIR, 'render-performance.json'))
const sourceSubtitles = resolve(REPORTS_DIR, `${FILM.id}.srt`)
const captureReceipt = readJson(
  resolve(PROJECT, 'assets/reference/private-integrations.receipt.json')
)

const checks = []
const evidence = {}
const check = (name, passed, detail) => {
  const item = { name, passed: Boolean(passed), detail }
  checks.push(item)
  console.log(
    `${item.passed ? 'PASS' : 'FAIL'} ${name}` +
    `${detail === undefined ? '' : ` · ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`}`
  )
}
const run = (command, binary = false) => spawnSync(ffmpeg(), command, {
  cwd: PROJECT,
  encoding: binary ? undefined : 'utf8',
  maxBuffer: 128 * 1024 * 1024
})

const duration = durationOf(output)
check('duration is at least ten minutes', duration >= FILM.minimumDurationSeconds, duration)
check(
  'encoded duration matches the composition',
  Math.abs(duration - timeline.duration) <= 0.15,
  { encoded: duration, timeline: timeline.duration }
)
check(
  'finishing receipt matches the delivery bytes',
  finish.outputSha256 === sha256File(output) && finish.output === projectRelative(output)
)
check(
  'passing composition check matches the current source',
  checkReport.ok && checkReport.fingerprint === compositionFingerprint()
)
check(
  'base render and finishing receipts form one chain',
  finish.inputSha256 === renderReport.sha256 &&
    finish.input === renderReport.output
)
check(`all ${SCENES.length} chapters are present in the story`, SCENES.length === SCENES.map(scene => scene.id).filter((id, index, ids) => ids.indexOf(id) === index).length)
check(
  'reference capture remains pinned and fabricated',
  captureReceipt.fabricatedData === true &&
    captureReceipt.lessonOverlayAbsent === true &&
    captureReceipt.sha256 === sha256File(
      resolve(PROJECT, 'assets/reference/private-integrations.png')
    ),
  captureReceipt.sourceCommit
)
check(
  'Control Plane context is absent from audience-facing narration',
  SCENES.every(scene => !/control plane/i.test(scene.vo))
)

const info = run(['-hide_banner', '-i', output, '-f', 'ffmetadata', '-'])
const streamText = info.stderr
const videoStream = streamText.split(/\r?\n/).find(line => /Stream.*Video:/.test(line)) ?? ''
const audioStream = streamText.split(/\r?\n/).find(line => /Stream.*Audio:/.test(line)) ?? ''
const subtitleStream = streamText.split(/\r?\n/).find(line => /Stream.*Subtitle:/.test(line)) ?? ''
check(
  'H.264 1920×1080 at 30 fps',
  /Video: h264/.test(videoStream) &&
    /1920x1080/.test(videoStream) &&
    /30 fps/.test(videoStream),
  videoStream.trim()
)
check(
  'AAC stereo at 48 kHz',
  /Audio: aac/.test(audioStream) &&
    /48000 Hz, stereo/.test(audioStream),
  audioStream.trim()
)
check(
  'selectable English captions',
  /Subtitle: mov_text/.test(subtitleStream) &&
    /\(eng\)/.test(subtitleStream),
  subtitleStream.trim()
)

const chapterBlocks = info.stdout.split('[CHAPTER]').slice(1).map(block => {
  const fields = Object.fromEntries(
    block.trim().split(/\r?\n/).filter(line => line.includes('=')).map(line => {
      const split = line.indexOf('=')
      return [line.slice(0, split), line.slice(split + 1)]
    })
  )
  const [numerator, denominator] = String(fields.TIMEBASE).split('/').map(Number)
  return {
    title: fields.title,
    start: Number(fields.START) * numerator / denominator,
    end: Number(fields.END) * numerator / denominator
  }
})
check(
  `chapter count and names match the ${SCENES.length} scenes`,
  chapterBlocks.length === timeline.scenes.length &&
    chapterBlocks.every((chapter, index) =>
      chapter.title === timeline.scenes[index].chapter
    ),
  chapterBlocks.length
)
check(
  'chapter boundaries are contiguous',
  chapterBlocks.length > 0 && chapterBlocks.every((chapter, index) =>
    chapter.end > chapter.start &&
    Math.abs(chapter.start - timeline.scenes[index].start) < 0.01 &&
    Math.abs(chapter.end - (chapterBlocks[index + 1]?.start ?? duration)) < 0.15
  )
)
evidence.chapters = chapterBlocks

console.log('Decoding the complete video and audio…')
const decode = run([
  '-v',
  'error',
  '-xerror',
  '-i',
  output,
  '-map',
  '0:v:0',
  '-map',
  '0:a:0',
  '-f',
  'null',
  '-'
])
check(
  'complete video and audio decode',
  decode.status === 0 && !decode.stderr.trim(),
  decode.stderr.trim()
)

const extracted = run([
  '-v',
  'error',
  '-i',
  output,
  '-map',
  '0:s:0',
  '-f',
  'srt',
  '-'
])
check('embedded captions decode', extracted.status === 0, extracted.stderr.trim())
const captions = parseCaptions(extracted.stdout)
const sourceCaptions = parseCaptions(readFileSync(sourceSubtitles, 'utf8'))
check(
  'caption timing is ordered and bounded',
  captions.length > 0 && captions.every((caption, index) =>
    caption.start >= (captions[index - 1]?.end ?? 0) - 0.001 &&
    caption.end > caption.start &&
    caption.end <= duration + 0.01
  )
)
check(
  'captions use at most two 42-character lines',
  captions.every(caption => {
    const lines = caption.text.split('\n')
    return lines.length <= 2 && lines.every(line => line.length <= 42)
  })
)
const extractedTokens = canonicalTokens(captions.map(caption => caption.text).join(' '))
const sourceTokens = canonicalTokens(sourceCaptions.map(caption => caption.text).join(' '))
const scriptTokens = canonicalTokens(
  SCENES.map(scene => displayCaption(scene.vo)).join(' ')
)
check(
  'embedded captions match the generated subtitle track',
  extractedTokens.join(' ') === sourceTokens.join(' '),
  { embedded: captions.length, source: sourceCaptions.length }
)
check(
  'captions cover the complete narration',
  sourceTokens.join(' ') === scriptTokens.join(' '),
  { captions: sourceTokens.length, script: scriptTokens.length }
)

console.log('Measuring loudness, peaks, and silence…')
const audio = run([
  '-hide_banner',
  '-nostats',
  '-i',
  output,
  '-map',
  '0:a:0',
  '-af',
  'silencedetect=noise=-45dB:d=4,loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json',
  '-f',
  'null',
  '-'
])
const loudnessText = audio.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]
const loudness = loudnessText ? JSON.parse(loudnessText) : null
check('audio analysis completes', audio.status === 0 && Boolean(loudness))
if (loudness) {
  check(
    'integrated loudness is within 0.6 LU of -16 LUFS',
    Math.abs(Number(loudness.input_i) + 16) <= 0.6,
    Number(loudness.input_i)
  )
  check(
    'true peak is at or below -1.5 dBTP',
    Number(loudness.input_tp) <= -1.5,
    Number(loudness.input_tp)
  )
  check('no digital clipping', Number(loudness.input_tp) < 0)
}
const silenceStarts = [...audio.stderr.matchAll(/silence_start:\s*([\d.]+)/g)]
  .map(match => Number(match[1]))
const silences = [...audio.stderr.matchAll(
  /silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g
)].map((match, index) => ({
  start: silenceStarts[index],
  end: Number(match[1]),
  duration: Number(match[2])
}))
const expectedGaps = timeline.scenes.map((scene, index) => ({
  start: scene.audioStart + scene.voiceDuration,
  end: timeline.scenes[index + 1]?.audioStart ?? duration
}))
const unexplainedSilences = silences.filter(silence =>
  !expectedGaps.some(gap =>
    silence.start >= gap.start - 1 &&
    silence.end <= gap.end + 1 &&
    silence.duration <= gap.end - gap.start + 1.5
  )
)
check(
  'no unexplained silence longer than four seconds',
  silenceStarts.length === silences.length && unexplainedSilences.length === 0,
  { silences, unexplainedSilences }
)
evidence.audio = { loudness, silences, expectedGaps }

const midpointDir = resolve(REPORTS_DIR, 'encoded-frames')
const transitionDir = resolve(REPORTS_DIR, 'encoded-transitions')
const sheetDir = resolve(REPORTS_DIR, 'contact-sheet')
for (const dir of [midpointDir, transitionDir, sheetDir])
  mkdirSync(dir, { recursive: true })

for (const scene of timeline.scenes) {
  const frame = resolve(
    midpointDir,
    `${String(scene.index).padStart(2, '0')}-${scene.id}.png`
  )
  const result = run([
    '-y',
    '-v',
    'error',
    '-ss',
    scene.midpoint.toFixed(3),
    '-i',
    output,
    '-frames:v',
    '1',
    '-update',
    '1',
    frame
  ])
  check(`encoded midpoint ${scene.id}`, result.status === 0)
}
for (const [index, transition] of timeline.transitions.entries()) {
  for (const [label, offset] of [['before', -0.08], ['middle', 0.22]]) {
    const frame = resolve(
      transitionDir,
      `${String(index + 1).padStart(2, '0')}-${label}.png`
    )
    const result = run([
      '-y',
      '-v',
      'error',
      '-ss',
      Math.max(0, transition.start + offset).toFixed(3),
      '-i',
      output,
      '-frames:v',
      '1',
      '-update',
      '1',
      frame
    ])
    check(`encoded transition ${transition.from} → ${transition.to} ${label}`, result.status === 0)
  }
}

const makeSheet = (pattern, tile, outputPath) => run([
  '-y',
  '-v',
  'error',
  '-framerate',
  '1',
  '-pattern_type',
  'glob',
  '-i',
  pattern,
  '-vf',
  `scale=480:270,tile=${tile}`,
  '-frames:v',
  '1',
  '-update',
  '1',
  outputPath
])
const midpointSheet = resolve(sheetDir, 'midpoints.png')
const transitionSheet = resolve(sheetDir, 'transitions.png')
check(
  'midpoint contact sheet',
  makeSheet(resolve(midpointDir, '*.png'), '4x3', midpointSheet).status === 0
)
check(
  'transition contact sheet',
  makeSheet(resolve(transitionDir, '*.png'), '4x6', transitionSheet).status === 0
)

const result = {
  verifiedAt: new Date().toISOString(),
  output: projectRelative(output),
  sha256: sha256File(output),
  bytes: statSync(output).size,
  duration,
  sourceFingerprint: compositionFingerprint(),
  technicalPass: checks.every(item => item.passed),
  checks,
  evidence,
  contactSheets: {
    midpoints: projectRelative(midpointSheet),
    transitions: projectRelative(transitionSheet)
  },
  renderPerformance: renderReport,
  editorialReview: {
    status: 'required',
    requirement:
      'Watch the complete delivery MP4 with sound and selectable captions. Check story, pronunciation, pacing, visual fatigue, transitions, and whether each evidence shot supports the intended point.',
    limitation:
      'Automated checks, extracted frames, and contact-sheet inspection do not constitute full audiovisual approval.'
  }
}
writeJson(resolve(REPORTS_DIR, 'verification.json'), result)
writeFileSync(
  resolve(PROJECT, 'VALIDATION_REPORT.md'),
  `# Long-form validation report

Technical validation: **${result.technicalPass ? 'passed' : 'failed'}**

- Delivery: \`${result.output}\`
- Duration: **${(duration / 60).toFixed(2)} minutes** (${duration.toFixed(2)} seconds)
- Size: **${formatBytes(result.bytes)}**
- SHA-256: \`${result.sha256}\`
- Hyperframes render wall time: **${renderReport.wallSeconds.toFixed(1)} seconds**
- Effective render speed: **${renderReport.framesPerSecond.toFixed(2)} frames/second**
- Checks passed: **${checks.filter(item => item.passed).length}/${checks.length}**
- Midpoint sheet: \`${result.contactSheets.midpoints}\`
- Transition sheet: \`${result.contactSheets.transitions}\`

The delivery has H.264 1080p30 picture, AAC stereo audio at 48 kHz,
selectable English captions, contiguous chapters, complete decode, and the
recorded audio checks above. See the ignored
\`reports/verification.json\` for the machine-readable receipt.

## Editorial status

**A complete watch-and-listen review is still required.** Technical checks and
contact sheets do not approve pronunciation, pacing, transitions in motion, or
whether the story lands. Record the reviewer, artifact hash, and time-specific
findings in \`PRODUCTION_HANDOVER.md\` before external use.
`
)
if (!result.technicalPass) process.exitCode = 1
console.log(
  `Technical verification ${result.technicalPass ? 'passed' : 'has failures'}; ` +
  'full audiovisual review remains separate.'
)
