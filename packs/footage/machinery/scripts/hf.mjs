import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { PROJECT, ffmpeg, ffprobe } from './lib/project.mjs'

export function hyperframesBinary() {
  const binary = resolve(PROJECT, 'node_modules/.bin/hyperframes')
  if (!existsSync(binary)) {
    throw new Error(
      'Hyperframes is not installed. Run `npm ci` in demo/hyperframes-reel-kit.'
    )
  }
  return binary
}

export function hyperframesEnv(extra = {}) {
  return {
    ...process.env,
    HYPERFRAMES_NO_TELEMETRY: '1',
    HYPERFRAMES_FFMPEG_PATH: ffmpeg(),
    HYPERFRAMES_FFPROBE_PATH: ffprobe(),
    ...extra
  }
}

export function runHyperframes(args, options = {}) {
  const capture = options.capture ?? false
  const result = spawnSync(hyperframesBinary(), args, {
    cwd: PROJECT,
    env: hyperframesEnv(options.env),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: capture ? 'pipe' : 'inherit'
  })
  return {
    ...result,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

const invokedDirectly = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')
if (invokedDirectly) {
  try {
    const result = runHyperframes(process.argv.slice(2))
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
