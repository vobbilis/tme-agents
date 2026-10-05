// ASR pronunciation diagnostic for Hyperframes reels (lesson 42) — a local
// check of the ACTUAL narration audio; never a substitute for human
// listening. There is NO alias table here: spoken() in scenes.mjs is the
// respelling layer in this form (mirror every pair in displayCaption()).
// Reads the pack's own narrate outputs: assets/audio/NN-<id>.mp3 and
// assets/audio/voiceover.json. Writes reports/asr.json.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const AUDIO = resolve(PROJECT, 'assets/audio')
const REPORTS = resolve(PROJECT, 'reports')

const refuse = message => {
  console.error(message)
  process.exit(1)
}

const { SCENES } = await import(resolve(PROJECT, 'scenes.mjs'))
const voiceoverPath = resolve(AUDIO, 'voiceover.json')
if (!existsSync(voiceoverPath) || !SCENES.length)
  refuse('No narration to check yet — run narrate first (npm run narrate), then this diagnostic.')

const pad2 = n => String(n + 1).padStart(2, '0')
const files = SCENES.map((scene, index) => resolve(AUDIO, `${pad2(index)}-${scene.id}.mp3`))
const missing = files.filter(file => !existsSync(file))
if (missing.length)
  refuse(`Narration audio is incomplete — ${missing.length} scene file(s) missing (run npm run narrate): ${missing[0]} …`)

mkdirSync(REPORTS, { recursive: true })
const transcriptsPath = resolve(REPORTS, 'asr-transcripts.json')
// av is pinned alongside: newer PyAV removed open(metadata_errors=…) and
// crashes faster-whisper 1.2.1 (found live, 2026-10-04)
// python 3.12: av 13 ships no wheels for newer pythons and source builds fail
const asr = spawnSync('uvx', ['--python', '3.12', '--with', 'faster-whisper==1.2.1', '--with', 'av==13.1.0', 'python',
  resolve(dirname(fileURLToPath(import.meta.url)), 'transcribe-pronunciation.py'),
  ...files, '--output', transcriptsPath], { stdio: ['ignore', 'inherit', 'inherit'] })
if (asr.status !== 0)
  refuse('The speech recognizer failed — its own error is printed above. If uvx itself is missing: brew install uv. The model downloads once into reports/; audio never leaves this machine.')

const tokens = text => text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)
const transcripts = JSON.parse(readFileSync(transcriptsPath, 'utf8')).results
const results = SCENES.map((scene, index) => {
  const heard = new Set(tokens(transcripts[index]?.transcript ?? ''))
  const expected = tokens(scene.vo)
  const missingWords = [...new Set(expected.filter(word => word.length > 3 && !heard.has(word)))]
  return { id: scene.id, expected: scene.vo, transcript: transcripts[index]?.transcript ?? '',
           missingWords, audioSha256: transcripts[index]?.audioSha256 }
})
writeFileSync(resolve(REPORTS, 'asr.json'), JSON.stringify({
  checkedAt: new Date().toISOString(), model: 'base.en', localAudioOnly: true,
  humanListeningVerified: false, results
}, null, 2))

for (const scene of results.filter(r => r.missingWords.length))
  console.log(`CHECK ${scene.id}: the recognizer did not hear: ${scene.missingWords.join(', ')} — listen to that scene; a mispronunciation needs a spoken() respelling in scenes.mjs`)
console.log(`Pronunciation diagnostic written to reports/asr.json (${results.length} scenes; ${results.filter(r => r.missingWords.length).length} to listen to). This is a diagnostic — a human still listens.`)
