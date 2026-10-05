// Short speech-only enunciation trials. This generates local diagnostic audio,
// not a second narration source and not a listening approval.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DIR, OUT, VOICE, RATE } from './story.mjs'
import { hashFile, readJSON } from './production.mjs'
import { SPEECH_ENGINE, parseWordBoundaries } from './lib/speech.mjs'
import { durationOf } from './lib/tools.mjs'

const directory = resolve(OUT, 'pronunciation-review')
mkdirSync(directory, { recursive: true })
const cases = [
  { id: 'natural-security-seck-ops', security: 'Security', secops: 'Seck-ops' },
  { id: 'se-cure-ity-seck-ops', security: 'Se-cure-ity', secops: 'Seck-ops' },
  { id: 'sih-cure-ih-tee-seck-ops', security: 'Sih-cure-ih-tee', secops: 'Seck-ops' },
  { id: 'sec-you-riti-seck-ops', security: 'Sec-you-riti', secops: 'Seck-ops' }
]
const samples = []
for (const candidate of cases) {
  const text = `Ops Ramp's Shift-left ${candidate.secops}. ${candidate.security} tools produce findings. ${candidate.secops} investigates false positives. ${candidate.security} validates. Engineering fixes.`
  const audio = resolve(directory, `${candidate.id}.mp3`)
  const metadata = resolve(directory, `${candidate.id}.words.jsonl`)
  const receiptPath = resolve(directory, `${candidate.id}.json`)
  const receipt = existsSync(receiptPath) ? readJSON(receiptPath) : null
  if (receipt?.text !== text || receipt?.voice !== VOICE || receipt?.rate !== RATE || !existsSync(audio) || receipt.audioSha256 !== hashFile(audio)) {
    const child = spawn('uvx', ['--from', SPEECH_ENGINE, 'python', resolve(DIR, './lib/synthesize.py')], { stdio: ['pipe', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-12000) })
    const finished = new Promise((done, fail) => {
      child.on('error', fail)
      child.on('close', code => code === 0 ? done() : fail(new Error(stderr)))
    })
    child.stdin.end(JSON.stringify({ text, voice: VOICE, rate: RATE, audio, metadata }))
    await finished
  }
  const duration = durationOf(audio)
  parseWordBoundaries(readFileSync(metadata, 'utf8'), duration)
  const result = { ...candidate, text, voice: VOICE, rate: RATE, audio, duration, audioSha256: hashFile(audio), humanListeningVerified: false }
  writeFileSync(receiptPath, JSON.stringify(result, null, 2))
  samples.push(result)
  console.log(`Generated ${candidate.id}: ${duration}s`)
}
writeFileSync(resolve(directory, 'samples.json'), JSON.stringify({ samples, note: 'Alternative text-only TTS pronunciations; no human listening approval.' }, null, 2))
