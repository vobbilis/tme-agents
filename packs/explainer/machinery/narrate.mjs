import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCaptions, parseWordBoundaries, serializeCaptions, SPEECH_ENGINE } from './lib/speech.mjs'
import { durationOf } from './lib/tools.mjs'
import { DIR, OUT, SCENES, VOICE, RATE, NAME, VERSION } from './story.mjs'
import { checkPreserved, hashFile, readJSON, scriptHash } from './production.mjs'
import { PRONUNCIATIONS, PRONUNCIATION_VERSION, canonicalWords, narrationFingerprint, serializeWords, spokenText } from './pronunciation.mjs'
import { checkScript, makeTimeline } from './timing.mjs'

checkScript()
checkPreserved()
const directory = resolve(OUT, 'audio')
mkdirSync(directory, { recursive: true })

async function synthesize(request) {
  const result = spawn('uvx', ['--from', SPEECH_ENGINE, 'python', resolve(DIR, './lib/synthesize.py')], {
    stdio: ['pipe', 'ignore', 'pipe']
  })
  let stderr = ''
  result.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-12000) })
  const completed = new Promise((done, fail) => {
    result.on('error', fail)
    result.on('close', code => code === 0 ? done() : fail(new Error(`Speech generation failed (${code}): ${stderr}`)))
  })
  result.stdin.end(JSON.stringify(request))
  await completed
}

const narration = []
for (const scene of SCENES) {
  const mp3 = resolve(directory, `${scene.id}.mp3`)
  const rawPath = resolve(directory, `${scene.id}.spoken.words.jsonl`)
  const wordsPath = resolve(directory, `${scene.id}.words.jsonl`)
  const receiptPath = resolve(directory, `${scene.id}.json`)
  const fingerprint = narrationFingerprint(scene.vo, VOICE, RATE)
  const old = existsSync(receiptPath) ? readJSON(receiptPath) : null
  const cached = old?.fingerprint === fingerprint && existsSync(mp3) && existsSync(rawPath)
    && old.audioSha256 === hashFile(mp3) && old.spokenWordsSha256 === hashFile(rawPath)
  if (!cached || process.argv.includes('--force')) {
    console.log(`Narrating ${scene.id} (${scene.words} words)`)
    await synthesize({ text: spokenText(scene.vo), voice: VOICE, rate: RATE, audio: `${mp3}.partial`, metadata: `${rawPath}.partial` })
    const duration = durationOf(`${mp3}.partial`)
    const words = canonicalWords(scene.vo, parseWordBoundaries(readFileSync(`${rawPath}.partial`, 'utf8'), duration), duration)
    buildCaptions(scene.vo, words, duration)
    renameSync(`${mp3}.partial`, mp3)
    renameSync(`${rawPath}.partial`, rawPath)
  } else console.log(`Reusing verified narration ${scene.id}`)
  const duration = durationOf(mp3)
  const words = canonicalWords(scene.vo, parseWordBoundaries(readFileSync(rawPath, 'utf8'), duration), duration)
  writeFileSync(wordsPath, serializeWords(words))
  const receipt = { id: scene.id, fingerprint, version: VERSION, duration, mp3, rawPath, wordsPath,
    audioSha256: hashFile(mp3), spokenWordsSha256: hashFile(rawPath), wordsSha256: hashFile(wordsPath),
    spokenText: spokenText(scene.vo), voice: VOICE, rate: RATE, engine: SPEECH_ENGINE,
    pronunciationVersion: PRONUNCIATION_VERSION, pronunciations: PRONUNCIATIONS,
    pronunciationListeningVerified: false }
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2))
  narration.push({ ...receipt, words })
  console.log(`Validated ${scene.id}: ${duration.toFixed(2)}s, ${words.length} canonical words`)
}

const report = { generatedAt: new Date().toISOString(), version: VERSION, scriptHash: scriptHash(),
  voice: VOICE, rate: RATE, engine: SPEECH_ENGINE, scenes: narration,
  preserved: checkPreserved(), pronunciationListeningVerified: false }
writeFileSync(resolve(OUT, 'narration.json'), JSON.stringify(report, null, 2))
const timeline = makeTimeline(narration)
writeFileSync(resolve(OUT, 'timing.json'), JSON.stringify(timeline, null, 2))
writeFileSync(resolve(OUT, `${NAME}.srt`), serializeCaptions(timeline.captions, 'srt'))
writeFileSync(resolve(OUT, `${NAME}.vtt`), serializeCaptions(timeline.captions, 'vtt'))
console.log(JSON.stringify({ duration: timeline.duration, chapters: timeline.scenes.length,
  states: timeline.phases.length, captions: timeline.captions.length,
  maxCueError: Math.max(...timeline.scenes.flatMap(s => s.cues.map(c => Math.abs(c.error)))) }, null, 2))
