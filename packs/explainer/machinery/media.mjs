import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { ffmpeg as sharedFFmpeg } from './lib/tools.mjs'

// Reuse the previous demos' encoder resolver without creating their output dirs.
// Prefer a caller-supplied binary or PATH before consulting the cached package.
let encoder
export function ffmpeg() {
  if (encoder) return encoder
  if (process.env.FFMPEG_BIN && existsSync(process.env.FFMPEG_BIN)) return (encoder = process.env.FFMPEG_BIN)
  const onPath = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' }).stdout?.trim()
  return (encoder = onPath && existsSync(onPath) ? onPath : sharedFFmpeg())
}

export function runFFmpeg(args, { binary = false, maxBuffer = 32 * 1024 * 1024 } = {}) {
  return new Promise((done, fail) => {
    const child = spawn(ffmpeg(), args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = [], stderr = []
    let bytes = 0
    child.stdout.on('data', data => {
      bytes += data.length
      if (bytes > maxBuffer) { child.kill(); fail(new Error('FFmpeg output exceeded buffer limit')); return }
      stdout.push(data)
    })
    child.stderr.on('data', data => stderr.push(data))
    child.on('error', fail)
    child.on('close', code => {
      const result = { code, stdout: binary ? Buffer.concat(stdout) : Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() }
      if (code !== 0) fail(new Error(`FFmpeg failed (${code}): ${result.stderr.slice(-9000)}`))
      else done(result)
    })
  })
}

export async function pool(items, concurrency, work) {
  let index = 0
  const results = new Array(items.length)
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const i = index++
      if (i >= items.length) return
      results[i] = await work(items[i], i)
    }
  }))
  return results
}

export function loudnessFrom(stderr) {
  const match = stderr.match(/\{\s*"input_i"[\s\S]*?\}/)
  if (!match) throw new Error('No loudness measurement returned')
  const data = JSON.parse(match[0])
  if (!['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].every(k => Number.isFinite(Number(data[k]))))
    throw new Error('Invalid loudness measurement')
  return data
}
