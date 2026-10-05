import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = dirname(fileURLToPath(import.meta.url))
// Preserve the rejected cut at out/; the organizational rewrite gets its own
// generation directory and never silently replaces the earlier artifact.
export const OUT = resolve(process.env.REEL_OUT ?? resolve(HERE, 'out', 'organization-integrated-cut'))
export const PREVIOUS_OUT = resolve(HERE, 'out', 'organization-first-cut')
export const AUDIO_DIR = resolve(OUT, 'audio')
export const RECORDINGS_DIR = resolve(HERE, '..', 'recordings')

export function ensureDirs() {
  for (const dir of [OUT, AUDIO_DIR, RECORDINGS_DIR, resolve(OUT, 'frames')])
    mkdirSync(dir, { recursive: true })
}

export function visualSourceFingerprint(scenes) {
  const hash = createHash('sha256')
  for (const file of ['visuals.mjs', 'technical-intro/visuals.mjs', 'record.mjs'])
    hash.update(file).update(readFileSync(resolve(HERE, file)))
  return hash.update(JSON.stringify(scenes)).digest('hex')
}

// Bind a recording to the exact source receipt and the media bytes it used.
// A changed clip must invalidate a capture even when the CSS is unchanged.
export function brollFingerprint(receipt, read = readFileSync) {
  const hash = createHash('sha256').update(JSON.stringify(receipt))
  for (const key of ['rum', 'private', 'learn']) {
    const asset = receipt.assets?.[key]
    for (const field of ['still', 'clip']) {
      if (!asset?.[field]) throw new Error(`missing B-roll ${key}/${field}`)
      hash.update(`${key}/${field}`).update(read(asset[field]))
    }
  }
  return hash.digest('hex')
}

export function assertCleanPrivateCapture(asset) {
  if (asset?.sourceCapture !== 'direct-ui' || asset.lessonOverlayAbsent !== true ||
      !asset.submissionId || !asset.proof?.includes('actual submission POST succeeded') ||
      !asset.proof?.includes('created card visible') ||
      asset.moments?.length !== 4 || asset.moments.some(moment => !moment.lessonOverlayAbsent))
    throw new Error('Private Integrations needs direct-UI footage with a created-submission and clean-state receipt')
}

let ffmpegPath = null
export function ffmpeg() {
  if (ffmpegPath) return ffmpegPath
  if (process.env.FFMPEG_BIN && existsSync(process.env.FFMPEG_BIN))
    return (ffmpegPath = process.env.FFMPEG_BIN)
  const probe = spawnSync(
    'uvx',
    [
      '--from',
      'imageio-ffmpeg',
      'python',
      '-c',
      'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'
    ],
    { encoding: 'utf8' }
  )
  const line = (probe.stdout ?? '').trim().split('\n').at(-1)
  if (probe.status !== 0 || !line || !existsSync(line))
    throw new Error(
      `could not resolve ffmpeg via uvx/imageio-ffmpeg (${probe.stderr?.slice(0, 200)}); set FFMPEG_BIN`
    )
  return (ffmpegPath = line)
}

export function durationOf(file) {
  const result = spawnSync(ffmpeg(), ['-hide_banner', '-i', file], {
    encoding: 'utf8'
  })
  const text = `${result.stdout}\n${result.stderr}`
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error(`no Duration in ffmpeg output for ${file}`)
  return (
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3])
  )
}

export function run(bin, args, options = {}) {
  return execFileSync(bin, args, { stdio: 'inherit', ...options })
}

export const pad2 = value => String(value).padStart(2, '0')

export function detectSceneMarks(pixels, fps = 30, kind = 'start') {
  const marks = []
  let wasMarked = false
  for (let offset = 0; offset < pixels.length; offset += 3) {
    const marked = kind === 'end'
      ? pixels[offset] < 80 && pixels[offset + 1] > 180 && pixels[offset + 2] > 180
      : pixels[offset] > 180 && pixels[offset + 1] < 80 && pixels[offset + 2] > 180
    if (marked && !wasMarked) marks.push(offset / 3 / fps)
    wasMarked = marked
  }
  return marks
}

// Paired markers exclude page preparation between scenes. A start-only cut
// would stretch that navigation/loading footage into the preceding shot.
export function alignSceneWindows(clips, starts, ends, videoDuration) {
  if (!clips.length || starts.length !== clips.length || ends.length !== clips.length)
    throw new Error(`expected ${clips.length} paired scene marks; found ${starts.length} starts / ${ends.length} ends`)
  const head = starts[0]
  const scenes = clips.map((clip, index) => {
    const start = starts[index]
    const end = ends[index]
    const duration = end - start
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 ||
      end > videoDuration || duration <= 0 ||
      (index > 0 && start < ends[index - 1]))
      throw new Error(`invalid or overlapping scene window: ${clip.id}`)
    if (clip.duration + 0.35 > duration)
      throw new Error(`${clip.id} voice-over overruns its measured scene (${clip.duration}s / ${duration}s)`)
    return { ...clip, voiceDuration: clip.duration, start: start - head, duration }
  })
  return { head, duration: scenes.reduce((sum, scene) => sum + scene.duration, 0), scenes }
}

export function alignScenes(clips, marks, videoDuration) {
  if (marks.length !== clips.length || marks.length === 0)
    throw new Error(`expected ${clips.length} scene marks, found ${marks.length}`)
  const head = marks[0]
  const scenes = clips.map((clip, index) => {
    const duration = (marks[index + 1] ?? videoDuration) - marks[index]
    if (duration <= 0 || clip.duration + 0.25 > duration)
      throw new Error(
        `${clip.id} voice-over overruns its measured scene (${clip.duration}s / ${duration}s)`
      )
    return {
      ...clip,
      voiceDuration: clip.duration,
      start: marks[index] - head,
      duration
    }
  })
  return { head, duration: videoDuration - head, scenes }
}

export function parseCaptions(text) {
  const time = value => {
    const match = value
      .trim()
      .match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/)
    if (!match) throw new Error(`invalid caption timestamp: ${value}`)
    return (
      Number(match[1]) * 3600 +
      Number(match[2]) * 60 +
      Number(match[3]) +
      Number(match[4]) / 1000
    )
  }
  return text
    .replace(/\r/g, '')
    .trim()
    .split(/\n\s*\n/)
    .filter(block => block.includes('-->'))
    .map(block => {
      const lines = block.split('\n')
      const index = lines.findIndex(line => line.includes('-->'))
      const [start, end] = lines[index].split('-->')
      return {
        start: time(start),
        end: time(end),
        text: lines.slice(index + 1).join('\n')
      }
    })
}
