// Independent encoded-media checks. A decoded frame must match the correct
// source state, not merely exist. Technical checks are not perceptual approval.
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SCENES, OUT, NAME, TITLE, VERSION, VOICE, RATE, MIN_DURATION, MAX_DURATION } from './story.mjs'
import { checkPreserved, hashFile, readJSON, scriptHash, sourceHash, visualHash } from './production.mjs'
import { narrationFingerprint, canonicalWords, spokenText, PRONUNCIATIONS, PRONUNCIATION_VERSION } from './pronunciation.mjs'
import { makeTimeline } from './timing.mjs'
import { parseWordBoundaries, tokens, validateCaptions, serializeCaptions } from './lib/speech.mjs'
import { durationOf, parseCaptions } from './lib/tools.mjs'
import { runFFmpeg, pool, loudnessFrom } from './media.mjs'
import { closingState, closingMotionWindows } from './closing-motion.mjs'

const output = resolve(OUT, `${NAME}.mp4`)
const render = readJSON(resolve(OUT, 'render-report.json'))
const timing = readJSON(resolve(OUT, 'timing.json'))
const narration = readJSON(resolve(OUT, 'narration.json'))
const artwork = readJSON(resolve(OUT, 'illustration-report.json'))
const closing = readJSON(resolve(OUT, 'closing', 'render-report.json'))
const checks = [], evidence = {}
function check(name, passed, detail) {
  checks.push({ name, passed: !!passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ' · ' + JSON.stringify(detail)}`)
}

check('current script, artwork, narration, timing, and encoder sources',
  render.version === VERSION && narration.version === VERSION && render.scriptHash === scriptHash() &&
  narration.scriptHash === scriptHash() && render.visualFingerprint === visualHash() &&
  artwork.sourceFingerprint === visualHash() &&
  render.renderFingerprint === sourceHash(['finish.mjs', 'media.mjs', 'timing.mjs']) &&
  render.timingSha256 === hashFile(resolve(OUT, 'timing.json')) && render.narrationSha256 === hashFile(resolve(OUT, 'narration.json')))
check('encoded master matches assembly receipt', render.outputSha256 === hashFile(output))
check('same established narrator and rate', render.voice === VOICE && render.rate === RATE)
check('standalone close replaces the demonstration handoff',
  SCENES.at(-1).id === '10-shift-left' && SCENES.at(-1).animation === 'shift-left' &&
  SCENES.at(-1).vo.endsWith('build it into the way you develop.') &&
  !/let us show|let.s show|walkthrough|separate demo/i.test(SCENES.at(-1).vo + SCENES.at(-1).captions.join(' ')))
check('closing animation matches source, timing, and assembly receipt',
  closing.version === VERSION && closing.passed && closing.seekSafe &&
  closing.sourceFingerprint === sourceHash(['render-closing.mjs', 'closing-motion.mjs', 'illustrations.mjs', 'story.mjs', 'timing.mjs']) &&
  closing.timingSha256 === hashFile(resolve(OUT, 'timing.json')) && closing.sha256 === hashFile(closing.file) &&
  render.closing?.sha256 === closing.sha256 && render.closing.reportSha256 === hashFile(resolve(OUT, 'closing', 'render-report.json')))
check('every changing closing pose passes text bounds, overlap, font, and caption clearance',
  closing.poses > 35 && closing.probes.every(p => !p.issues.length && p.fontsReady && p.contentBottom <= 951),
  { evaluatedPoses: closing.poses, encodedFrames: closing.frames })
const finalPose = closing.probes.find(p => p.state.hero === 1)
check('security shifts to design while verification and release remain in coverage',
  closing.probes.some(p => p.markerX === 1610) && finalPose?.markerX === 310 &&
  finalPose?.stages.length === 5 && finalPose.stages.every(s => s.lit === 1) &&
  finalPose.payoff === 1)
check('requested shift-left title and regular pipeline framing',
  SCENES[0].vo.startsWith(TITLE + '.') &&
  SCENES[0].vo.includes('regular AI-First SDLC workflow') &&
  SCENES[2].vo.includes('scanning, remediation, and regression tests in the regular commit and build pipeline'))
check('speech-only SecOps and OpsRamp pronunciations are current; canonical text is preserved',
  PRONUNCIATIONS.SecOps === 'Seck-ops' && PRONUNCIATIONS.OpsRamp === 'Ops Ramp' &&
  narration.scenes.every((n, i) => n.pronunciationVersion === PRONUNCIATION_VERSION &&
    n.spokenText === spokenText(SCENES[i].vo) && !/\bSec Ops\b/.test(n.spokenText) &&
    JSON.stringify(n.pronunciations) === JSON.stringify(PRONUNCIATIONS)))
try { evidence.preserved = checkPreserved(); check('two source inputs and three reference movies unchanged', true) }
catch (error) { check('two source inputs and three reference movies unchanged', false, error.message) }

const audio = narration.scenes.map((n, i) => {
  check(`narration bytes and canonical text: ${n.id}`, n.id === SCENES[i].id &&
    n.fingerprint === narrationFingerprint(SCENES[i].vo, VOICE, RATE) && n.audioSha256 === hashFile(n.mp3) &&
    n.spokenWordsSha256 === hashFile(n.rawPath) && n.wordsSha256 === hashFile(n.wordsPath))
  const duration = durationOf(n.mp3)
  const words = canonicalWords(SCENES[i].vo, parseWordBoundaries(readFileSync(n.rawPath, 'utf8'), duration), duration)
  return { ...n, duration, words }
})
check('timing independently reproduces from canonical word boundaries', JSON.stringify(makeTimeline(audio)) === JSON.stringify(timing))
const pronunciationDiagnostic = readJSON(resolve(OUT, 'pronunciation-review', 'revised-transcripts.json'))
const secopsAudio = narration.scenes.filter(n => /\bSecOps\b/.test(SCENES.find(s => s.id === n.id).vo))
const targetedRecognition = secopsAudio.map(n => {
  const diagnostic = pronunciationDiagnostic.results.find(r => r.file === n.mp3)
  return { id: n.id, shaMatches: diagnostic?.audioSha256 === n.audioSha256,
    secretaryAbsent: !!diagnostic && !/\bsecretar(?:y|ies)\b/i.test(diagnostic.transcript),
    secopsRecognized: !!diagnostic && /\bsec[\s-]*ops\b/i.test(diagnostic.transcript),
    transcript: diagnostic?.transcript }
})
check('local audio recognition distinguishes SecOps from Secretary in all four affected chapters',
  pronunciationDiagnostic.localAudioOnly && pronunciationDiagnostic.vocabularyPrompt === null &&
  targetedRecognition.length === 4 && targetedRecognition.every(r => r.shaMatches && r.secretaryAbsent && r.secopsRecognized))
evidence.pronunciation = { model: pronunciationDiagnostic.model, checks: targetedRecognition,
  limitation: 'Unprompted local ASR diagnostic of actual audio, not human listening or universal pronunciation approval.' }
check('forty current artwork states, XML, fonts, overlap and caption-clearance checks', artwork.passed &&
  artwork.probes.length === 40 && artwork.probes.every(p => p.xmlValid && p.fontsReady && !p.issues.length &&
    p.caption.top - p.contentBottom >= 12 && p.pngSha256 === hashFile(resolve(OUT, 'plates', `${p.id}.png`)) &&
    p.svgSha256 === hashFile(resolve(OUT, 'plates', `${p.id}.svg`))))
check('all ten standalone hero illustrations and board images load',
  artwork.imageLoads.length === 10 && artwork.imageLoads.every(i => i.loaded) &&
  artwork.standalone.length === 10 && artwork.standalone.every(i => i.loaded))
check('semantic connectors exceed 3:1 contrast', artwork.contrasts.every(c => c.ratio >= 3), artwork.contrasts)
const records = artwork.probes.filter(p => /^(05|06|07)-/.test(p.id) || p.id === '04-context-3').map(p => p.evidenceRecord)
check('the hypothetical evidence record persists at one position through chapters 4–7', records.length === 13 &&
  records.every(r => r.visible && r.identity === 'hypothetical-permissions' && r.x === 104 && r.y === 775 && r.width === 1712 && r.height === 112))
check('thirty cues aligned within one half-frame', timing.scenes.flatMap(s => s.cues).length === 30 &&
  timing.scenes.every(s => s.cues.every(c => Math.abs(c.error) <= .5 / timing.fps + 1e-9)),
  Math.max(...timing.scenes.flatMap(s => s.cues.map(c => Math.abs(c.error)))))
check('human ownership and closing hero have readable holds', timing.scenes[2].phases[3].duration >= 8 &&
  timing.scenes[9].phases[3].duration >= 1.5 && timing.scenes[9].tail >= 1 && timing.scenes[9].tail <= 1.5,
  { humanOwnership: timing.scenes[2].phases[3].duration, closingHero: timing.scenes[9].phases[3].duration, finalTail: timing.scenes[9].tail })
check('crisp ending is under twelve seconds with only fourteen spoken words',
  timing.scenes.at(-1).duration >= 6 && timing.scenes.at(-1).duration <= 12 && SCENES.at(-1).words === 14,
  { duration: timing.scenes.at(-1).duration, words: SCENES.at(-1).words })
check('36 dissolves plus three independently timed closing motions', timing.transitions.length === 36 &&
  closing.windows.length === 3 && JSON.stringify(closing.windows) === JSON.stringify(closingMotionWindows(timing.scenes.at(-1))))

const [info, decoded, extracted, analyzed] = await Promise.all([
  runFFmpeg(['-hide_banner', '-i', output, '-f', 'ffmetadata', '-']),
  runFFmpeg(['-v', 'error', '-xerror', '-progress', 'pipe:1', '-nostats', '-i', output, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']),
  runFFmpeg(['-v', 'error', '-i', output, '-map', '0:s:0', '-f', 'srt', '-']),
  runFFmpeg(['-hide_banner', '-nostats', '-i', output,
    '-vf', 'blackdetect=d=0.1:pix_th=0.10:pic_th=0.999',
    '-af', 'silencedetect=noise=-45dB:d=2,loudnorm=I=-16:TP=-1.8:LRA=7:print_format=json', '-f', 'null', '-'])
])
const duration = durationOf(output)
const videoStream = info.stderr.split('\n').find(line => /Stream.*Video:/.test(line)) ?? ''
const audioStream = info.stderr.split('\n').find(line => /Stream.*Audio:/.test(line)) ?? ''
check('H.264 1920×1080, 30fps, BT.709', /Video: h264/.test(videoStream) && /1920x1080/.test(videoStream) && /30 fps/.test(videoStream) && /bt709/.test(videoStream), videoStream.trim())
check('AAC stereo at 48kHz', /Audio: aac/.test(audioStream) && /48000 Hz, stereo/.test(audioStream), audioStream.trim())
check('exactly one video and one audio track', info.stderr.split('\n').filter(l => /Stream.*Video:/.test(l)).length === 1 &&
  info.stderr.split('\n').filter(l => /Stream.*Audio:/.test(l)).length === 1)
check('selectable English captions', /Stream.*\(eng\).*Subtitle: mov_text/.test(info.stderr))
check('duration between five and six minutes and matches the edit', duration >= MIN_DURATION && duration <= MAX_DURATION && Math.abs(duration - timing.duration) < .04, duration)
const decodedFrames = Number([...decoded.stdout.matchAll(/^frame=(\d+)/gm)].at(-1)?.[1])
check('complete video and audio decode with exact frame count', !decoded.stderr.trim() && decodedFrames === timing.frameCount,
  { decodedFrames, expected: timing.frameCount, errors: decoded.stderr.trim() })
const chapters = info.stdout.split('[CHAPTER]').slice(1).map(block => {
  const fields = Object.fromEntries(block.trim().split('\n').filter(l => l.includes('=')).map(l => {
    const at = l.indexOf('='); return [l.slice(0, at), l.slice(at + 1)]
  }))
  const [n, d] = fields.TIMEBASE.split('/').map(Number)
  return { title: fields.title, start: Number(fields.START) * n / d, end: Number(fields.END) * n / d }
})
check('ten correctly titled and timed chapters', chapters.length === 10 && chapters.every((c, i) =>
  c.title === timing.scenes[i].title && Math.abs(c.start - timing.scenes[i].start) <= .001 && Math.abs(c.end - timing.scenes[i].end) <= .001))
evidence.chapters = chapters

const captions = parseCaptions(extracted.stdout)
try { validateCaptions(captions, duration); check('encoded caption bounds and order', true) }
catch (error) { check('encoded caption bounds and order', false, error.message) }
check('captions cover the canonical script exactly', tokens(captions.map(c => c.text).join(' ')).join(' ') === tokens(SCENES.map(s => s.vo).join(' ')).join(' '), captions.length)
check('caption text, timing, and line lengths match word-aligned sidecars', captions.length === timing.captions.length && captions.every((c, i) =>
  c.text === timing.captions[i].text && Math.abs(c.start - timing.captions[i].start) < .003 && Math.abs(c.end - timing.captions[i].end) < .003 &&
  c.text.split('\n').length <= 2 && c.text.split('\n').every(l => l.length <= 42)))
check('SRT and VTT are current and complete', readFileSync(resolve(OUT, `${NAME}.srt`), 'utf8') === serializeCaptions(timing.captions, 'srt') &&
  readFileSync(resolve(OUT, `${NAME}.vtt`), 'utf8') === serializeCaptions(timing.captions, 'vtt'))
const loudness = loudnessFrom(analyzed.stderr)
check('encoded loudness is within 0.5 LU of −16 LUFS', Math.abs(Number(loudness.input_i) + 16) <= .5, loudness.input_i)
check('encoded true peak is below −1 dBTP', Number(loudness.input_tp) < -1, loudness.input_tp)
const blackFrames = [...analyzed.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map(m => ({ start: +m[1], end: +m[2], duration: +m[3] }))
check('no unexpected black intervals', blackFrames.length === 0, blackFrames)
const silenceStarts = [...analyzed.stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => +m[1])
const silences = [...analyzed.stderr.matchAll(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g)]
  .map((m, i) => ({ start: silenceStarts[i], end: +m[1], duration: +m[2] }))
const plannedGaps = timing.scenes.map((scene, i) => ({
  start: scene.voiceStart + audio[i].words.at(-1).end,
  end: i === 9 ? timing.duration : timing.scenes[i + 1].voiceStart + audio[i + 1].words[0].start,
  after: scene.id
}))
for (const silence of silences) silence.plannedAfter = plannedGaps.find(g => silence.start >= g.start - .25 && silence.end <= g.end + .25)?.after ?? null
check('silence longer than two seconds is confined to planned chapter/closing holds',
  silenceStarts.length === silences.length && silences.every(s => s.plannedAfter), silences)
evidence.audio = { loudness, silences }

// Compare reduced luminance buffers after the same BT.709 conversion as the
// renderer. We inspect source-vs-encoded state identity, not just timestamps.
const thumb = 'scale=480:270:flags=area,format=gray'
const referenceFilter = 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,' + thumb
const buffers = new Map(await pool(timing.phases, 3, async p => {
  const result = await runFFmpeg(['-v', 'error', '-i', resolve(OUT, p.plate), '-vf', referenceFilter, '-frames:v', '1', '-f', 'rawvideo', '-'], { binary: true })
  return [p.id, result.stdout]
}))
const framesDir = resolve(OUT, 'encoded-frames')
const transitionsDir = resolve(OUT, 'encoded-transitions')
mkdirSync(framesDir, { recursive: true }); mkdirSync(transitionsDir, { recursive: true })
async function sample(time, path) {
  const result = await runFFmpeg(['-y', '-v', 'error', '-ss', time.toFixed(6), '-i', output,
    '-filter_complex', `[0:v]split=2[full][small];[small]${thumb}[gray]`,
    '-map', '[full]', '-frames:v', '1', '-update', '1', path,
    '-map', '[gray]', '-frames:v', '1', '-f', 'rawvideo', '-'], { binary: true })
  if (result.stdout.length !== 480 * 270) throw new Error('Incorrect frame sample dimensions')
  return result.stdout
}
function mae(a, b) {
  let error = 0
  for (let i = 0; i < a.length; i++) error += Math.abs(a[i] - b[i])
  return error / a.length
}
const frameMatches = await pool(timing.phases, 2, async phase => {
  const at = Math.floor((phase.startFrame + phase.endFrame) / 2) / timing.fps
  const actual = await sample(at, resolve(framesDir, `${phase.id}.png`))
  const matches = [...buffers].map(([id, b]) => ({ id, mae: mae(actual, b) })).sort((a, b) => a.mae - b.mae)
  const own = matches.find(m => m.id === phase.id)
  const other = matches.find(m => m.id !== phase.id)
  check(`encoded picture state ${phase.id}`, matches[0].id === phase.id && own.mae < 3,
    { at, error: +own.mae.toFixed(3), nearestOther: other.id, otherError: +other.mae.toFixed(3) })
  return { id: phase.id, at, error: own.mae, nearestOther: other }
})
evidence.pictureStates = frameMatches
const transitionMatches = await pool(timing.transitions, 2, async t => {
  const at = t.midpointFrame / timing.fps
  const actual = await sample(at, resolve(transitionsDir, `${t.to}.png`))
  const a = buffers.get(t.from), b = buffers.get(t.to)
  let numerator = 0, denominator = 0, count = 0
  for (let i = 0; i < a.length; i++) {
    const d = b[i] - a[i]
    if (Math.abs(d) < 12) continue
    numerator += (actual[i] - a[i]) * d
    denominator += d * d
    count++
  }
  const incomingWeight = numerator / denominator
  let error = 0
  for (let i = 0; i < a.length; i++) if (Math.abs(b[i] - a[i]) >= 12)
    error += Math.abs(actual[i] - (a[i] * (1 - incomingWeight) + b[i] * incomingWeight))
  error /= count
  check(`encoded dissolve into ${t.to}`, count > 40 && incomingWeight > .25 && incomingWeight < .8 && error < 8,
    { incomingWeight: +incomingWeight.toFixed(3), error: +error.toFixed(3), pixels: count })
  return { ...t, incomingWeight, error, changedPixels: count }
})
evidence.dissolves = transitionMatches
const closingSamplesDir = resolve(OUT, 'encoded-closing')
mkdirSync(closingSamplesDir, { recursive: true })
const closingSamples = await pool(closing.samples, 2, async reference => {
  const validReference = reference.sha256 === hashFile(reference.file) &&
    JSON.stringify(reference.state) === JSON.stringify(closingState(reference.localTime, timing.scenes.at(-1)))
  const expected = await runFFmpeg(['-v', 'error', '-i', reference.file, '-vf', referenceFilter,
    '-frames:v', '1', '-f', 'rawvideo', '-'], { binary: true })
  const actual = await sample(reference.globalTime, resolve(closingSamplesDir, `${reference.id}.png`))
  const error = mae(actual, expected.stdout)
  const phaseReference = buffers.get(`${timing.scenes.at(-1).id}-${reference.state.phase}`)
  const staticError = mae(actual, phaseReference)
  const midShift = reference.id === 'shift-left-50'
  check(`encoded closing motion ${reference.id}`, validReference && error < 3 && (!midShift || staticError > error * 2),
    { at: reference.globalTime, error: +error.toFixed(3), staticEndpointError: +staticError.toFixed(3),
      markerX: 1610 - 1300 * reference.state.shift, flow: reference.state.flow, payoff: reference.state.hero })
  return { id: reference.id, at: reference.globalTime, error, staticError, state: reference.state }
})
evidence.closingAnimation = { motionVersion: closing.motionVersion, frames: closing.frames, windows: closing.windows,
  seekSafe: closing.seekSafe, evaluatedPoses: closing.poses, samples: closingSamples }
check('final source/reference preservation after media checks', checkPreserved().every(p => p.unchanged))
const report = { verifiedAt: new Date().toISOString(), version: VERSION, output, duration,
  bytes: statSync(output).size, sha256: hashFile(output), technicalPass: checks.every(c => c.passed), checks, evidence,
  framesDir, transitionsDir,
  perceptualReview: { watched: false, listened: false,
    limitation: 'Image viewing and audio listening are unavailable in this session. Every picture state and dissolve is checked against encoded pixels; this is not a fresh human viewing or pronunciation approval.' } }
writeFileSync(resolve(OUT, 'verification-report.json'), JSON.stringify(report, null, 2))
if (!report.technicalPass) process.exitCode = 1
console.log(`Verification ${report.technicalPass ? 'PASSED' : 'HAS FAILURES'}: ${checks.filter(c => c.passed).length}/${checks.length} checks`)
