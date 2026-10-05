import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  REPORTS_DIR,
  ensureDirs,
  writeJson
} from './lib/project.mjs'
import { buildTimeline, reviewTimes } from './lib/timeline.mjs'
import { runHyperframes } from './hf.mjs'

ensureDirs()
const timeline = buildTimeline()
const times = reviewTimes(timeline)
const result = runHyperframes(
  ['snapshot', '--at', times.join(',')],
  { capture: true }
)
writeFileSync(
  resolve(REPORTS_DIR, 'snapshot.txt'),
  `${result.stdout}\n${result.stderr}`
)
writeJson(resolve(REPORTS_DIR, 'snapshot-times.json'), {
  createdAt: new Date().toISOString(),
  duration: timeline.duration,
  times
})
process.stdout.write(result.stdout)
process.stderr.write(result.stderr)
if (result.status !== 0) throw new Error('Hyperframes snapshot failed')
