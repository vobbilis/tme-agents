import { existsSync, mkdirSync, renameSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildTimeline } from './lib/timeline.mjs'
import { sceneShots } from './lib/shots.mjs'
import { PROJECT, REPORTS_DIR, freeDiskBytes, readJson, sha256, sha256File, writeJson } from './lib/project.mjs'

const ffmpeg = '/opt/homebrew/bin/ffmpeg'
const ffprobe = '/opt/homebrew/bin/ffprobe'
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const timeline = buildTimeline()
if (!timeline.narrationComplete) throw new Error('Generate all narration before locking source cuts')
if (!existsSync(ffmpeg) || !existsSync(ffprobe)) throw new Error('The documented system media tools are unavailable')
if (freeDiskBytes() < 5 * 1024 ** 3) throw new Error('At least 5 GB of free disk is required')

const sourceInfo = new Map()
const run = (binary, args) => {
  const result = spawnSync(binary, args, { encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 })
  if (result.status !== 0) throw new Error(`${binary} failed:\n${result.stderr}`)
  return result.stdout
}
const records = []
for (const scene of timeline.scenes) {
  for (const shot of sceneShots(scene, scene).filter(shot => !shot.pending)) {
    const source = resolve(PROJECT, '..', shot.source)
    if (!sourceInfo.has(source)) {
      const info = JSON.parse(run(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', source]))
      const stat = statSync(source)
      const video = info.streams.find(stream => stream.codec_type === 'video')
      const rate = value => { const [n, d] = String(value ?? '0/1').split('/').map(Number); return d ? n / d : 0 }
      sourceInfo.set(source, { duration: Number(info.format.duration), bytes: stat.size, modified: stat.mtime.toISOString(), codec: video?.codec_name, avgFps: rate(video?.avg_frame_rate), nominalFps: rate(video?.r_frame_rate) })
    }
    const info = sourceInfo.get(source)
    if (!(shot.duration > 0) || shot.sourceStart >= info.duration || (!shot.holdLastFrame && shot.sourceStart + shot.duration > info.duration))
      throw new Error(`${shot.id}: source range exceeds the recording`)
    const availableDuration = Math.min(shot.duration, info.duration - shot.sourceStart)
    if (shot.source === 'analysis.mov' && shot.sourceStart < 1320 && shot.sourceStart + shot.duration > 1200)
      throw new Error(`${shot.id}: excluded lock-screen range`)
    if (shot.source === 'jira-creation.mov' && shot.sourceStart + shot.duration > 720)
      throw new Error(`${shot.id}: excluded late unrelated-chat range`)
    const output = resolve(PROJECT, shot.asset)
    const receipt = `${output}.json`
    // trim-vs-seek is decided by what the PROBE says, never by filename
    // (found live 2026-10-04: renaming a recording to a plain id defeated the
    // old 'Screen Recording' prefix check and VFR excerpts failed duration):
    // heavily variable-frame-rate sources must decode from zero with trim.
    const isModel = info.avgFps > 0 && (info.avgFps < 25 || info.nominalFps / info.avgFps > 2)
    const fingerprint = sha256(JSON.stringify({ shot, info, profile: isModel ? '2560w-30fps-videotoolbox-12Mbps-v2-normalized-trim' : '2560w-30fps-videotoolbox-12Mbps-v1' }))
    const old = existsSync(receipt) ? readJson(receipt) : null
    let current = existsSync(output) && old?.fingerprint === fingerprint && old.sha256 === sha256File(output)
    if ((!only || shot.id === only) && !current) {
      mkdirSync(dirname(output), { recursive: true })
      console.log(`${shot.id}: ${shot.source} ${shot.sourceStart.toFixed(2)}s + ${shot.duration.toFixed(2)}s`)
      const partial = `${output}.partial.mp4`
      const padding = shot.holdLastFrame ? `,tpad=stop_mode=clone:stop_duration=${Math.max(0, shot.duration - availableDuration)}` : ''
      const input = isModel ? ['-i', source] : ['-ss', String(shot.sourceStart), '-i', source]
      const trim = isModel ? `,trim=start=${shot.sourceStart},setpts=PTS-STARTPTS` : ''
      run(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...input, '-t', shot.duration.toFixed(6), '-an', '-vf', `fps=30${trim},scale=2560:-2${padding}`, '-c:v', 'h264_videotoolbox', '-b:v', '12M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', partial])
      const probe = JSON.parse(run(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', partial]))
      if (Math.abs(Number(probe.format.duration) - shot.duration) > 0.1)
        throw new Error(`${shot.id}: encoded duration mismatch`)
      renameSync(partial, output)
      writeJson(receipt, { fingerprint, source: shot.source, sourceInfo: info, sourceStart: shot.sourceStart, duration: shot.duration, holdAfter: shot.holdLastFrame ? availableDuration : null, sha256: sha256File(output), profile: '2560w, 30 fps, H.264, silent', review: 'Source-text focus tracking; complete audiovisual and redaction review pending' })
      current = true
    }
    records.push({ ...shot, ready: current })
  }
}
writeJson(resolve(REPORTS_DIR, 'footage.json'), { complete: records.every(shot => shot.ready), shots: records })
console.log(`${records.filter(shot => shot.ready).length}/${records.length} source excerpts ready`)