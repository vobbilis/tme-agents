import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  PROJECT,
  REPORTS_DIR,
  commandExists,
  ensureDirs,
  ffmpeg,
  ffprobe,
  formatBytes,
  freeDiskBytes,
  readJson,
  sha256File,
  writeJson
} from './lib/project.mjs'
import { runHyperframes } from './hf.mjs'

ensureDirs()

const checks = []
const add = (name, passed, detail, required = true) => {
  checks.push({ name, passed: Boolean(passed), required, detail })
  const state = passed ? 'PASS' : required ? 'FAIL' : 'WARN'
  console.log(`${state} ${name}${detail ? ` · ${detail}` : ''}`)
}

const nodeMajor = Number(process.versions.node.split('.')[0])
add('Node 22 or newer', nodeMajor >= 22, process.version)

const uvx = commandExists('uvx')
add('uvx available', uvx.ok, uvx.output.split(/\r?\n/)[0] ?? uvx.output)

try {
  const binary = ffmpeg()
  const version = commandExists(binary, ['-hide_banner', '-version'])
  add('FFmpeg available', version.ok, version.ok ? `${binary} · ${version.output.split(/\r?\n/)[0]}` : version.output)
} catch (error) {
  add('FFmpeg available', false, error.message)
}

try {
  const binary = ffprobe()
  const version = commandExists(binary, ['-hide_banner', '-version'])
  add('FFprobe available', version.ok, version.ok ? `${binary} · ${version.output.split(/\r?\n/)[0]}` : version.output)
} catch (error) {
  add('FFprobe available', false, error.message)
}

const available = freeDiskBytes()
add(
  'render disk headroom',
  available >= 20 * 1024 ** 3,
  `${formatBytes(available)} free; 20 GB minimum`
)

const packageJson = readJson(resolve(PROJECT, 'package.json'))
const lockSpecPath = resolve(PROJECT, 'HYPERFRAMES_SKILLS.lock.json')
const lockSpec = existsSync(lockSpecPath) ? readJson(lockSpecPath) : {}
add(
  'Hyperframes package pin',
  packageJson.devDependencies?.hyperframes === '0.8.62' &&
    packageJson.devDependencies?.['@hyperframes/core'] === '0.8.62' &&
    packageJson.devDependencies?.['@hyperframes/producer'] === '0.8.62' &&
    packageJson.devDependencies?.['@ffmpeg-installer/ffmpeg'] === '1.1.0' &&
    packageJson.devDependencies?.['@ffprobe-installer/ffprobe'] === '2.1.2' &&
    lockSpec.package === 'hyperframes@0.8.62',
  `${packageJson.devDependencies?.hyperframes ?? 'missing'} / core ${
    packageJson.devDependencies?.['@hyperframes/core'] ?? 'missing'
  } / producer ${
    packageJson.devDependencies?.['@hyperframes/producer'] ?? 'missing'
  } / FFmpeg ${
    packageJson.devDependencies?.['@ffmpeg-installer/ffmpeg'] ?? 'missing'
  } / FFprobe ${
    packageJson.devDependencies?.['@ffprobe-installer/ffprobe'] ?? 'missing'
  } / ${lockSpec.package ?? 'missing'}`
)

const packageLockPath = resolve(PROJECT, 'package-lock.json')
if (existsSync(packageLockPath)) {
  const packageLock = readJson(packageLockPath)
  const installed = {
    hyperframes: packageLock.packages?.['node_modules/hyperframes']?.version,
    core: packageLock.packages?.['node_modules/@hyperframes/core']?.version,
    producer: packageLock.packages?.['node_modules/@hyperframes/producer']?.version,
    ffmpeg: packageLock.packages?.['node_modules/@ffmpeg-installer/ffmpeg']?.version,
    ffprobe: packageLock.packages?.['node_modules/@ffprobe-installer/ffprobe']?.version
  }
  add(
    'exact npm lockfile',
    installed.hyperframes === '0.8.62' &&
      installed.core === '0.8.62' &&
      installed.producer === '0.8.62' &&
      installed.ffmpeg === '1.1.0' &&
      installed.ffprobe === '2.1.2',
    Object.entries(installed).map(([name, version]) => `${name} ${version ?? 'missing'}`).join(' / ')
  )
} else {
  add('exact npm lockfile', false, 'run npm install once and commit package-lock.json')
}

