import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  statfsSync,
  writeFileSync
} from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)

export const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const REPO_ROOT = resolve(PROJECT, '../..')
export const AUDIO_DIR = resolve(PROJECT, 'assets/audio')
export const REPORTS_DIR = resolve(PROJECT, 'reports')
export const RENDERS_DIR = resolve(PROJECT, 'renders')

export function ensureDirs() {
  for (const dir of [AUDIO_DIR, REPORTS_DIR, RENDERS_DIR]) mkdirSync(dir, { recursive: true })
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

export function sha256(input) {
  return createHash('sha256').update(input).digest('hex')
}

export function sha256File(path) {
  return sha256(readFileSync(path))
}

export function projectRelative(path) {
  return relative(PROJECT, path).split(sep).join('/')
}

export function resolveProjectPath(path) {
  return resolve(PROJECT, path)
}

export function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  return {
    ok: result.status === 0,
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  }
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: PROJECT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options,
    env: {
      ...process.env,
      HYPERFRAMES_NO_TELEMETRY: '1',
      ...options.env
    }
  })
  return {
    ...result,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

function mediaBinary(label, packageName, envNames) {
  for (const envName of envNames) {
    const override = process.env[envName]
    if (!override) continue
    if (!existsSync(override))
      throw new Error(`${envName} points to a missing ${label} binary: ${override}`)
    return override
  }

  try {
    const candidate = require(packageName).path
    if (!candidate || !existsSync(candidate))
      throw new Error(`${packageName} did not expose an installed binary`)
    return candidate
  } catch (error) {
    throw new Error(
      `Unable to resolve ${label} from ${packageName}. Run \`npm ci\` in demo/hyperframes-reel-kit. ${error.message}`
    )
  }
}

let ffmpegPath
export function ffmpeg() {
  return (ffmpegPath ??= mediaBinary(
    'FFmpeg',
    '@ffmpeg-installer/ffmpeg',
    ['HYPERFRAMES_FFMPEG_PATH', 'FFMPEG_BIN']
  ))
}

let ffprobePath
export function ffprobe() {
  return (ffprobePath ??= mediaBinary(
    'FFprobe',
    '@ffprobe-installer/ffprobe',
    ['HYPERFRAMES_FFPROBE_PATH', 'FFPROBE_BIN']
  ))
}

function filesUnder(path) {
  if (!existsSync(path)) return []
  if (!statSync(path).isDirectory()) return [path]
  return readdirSync(path)
    .flatMap(entry => filesUnder(resolve(path, entry)))
}

export function compositionFingerprint() {
  const sources = [
    resolve(PROJECT, 'BRIEF.md'),
    resolve(PROJECT, 'frame.md'),
    resolve(PROJECT, 'scenes.mjs'),
    resolve(PROJECT, 'index.html'),
    resolve(PROJECT, 'assets/opsramp.css'),
    resolve(PROJECT, 'assets/vendor'),
    resolve(PROJECT, 'assets/fonts'),
    resolve(PROJECT, 'assets/reference'),
    resolve(PROJECT, 'compositions')
  ]
  const files = sources.flatMap(filesUnder).sort()
  const hash = createHash('sha256')
  for (const path of files) {
    hash.update(projectRelative(path))
    hash.update(readFileSync(path))
  }
  return hash.digest('hex')
}

export function durationOf(path) {
  const result = spawnSync(ffmpeg(), ['-hide_banner', '-i', path], { encoding: 'utf8' })
  const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error(`No media duration found for ${path}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

export function freeDiskBytes(path = PROJECT) {
  const stats = statfsSync(path)
  return Number(stats.bavail) * Number(stats.bsize)
}

export function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index < 2 ? 0 : 1)} ${units[index]}`
}

export const pad2 = value => String(value).padStart(2, '0')
