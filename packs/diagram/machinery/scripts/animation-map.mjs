import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { PROJECT, REPORTS_DIR, ensureDirs } from './lib/project.mjs'

ensureDirs()
const roots = [
  process.env.HYPERFRAMES_ANIMATION_SKILL,
  resolve(process.env.CODEX_HOME ?? resolve(homedir(), '.codex'), 'skills/hyperframes-animation'),
  resolve(homedir(), '.agents/skills/hyperframes-animation')
].filter(Boolean)
const skillRoot = roots.find(root =>
  existsSync(resolve(root, 'scripts/animation-map.mjs'))
)
if (!skillRoot) {
  throw new Error(
    'hyperframes-animation is not installed. Install the pinned skills listed in HYPERFRAMES_SKILLS.lock.json.'
  )
}

const output = resolve(REPORTS_DIR, 'animation-map')
mkdirSync(output, { recursive: true })
const script = resolve(skillRoot, 'scripts/animation-map.mjs')
const result = spawnSync(process.execPath, [script, PROJECT, '--out', output], {
  cwd: PROJECT,
  env: {
    ...process.env,
    HYPERFRAMES_NO_TELEMETRY: '1',
    HYPERFRAMES_SKILL_PKG_VERSION: '0.8.62'
  },
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024
})
writeFileSync(
  resolve(REPORTS_DIR, 'animation-map.txt'),
  `${result.stdout ?? ''}\n${result.stderr ?? ''}`
)
process.stdout.write(result.stdout ?? '')
process.stderr.write(result.stderr ?? '')
if (result.status !== 0) throw new Error('Animation-map audit failed')
