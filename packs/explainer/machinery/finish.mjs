import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SCENES, DIR, OUT, NAME, TITLE, VERSION, VOICE, RATE, FPS } from './story.mjs'
import { checkPreserved, hash, hashFile, readJSON, scriptHash, sourceHash, visualHash } from './production.mjs'
import { canonicalWords, narrationFingerprint } from './pronunciation.mjs'
import { parseWordBoundaries } from './lib/speech.mjs'
import { durationOf } from './lib/tools.mjs'
import { makeTimeline, pictureSegments } from './timing.mjs'
import { runFFmpeg, pool, loudnessFrom, ffmpeg } from './media.mjs'

const narration = readJSON(resolve(OUT, 'narration.json'))
const artwork = readJSON(resolve(OUT, 'illustration-report.json'))
const timeline = readJSON(resolve(OUT, 'timing.json'))
const preserved = checkPreserved()
if (narration.version !== VERSION || narration.scriptHash !== scriptHash()) throw new Error('Narration script is stale')
if (!artwork.passed || artwork.sourceFingerprint !== visualHash() || artwork.probes.length !== 40) throw new Error('Regenerate current artwork')
for (const item of artwork.probes) {
  if (item.pngSha256 !== hashFile(resolve(OUT, 'plates', `${item.id}.png`)) ||
    item.svgSha256 !== hashFile(resolve(OUT, 'plates', `${item.id}.svg`))) throw new Error(`Changed artwork: ${item.id}`)
}
const audio = narration.scenes.map((item, i) => {
  const scene = SCENES[i]
  if (item.id !== scene.id || item.fingerprint !== narrationFingerprint(scene.vo, VOICE, RATE) || item.audioSha256 !== hashFile(item.mp3))
    throw new Error(`Stale narration: ${scene.id}`)
  const duration = durationOf(item.mp3)
  const words = canonicalWords(scene.vo, parseWordBoundaries(readFileSync(item.rawPath, 'utf8'), duration), duration)
  return { ...item, duration, words }
})
if (JSON.stringify(makeTimeline(audio)) !== JSON.stringify(timeline)) throw new Error('Timing does not match current word metadata')

const segments = pictureSegments(timeline)
const segmentDir = resolve(OUT, 'segments')
mkdirSync(segmentDir, { recursive: true })
const renderFingerprint = sourceHash(['finish.mjs', 'media.mjs', 'timing.mjs'])
const previous = existsSync(resolve(OUT, 'segments.json')) ? readJSON(resolve(OUT, 'segments.json')) : null
const closing = readJSON(resolve(OUT, 'closing', 'render-report.json'))
const closingFingerprint = sourceHash(['render-closing.mjs', 'closing-motion.mjs', 'illustrations.mjs', 'story.mjs', 'timing.mjs'])
if (!closing.passed || !closing.seekSafe || closing.sourceFingerprint !== closingFingerprint ||
  closing.timingSha256 !== hashFile(resolve(OUT, 'timing.json')) || closing.sha256 !== hashFile(closing.file))
  throw new Error('Render and validate the current closing animation before finishing')
const baseArgs = ['-y', '-hide_banner', '-loglevel', 'error', '-filter_complex_threads', '1', '-filter_threads', '1']
const encode = ['-an', '-c:v', 'libx264', '-preset', 'fast', '-tune', 'stillimage', '-crf', '18', '-threads', '2',
  '-r', String(FPS), '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-video_track_timescale', '15360']
const plate = id => resolve(OUT, 'plates', `${id}.png`)
const convert = 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1'
let done = 0
console.log(`Encoding ${segments.length} pieces, ${timeline.frameCount} frames, ${timeline.duration.toFixed(3)}s using ${ffmpeg()}`)
const rendered = await pool(segments, 2, async segment => {
  if (segment.kind === 'animation') {
    if (segment.startFrame !== closing.startFrame || segment.frames !== closing.frames || segment.localStartFrame !== closing.localStartFrame)
      throw new Error('Closing segment frame coverage mismatch')
    done++
    return { ...segment, file: closing.file, fingerprint: closing.sourceFingerprint, sha256: closing.sha256 }
  }
  const file = resolve(segmentDir, `${String(segment.index).padStart(3, '0')}.mp4`)
  const inputHashes = segment.kind === 'hold' ? [hashFile(plate(segment.plate))] : [hashFile(plate(segment.from)), hashFile(plate(segment.to))]
  const fingerprint = hash(JSON.stringify({ segment, inputHashes, renderFingerprint }))
  const old = previous?.segments.find(item => item.index === segment.index)
  if (old?.fingerprint !== fingerprint || !existsSync(file) || old.sha256 !== hashFile(file)) {
    const partial = `${file}.partial.mp4`
    if (segment.kind === 'hold') {
      await runFFmpeg([...baseArgs, '-loop', '1', '-framerate', String(FPS), '-i', plate(segment.plate),
        '-vf', convert, '-frames:v', String(segment.frames), ...encode, partial])
    } else {
      // N is 1-based in blend: the incoming image is fully established at the
      // last transition frame; the phrase cue falls at its midpoint.
      const blend = `[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]blend=all_expr='A*(1-N/${segment.frames})+B*N/${segment.frames}',${convert}[v]`
      await runFFmpeg([...baseArgs, '-loop', '1', '-framerate', String(FPS), '-i', plate(segment.from),
        '-loop', '1', '-framerate', String(FPS), '-i', plate(segment.to), '-filter_complex', blend,
        '-map', '[v]', '-frames:v', String(segment.frames), ...encode, partial])
    }
    renameSync(partial, file)
  }
  done++
  if (done % 5 === 0 || done === segments.length) console.log(`Picture pieces ${done}/${segments.length}`)
  return { ...segment, file, fingerprint, sha256: hashFile(file) }
})
writeFileSync(resolve(OUT, 'segments.json'), JSON.stringify({ renderFingerprint, segments: rendered }, null, 2))
const concat = resolve(OUT, 'picture.concat.txt')
writeFileSync(concat, rendered.map(item => `file '${item.file.replaceAll("'", "'\\''")}'`).join('\n') + '\n')
const picture = resolve(OUT, 'picture.mp4')
await runFFmpeg([...baseArgs, '-f', 'concat', '-safe', '0', '-i', concat, '-map', '0:v:0', '-c:v', 'copy', '-movflags', '+faststart', picture])

