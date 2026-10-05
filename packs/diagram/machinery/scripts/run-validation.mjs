import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import {
  PROJECT,
  REPORTS_DIR,
  ensureDirs,
  writeJson
} from './lib/project.mjs'

ensureDirs()
const args = process.argv.slice(2)
const renderApproved = args.includes('--render-approved')
const skipNarration = args.includes('--skip-narration')
const results = []

function execute(name, command, commandArgs) {
  console.log(`\n=== ${name} ===`)
  const started = Date.now()
  const result = spawnSync(command, commandArgs, {
    cwd: PROJECT,
    env: {
      ...process.env,
      HYPERFRAMES_NO_TELEMETRY: '1'
    },
    stdio: 'inherit'
  })
  const item = {
    name,
    command: [command, ...commandArgs].join(' '),
    status: result.status,
    wallSeconds: (Date.now() - started) / 1000
  }
  results.push(item)
  writeJson(resolve(REPORTS_DIR, 'validation-run.json'), {
    updatedAt: new Date().toISOString(),
    renderApproved,
    complete: false,
    results
  })
  if (result.status !== 0)
    throw new Error(`${name} failed with status ${result.status}`)
}

execute('Environment doctor', process.execPath, ['scripts/doctor.mjs'])
execute('Toolkit tests', process.execPath, ['--test', 'tests/*.test.mjs'])
execute('Story projection', process.execPath, ['scripts/build.mjs', '--story-only'])
if (!skipNarration)
  execute('Pinned Andrew narration', process.execPath, ['scripts/narrate.mjs'])
execute('Composition build', process.execPath, ['scripts/build.mjs'])
execute('Hyperframes check', process.execPath, ['scripts/check.mjs'])
execute('Animation map', process.execPath, ['scripts/animation-map.mjs'])
execute('Review snapshots', process.execPath, ['scripts/snapshot.mjs'])

if (renderApproved) {
  execute('Base render', process.execPath, ['scripts/render.mjs', '--approved'])
  execute('Delivery finishing', process.execPath, ['scripts/finish.mjs'])
  execute('Encoded-media verification', process.execPath, ['scripts/verify.mjs'])
} else {
  execute(
    'Studio preview',
    process.execPath,
    ['scripts/hf.mjs', 'preview', '--background', '--port', '3017']
  )
}

writeJson(resolve(REPORTS_DIR, 'validation-run.json'), {
  completedAt: new Date().toISOString(),
  renderApproved,
  complete: true,
  results
})
console.log(
  renderApproved
    ? '\nLong-form validation and encoded-media checks completed.'
    : '\nChecks completed. Review Studio at http://localhost:3017/#project/hyperframes-reel-kit before rendering.'
)
