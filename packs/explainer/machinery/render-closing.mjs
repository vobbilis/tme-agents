// Render the closing only, directly from time-derived SVG attributes. Static
// frames are reused in memory; every changing pose is laid out and captured.
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { launchCamera } from './lib/camera.mjs'
import { DIR, OUT, REPO, SCENES, SIZE, FPS, VERSION } from './story.mjs'
import { readJSON, hashFile, sourceHash, checkPreserved } from './production.mjs'
import { illustration } from './illustrations.mjs'
import { CLOSING_MOTION_VERSION, closingState, closingMotionSamples, closingMotionWindows } from './closing-motion.mjs'
import { pictureSegments } from './timing.mjs'
import { ffmpeg } from './media.mjs'

export const closingSourceHash = () => sourceHash(['render-closing.mjs', 'closing-motion.mjs', 'illustrations.mjs', 'story.mjs', 'timing.mjs'])

const timeline = readJSON(resolve(OUT, 'timing.json'))
const scene = timeline.scenes.at(-1)
const spec = SCENES.at(-1)
if (timeline.version !== VERSION || scene.id !== spec.id || scene.animation !== 'shift-left') throw new Error('Current timed closing required')
const segment = pictureSegments(timeline).find(s => s.kind === 'animation')
if (!segment) throw new Error('No timed closing animation segment')
const directory = resolve(OUT, 'closing')
mkdirSync(directory, { recursive: true })
const file = resolve(directory, 'animation.mp4')
const reportPath = resolve(directory, 'render-report.json')
const fingerprint = closingSourceHash()
const timingSha256 = hashFile(resolve(OUT, 'timing.json'))
if (existsSync(reportPath) && existsSync(file)) {
  const previous = readJSON(reportPath)
  if (previous.passed && previous.sourceFingerprint === fingerprint && previous.timingSha256 === timingSha256 &&
    previous.sha256 === hashFile(file) && previous.samples.every(s => s.sha256 === hashFile(s.file))) {
    console.log(`Reusing verified closing animation: ${file}`)
    process.exit(0)
  }
}
checkPreserved()
const fontStyle = ['Regular', 'Medium', 'Bold'].map((name, i) =>
  `@font-face{font-family:Graphik;src:url(data:font/otf;base64,${readFileSync(resolve(DIR, `assets/fonts/HPEGraphik-${name}.otf`)).toString('base64')});font-weight:${[400, 500, 700][i]};font-display:block}`
).join('')
const browser = await launchCamera()
const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 })
const errors = [], externalRequests = []
await context.route('**/*', route => { externalRequests.push(route.request().url()); return route.abort() })
const page = await context.newPage()
page.on('pageerror', e => errors.push(e.message))
let encoder
try {
  await page.setContent(`<!doctype html><html><head><style>${fontStyle}html,body{margin:0;width:1920px;height:1080px;overflow:hidden}svg{display:block}</style></head><body><div id="frame"></div></body></html>`)
  await page.evaluate(async () => {
    await Promise.all([400, 500, 700].map(w => document.fonts.load(`${w} 30px Graphik`)))
    await document.fonts.ready
  })
  const probes = []
  let lastKey, lastPNG, poses = 0
  async function draw(time) {
    const state = closingState(time, scene)
    const key = JSON.stringify(state)
    if (key === lastKey) return lastPNG
    const svg = illustration(spec, state.phase, { motion: state })
    await page.evaluate(svg => { document.getElementById('frame').innerHTML = svg }, svg)
    const layout = await page.evaluate(() => {
      const boxes = [], issues = []
      for (const el of document.querySelectorAll('[data-fit]')) {
        let opacity = 1
        for (let a = el; a; a = a.parentElement) opacity *= Number(getComputedStyle(a).opacity)
        if (opacity < .02) continue
        const r = el.getBoundingClientRect()
        const b = { text: el.textContent, x: r.x, y: r.y, width: r.width, height: r.height }
        boxes.push(b)
        if (r.left < 86 || r.right > 1838 || r.top < 42 || r.bottom > 951) issues.push({ type: 'bounds', ...b })
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
        const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
        if (w > 4 && h > 4) issues.push({ type: 'text-overlap', text: [a.text, b.text], w, h })
      }
      const marker = document.getElementById('security-marker')
      return { issues, fontsReady: [400, 500, 700].every(w => document.fonts.check(`${w} 30px Graphik`)),
        markerX: Number(marker.dataset.x), markerTransform: marker.getAttribute('transform'),
        stages: [...document.querySelectorAll('.pipeline-stage')].map(el => ({ name: el.dataset.stage, lit: +el.dataset.lit })),
        payoff: +document.getElementById('closing-payoff').getAttribute('opacity'), contentBottom: Math.max(...boxes.map(b => b.y + b.height)) }
    })
    if (layout.issues.length || !layout.fontsReady) throw new Error(`Closing layout at ${time}: ${JSON.stringify(layout)}`)
    probes.push({ localTime: time, state, ...layout })
    poses++
    lastKey = key
    lastPNG = await page.screenshot({ animations: 'disabled' })
    return lastPNG
  }

  // Reference frames sample actual in-between poses, not only static endpoints.
  const samples = []
  for (const sample of closingMotionSamples(scene)) {
    const png = await draw(sample.localTime)
    const path = resolve(directory, `${sample.id}.png`)
    writeFileSync(path, png)
    samples.push({ ...sample, globalTime: scene.start + sample.localTime, state: closingState(sample.localTime, scene), file: path, sha256: hashFile(path) })
  }
  const deterministicTime = closingMotionWindows(scene)[0].start + .7
  const before = await draw(deterministicTime)
  await draw(scene.duration - .2)
  const after = await draw(deterministicTime)
  const seekSafe = before.equals(after)
  if (!seekSafe) throw new Error('Closing depends on seek history')

  const partial = resolve(directory, 'animation.partial.mp4')
  encoder = spawn(ffmpeg(), ['-y', '-hide_banner', '-loglevel', 'error', '-filter_threads', '1',
    '-f', 'image2pipe', '-framerate', String(FPS), '-vcodec', 'png', '-i', 'pipe:0',
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1',
    '-frames:v', String(segment.frames), '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '2',
    '-r', String(FPS), '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-video_track_timescale', '15360', partial],
  { stdio: ['pipe', 'ignore', 'pipe'] })
  let stderr = '', pipeError
  encoder.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-16000) })
  encoder.stdin.on('error', error => { pipeError = error })
  const finished = new Promise((done, fail) => {
    encoder.on('error', fail)
    encoder.on('close', code => code === 0 ? done() : fail(new Error(`Closing encode failed: ${stderr}`)))
  })
  finished.catch(() => {})
  for (let frame = 0; frame < segment.frames; frame++) {
    if (pipeError) throw pipeError
    const time = (segment.localStartFrame + frame) / FPS
    const png = await draw(time)
    if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain')
    if (frame % 150 === 0) console.log(`Closing motion ${frame}/${segment.frames} frames; ${poses} evaluated poses`)
  }
  encoder.stdin.end()
  await finished
  if (errors.length || externalRequests.length) throw new Error('Closing browser errors or external requests')
  renameSync(partial, file)
  const report = { generatedAt: new Date().toISOString(), version: VERSION, motionVersion: CLOSING_MOTION_VERSION,
    sourceFingerprint: fingerprint, timingSha256, file, sha256: hashFile(file), scene: scene.id,
    startFrame: segment.startFrame, localStartFrame: segment.localStartFrame, frames: segment.frames, fps: FPS,
    duration: segment.duration, windows: closingMotionWindows(scene), samples, probes, poses,
    seekSafe, errors, externalRequests, passed: true, preserved: checkPreserved(),
    perceptualReview: 'Time-derived SVG/layout and encoded frames are checked; no human viewing approval claimed.' }
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Closing animation complete: ${segment.frames} frames, ${poses} evaluated poses, seek-safe`)
} catch (error) {
  encoder?.kill()
  writeFileSync(resolve(directory, 'failure.json'), JSON.stringify({ message: error.message, errors }, null, 2))
  throw error
} finally {
  await context.close()
  await browser.close()
}