const manifestPath = resolve(PROJECT, 'assets/manifest.json')
if (!existsSync(manifestPath)) {
  add('asset receipt manifest', false, 'assets/manifest.json missing — the pack should ship one')
}
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { assets: [] }
for (const asset of manifest.assets) {
  const path = resolve(PROJECT, asset.path)
  add(
    `asset receipt ${asset.path}`,
    existsSync(path) && sha256File(path) === asset.sha256,
    existsSync(path) ? asset.sha256 : 'missing'
  )
}

// Reference-capture receipt: only reels that ship a pinned product capture
// have one; a fresh scaffold has none and that is not a fault.
const captureReceiptPath = resolve(PROJECT, 'assets/reference/private-integrations.receipt.json')
if (existsSync(captureReceiptPath)) {
  const captureReceipt = readJson(captureReceiptPath)
  const capturePath = resolve(PROJECT, 'assets/reference/private-integrations.png')
  add(
    'reference capture is fabricated and pinned',
    captureReceipt.fabricatedData === true &&
      captureReceipt.lessonOverlayAbsent === true &&
      captureReceipt.sha256 === sha256File(capturePath),
    `${captureReceipt.sourceCommit} · ${captureReceipt.status}`
  )
}

// BRIEF.md lives at the reel root in scaffolded projects and beside this
// script in the original reels; accept either.
const briefPath = [resolve(PROJECT, 'BRIEF.md'), resolve(PROJECT, '..', 'BRIEF.md')].find(p => existsSync(p))
const brief = briefPath ? readFileSync(briefPath, 'utf8') : ''
add(
  'internal-media boundary recorded',
  Boolean(briefPath) &&
    /Do not use `publish` or hosted\/cloud rendering/.test(brief) &&
    /terminology and big-picture context only/.test(brief),
  briefPath ? 'local render only; reference material is context, not story' : 'BRIEF.md not found at the reel root or in production/'
)

let hyperframesDoctor = null
if (existsSync(resolve(PROJECT, 'node_modules/.bin/hyperframes'))) {
  const result = runHyperframes(['doctor', '--json'], { capture: true })
  try {
    hyperframesDoctor = JSON.parse(result.stdout)
    // 'Version' is deliberately NOT required: hyperframes doctor fails it
    // whenever a newer release exists, but this project pins 0.8.62 (checked
    // above) — an available upgrade is information, not a fault.
    const requiredForLocalRender = new Set([
      'Node.js',
      'CPU',
      'Memory',
      'Disk',
      'Frames cache',
      'Archive extractor',
      'Environment',
      'FFmpeg',
      'FFprobe',
      'Chrome'
    ])
    const failedRequired = hyperframesDoctor.checks.filter(
      check => requiredForLocalRender.has(check.name) && !check.ok
    )
    add(
      'Hyperframes local-render doctor',
      result.status === 0 && failedRequired.length === 0,
      failedRequired.length
        ? failedRequired.map(check => `${check.name}: ${check.detail}`).join('; ')
        : 'required local-render dependencies inspected; optional AI tools and Docker do not gate this workflow'
    )
  } catch {
    add(
      'Hyperframes local-render doctor',
      false,
      `could not parse doctor output: ${(result.stderr || result.stdout).slice(0, 240)}`
    )
  }
} else {
  add('Hyperframes local-render doctor', false, 'run npm ci first')
}

const report = {
  checkedAt: new Date().toISOString(),
  ok: checks.every(check => check.passed || !check.required),
  checks,
  hyperframes: hyperframesDoctor
}
writeJson(resolve(REPORTS_DIR, 'doctor.json'), report)
if (!report.ok) process.exitCode = 1
