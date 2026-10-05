import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  PROJECT,
  REPORTS_DIR,
  compositionFingerprint,
  ensureDirs,
  run,
  writeJson
} from './lib/project.mjs'
import { buildTimeline, reviewTimes } from './lib/timeline.mjs'
import { runHyperframes } from './hf.mjs'

ensureDirs()

const build = run(process.execPath, ['scripts/build.mjs'])
if (build.status !== 0)
  throw new Error(`composition build failed:\n${build.stderr || build.stdout}`)
process.stdout.write(build.stdout)

const timeline = buildTimeline()
const times = reviewTimes(timeline)
const command = [
  'check',
  '--json',
  '--snapshots',
  '--at',
  times.join(','),
  '--at-transitions',
  '--max-transition-samples',
  '30',
  '--caption-zone',
  'x0=0;y0=.84;x1=1;y1=1;severity=error;seek=.25,1',
  '--frame-check',
  '--timeout',
  '30000'
]
const result = runHyperframes(command, {
  capture: true,
  env: {
    HYPERFRAMES_RUN_ID: `reel-kit-${compositionFingerprint().slice(0, 16)}`
  }
})
writeFileSync(
  resolve(REPORTS_DIR, 'hyperframes-check.txt'),
  `${result.stdout}\n${result.stderr}`
)

let hyperframes = null
try {
  hyperframes = JSON.parse(result.stdout)
} catch {
  // Keep the raw log even when an older CLI prints a non-JSON preamble.
}

const report = {
  checkedAt: new Date().toISOString(),
  command: `HYPERFRAMES_NO_TELEMETRY=1 hyperframes ${command.join(' ')}`,
  fingerprint: compositionFingerprint(),
  timelineDuration: timeline.duration,
  narrationComplete: timeline.narrationComplete,
  reviewTimes: times,
  exitStatus: result.status,
  ok: result.status === 0 && hyperframes?.ok !== false,
  hyperframes
}
writeJson(resolve(REPORTS_DIR, 'check.json'), report)
process.stdout.write(result.stdout)
process.stderr.write(result.stderr)
if (!report.ok) {
  throw new Error(
    'Hyperframes check failed. See reports/hyperframes-check.txt and reports/check.json.'
  )
}
console.log(`Composition check passed · ${times.length} explicit review times`)
