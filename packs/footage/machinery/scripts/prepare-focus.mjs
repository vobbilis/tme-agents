import { mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson, writeJson, sha256File } from './lib/project.mjs'
import { cameraForBox } from './lib/shots.mjs'

const targets = {
  's01-0': 'AI.First Operating|Al.First Operating|Consistent principles|standardize how',
  's01-1': 'Deep SDLC observability|Agent observability|Closed.loop improvement|logged and timed',
  's01-2': 'Azure Local|Acceptance Criteria|AssignedMemory|Description',
  's02-0': 'Acceptance Criteria|Description|Azure Local|OPSEXT',
  's02-1': 'Acceptance Criteria|AssignedMemory|parentId|Azure Local',
  's02-2': 'Scope:|Standardize Flex|OpsRamp|description lists',
  's03-0': 'reference files|field.reference|available field|Which project|description be written',
  's03-1': 'Acceptance Criteria|capability to configure|criteria field|description|commitments',
  's03-2': 'OPSEXT.2404|Split STDVM|Acceptance Criteria|Description|Azure Local',
  's04-0': 'ticket SET|set up the session|SET command|feature.automation',
  's04-1': 'initialize the session state|state.json|Ticket set|Session initialized',
  's04-2': 'Deep SDLC observability|Agent observability|Closed.loop improvement|logged and timed',
  's04-3': 'Load Skills|load.*skill|feature analyse|Proceed|skills|Session initialized',
  's05-0': 'scope derives|No attachments|Confluence|gather resources|Step 2|context.md',
  's05-1': 'Strong prior art|mapping exists|STDAZURELOCAL|context.md',
  's05-2': 'Key conclusions|VM export|export|missing|context.md',
  's06-0': '15 requirements|Workspace subset|PRD|prd.md',
  's06-1': 'usage.file data contract|requirements are external|VM record|Workspace subset',
  's06-2': 'prd.md written|requirements|usage.file|PRD',
  's07-0': 'Three approaches|Mirror|additive|brainstorm.md',
  's07-1': 'real workspace delta|additive VM|AssignedMemory|POC',
  's07-2': 'parentId|parentType|risk|gateway|POC succeeded|Validated',
  's08-0': 'All 12 artifacts|Step 5G|verify|planning|artifact',
  's08-1': 'Author SQL|TODO|parentId|confirmation',
  's08-2': 'release folder|governance skill|msp.sql|AssignedMemory|SQL',
  's09-0': 'release folder|governance skill|msp.sql|AssignedMemory|SQL',
  's09-1': 'AssignedMemory|_State|Appending|SQL statement|msp.sql',
  's09-2': 'trace|requirements|T2|T4|deferred|plan.trace',
  's10-0': 'MySQL|Step 8|tests|simulation',
  's10-1': 'harness|test_azure|tests|testing.guide',
  's10-2': 'harness|tests|passed|Skipped|STATE',
  's11-0': 'validator|schema|exits 1|scope drift',
  's11-1': 'schema mismatch|tasks|items|validator',
  's11-2': 'plan.trace|Re.running the validator|correctly traced|scope.drift|Alpha review',
  's12-0': 'divergence|release|branch|commit|Remote is now',
  's12-1': 'release|frozen|September|Liquibase|changeset',
  's12-2': 'Liquibase|changeset|September|2026.09|release|listing',
  's13-0': 'push|permission|denied|commit|access',
  's13-1': 'push|permission|denied|commit|access',
  's13-2': 'implementation summary|commit is preserved|Code Review',
  's14-0': 'trace|requirements|T2|T4|deferred|plan.trace',
  's14-1': 'harness|tests|passed|Skipped|STATE',
  's14-2': 'implementation summary|local.*commit|Code Review',
  's15-0': 'Consistent principles|common set|principles are the model|State . coordination|Explicit.*handoffs|Human checkpoints',
  's15-1': 'principles are the model|common set|Each invariant|State . coordination|Human checkpoints',
  's15-2': 'Human checkpoints|Traceability|Closed.loop improvement|Agent observability|Deep SDLC'
}
const run = (binary, args) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', maxBuffer: 64 * 1024 ** 2 })
  if (result.status !== 0) throw new Error(`${binary}: ${result.stderr}`)
  return result.stdout
}
const focus = {}
for (const shot of readJson('reports/footage.json').shots) {
  const directory = resolve('reports/focus-tracking', shot.id)
  mkdirSync(directory, { recursive: true })
  for (const name of readdirSync(directory).filter(name => /^\d{5}\.jpg$/.test(name))) unlinkSync(resolve(directory, name))
  run('/opt/homebrew/bin/ffmpeg', ['-y', '-v', 'error', '-i', shot.asset, '-vf', 'fps=2,scale=2336:1420:force_original_aspect_ratio=decrease,pad=2336:1420:(ow-iw)/2:(oh-ih)/2', '-q:v', '2', resolve(directory, '%05d.jpg')])
  const frames = readdirSync(directory).filter(name => name.endsWith('.jpg')).sort().map(name => resolve(directory, name))
  const observations = run('reports/inspect-frames', frames).trim().split('\n').map(line => JSON.parse(line))
  const patterns = targets[shot.id].split('|').map(pattern => new RegExp(pattern, 'i'))
  let previousText = ''
  const samples = observations.map((frame, index) => {
    const minimumX = shot.source.startsWith('Screen Recording') ? 0.1 : shot.source === 'jira-creation.mov' ? 0.12 : 0.64
    const lines = frame.lines.filter(line => line.x > minimumX && line.y > 0.1 && line.y < 0.83)
    const anchor = lines.find(line => line.text === previousText) ?? patterns.map(pattern => lines.find(line => pattern.test(line.text))).find(Boolean)
    if (!anchor) return { at: index / 2, box: null }
    previousText = anchor.text
    const paragraph = lines.filter(line => Math.abs(line.x - anchor.x) < 0.035 && Math.abs(line.y - anchor.y) < 0.035)
    const left = Math.max(0, Math.min(...paragraph.map(line => line.x)) - 0.006)
    const top = Math.max(0, Math.min(...paragraph.map(line => line.y)) - 0.008)
    const right = Math.min(1, Math.max(...paragraph.map(line => line.x + line.width)) + 0.006)
    const bottom = Math.min(0.86, Math.max(...paragraph.map(line => line.y + line.height)) + 0.008)
    const box = { x: left, y: top, width: right - left, height: bottom - top }
    return { at: index / 2, box, camera: cameraForBox(box), text: anchor.text }
  })
  const matched = samples.filter(sample => sample.box)
  if (!matched.length) throw new Error(`${shot.id}: no source text matched; choose a better excerpt or target`)
  focus[shot.id] = { sourceSha256: sha256File(shot.asset), duration: shot.duration, samples, color: shot.id.startsWith('s11') ? '#e23b35' : '#1675ff' }
  console.log(`${shot.id}: ${matched.length}/${samples.length} frames anchored to source text`)
}
writeJson('assets/focus.json', focus)