const rawVoice = resolve(OUT, 'voice-unmixed.wav')
const filters = timeline.scenes.map((scene, i) => `[${i}:a]aresample=48000,asetpts=PTS-STARTPTS,adelay=${Math.round(scene.voiceStart * 48000)}S:all=1[a${i}]`)
filters.push(`${timeline.scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audio.length}:normalize=0:duration=longest,apad=whole_dur=${timeline.duration},atrim=duration=${timeline.duration},aformat=sample_rates=48000:channel_layouts=stereo[voice]`)
await runFFmpeg([...baseArgs, ...audio.flatMap(item => ['-i', item.mp3]), '-filter_complex', filters.join(';'), '-map', '[voice]', '-c:a', 'pcm_s24le', rawVoice])
const measured = await runFFmpeg(['-hide_banner', '-nostats', '-i', rawVoice, '-af', 'loudnorm=I=-16:TP=-1.8:LRA=7:print_format=json', '-f', 'null', '-'])
const levels = loudnessFrom(measured.stderr)
console.log(`Narration analysis: ${levels.input_i} LUFS, ${levels.input_tp} dBTP`)
const normalized = resolve(OUT, 'voice-normalized.wav')
const normalize = `loudnorm=I=-16:TP=-1.8:LRA=7:measured_I=${levels.input_i}:measured_TP=${levels.input_tp}:measured_LRA=${levels.input_lra}:measured_thresh=${levels.input_thresh}:offset=${levels.target_offset}:linear=true:print_format=json,aresample=48000`
await runFFmpeg([...baseArgs, '-i', rawVoice, '-af', normalize, '-c:a', 'pcm_s24le', normalized])

const metadata = resolve(OUT, 'chapters.ffmetadata')
const metaEscape = value => value.replace(/[=;#\\\n]/g, c => `\\${c}`)
writeFileSync(metadata, [';FFMETADATA1', `title=${metaEscape(TITLE)} — HPE OpsRamp AI-First Security`,
  'comment=Self-contained shift-left SecOps story with a hypothetical permissions example and animated close. Not product footage or measured security results.',
  ...timeline.scenes.flatMap(scene => ['[CHAPTER]', 'TIMEBASE=1/1000', `START=${Math.round(scene.start * 1000)}`,
    `END=${Math.round(scene.end * 1000)}`, `title=${metaEscape(scene.title)}`])].join('\n') + '\n')
const output = resolve(OUT, `${NAME}.mp4`)
const partial = resolve(OUT, `${NAME}.partial.mp4`)
await runFFmpeg([...baseArgs, '-i', picture, '-i', normalized, '-i', resolve(OUT, `${NAME}.srt`), '-i', metadata,
  '-map', '0:v:0', '-map', '1:a:0', '-map', '2:0', '-map_metadata', '3', '-map_chapters', '3',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-c:s', 'mov_text',
  '-metadata:s:a:0', 'language=eng', '-metadata:s:s:0', 'language=eng', '-metadata:s:s:0', 'title=English',
  '-disposition:s:0', '0', '-movflags', '+faststart', '-t', timeline.duration.toFixed(6), partial])
renameSync(partial, output)
const report = { generatedAt: new Date().toISOString(), version: VERSION, output, duration: timeline.duration,
  fps: FPS, frameCount: timeline.frameCount, size: timeline.size, voice: VOICE, rate: RATE,
  scriptHash: scriptHash(), visualFingerprint: visualHash(), renderFingerprint,
  timingSha256: hashFile(resolve(OUT, 'timing.json')), narrationSha256: hashFile(resolve(OUT, 'narration.json')),
  outputSha256: hashFile(output), audioAnalysis: levels, pieces: rendered.length,
  chapters: timeline.scenes.map(s => ({ title: s.title, start: s.start, end: s.end })),
  captions: timeline.captions.length, states: timeline.phases.length, transitions: timeline.transitions.length,
  closing: { file: closing.file, sha256: closing.sha256, sourceFingerprint: closing.sourceFingerprint,
    frames: closing.frames, reportSha256: hashFile(resolve(OUT, 'closing', 'render-report.json')), seekSafe: closing.seekSafe },
  preserved: checkPreserved(), previousPreserved: preserved,
  perceptualReview: { watched: false, listened: false, limitation: 'Current session cannot view image inputs or listen to playback. Technical evidence is not human viewing/listening approval.' } }
writeFileSync(resolve(OUT, 'render-report.json'), JSON.stringify(report, null, 2))
console.log(`Finished ${output}\n${timeline.duration.toFixed(3)} seconds; ${timeline.frameCount} frames; ${timeline.captions.length} captions`)
