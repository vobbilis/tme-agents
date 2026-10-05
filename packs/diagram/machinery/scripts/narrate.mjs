import { spawnSync } from 'node:child_process'
import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { resolve } from 'node:path'

import { FILM, SCENES } from '../scenes.mjs'
import {
  AUDIO_DIR,
  PROJECT,
  durationOf,
  ensureDirs,
  pad2,
  projectRelative,
  readJson,
  sha256File,
  writeJson
} from './lib/project.mjs'
import {
  EDGE_TTS_VERSION,
  buildCaptions,
  parseWordBoundaries,
  serializeCaptions,
  speechFingerprint
} from './lib/speech.mjs'

ensureDirs()

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
if (args.includes('--only') && !only) throw new Error('--only requires a scene-id prefix')

const synthesize = resolve(PROJECT, 'scripts/synthesize.py')
const sceneRecords = []

for (const [index, scene] of SCENES.entries()) {
  const base = resolve(AUDIO_DIR, `${pad2(index + 1)}-${scene.id}`)
  const mp3 = `${base}.mp3`
  const words = `${base}.words.jsonl`
  const vtt = `${base}.vtt`
  const receiptPath = `${base}.speech.json`
  const fingerprint = speechFingerprint(scene.vo, FILM.voice, FILM.rate)
  const receipt = existsSync(receiptPath) ? readJson(receiptPath) : null
  const filesExist = [mp3, words, vtt].every(existsSync)
  const hashesMatch = filesExist &&
    receipt?.audioSha256 === sha256File(mp3) &&
    receipt?.wordsSha256 === sha256File(words) &&
    receipt?.captionsSha256 === sha256File(vtt)
  let current = receipt?.fingerprint === fingerprint && hashesMatch
  const wanted = !only || scene.id.startsWith(only)

  if (wanted && (force || !current)) {
    const partialAudio = `${mp3}.partial`
    const partialWords = `${words}.partial`
    for (const path of [partialAudio, partialWords]) {
      if (existsSync(path)) unlinkSync(path)
    }

    process.stdout.write(
      `${pad2(index + 1)} ${scene.id} · ${scene.vo.trim().split(/\s+/).length} words … `
    )
    const result = spawnSync(
      'uvx',
      ['--from', EDGE_TTS_VERSION, 'python', synthesize],
      {
        cwd: PROJECT,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
        input: JSON.stringify({
          text: scene.vo,
          voice: FILM.voice,
          rate: FILM.rate,
          audio: partialAudio,
          metadata: partialWords
        })
      }
    )
    if (
      result.status !== 0 ||
      !existsSync(partialAudio) ||
      !existsSync(partialWords)
    ) {
      console.log('FAILED')
      throw new Error((result.stderr || result.stdout || 'speech synthesis failed').trim())
    }

    const duration = durationOf(partialAudio)
    const boundaries = parseWordBoundaries(readFileSync(partialWords, 'utf8'), duration)
    const captions = buildCaptions(scene.vo, boundaries, duration)
    renameSync(partialAudio, mp3)
    renameSync(partialWords, words)
    writeFileSync(vtt, serializeCaptions(captions, 'vtt'))
    writeJson(receiptPath, {
      fingerprint,
      engine: EDGE_TTS_VERSION,
      boundary: 'WordBoundary',
      voice: FILM.voice,
      rate: FILM.rate,
      duration,
      audioSha256: sha256File(mp3),
      wordsSha256: sha256File(words),
      captionsSha256: sha256File(vtt)
    })
    current = true
    console.log(`${duration.toFixed(2)}s`)
  }

  const duration = current ? durationOf(mp3) : null
  sceneRecords.push({
    index: index + 1,
    id: scene.id,
    chapter: scene.chapter,
    fingerprint,
    mp3: current ? projectRelative(mp3) : null,
    words: current ? projectRelative(words) : null,
    vtt: current ? projectRelative(vtt) : null,
    receipt: current ? projectRelative(receiptPath) : null,
    duration,
    audioSha256: current ? sha256File(mp3) : null
  })
}

const complete = sceneRecords.every(scene => Number.isFinite(scene.duration))
writeJson(resolve(AUDIO_DIR, 'voiceover.json'), {
  generatedAt: new Date().toISOString(),
  voice: FILM.voice,
  rate: FILM.rate,
  engine: EDGE_TTS_VERSION,
  boundary: 'WordBoundary',
  complete,
  scenes: sceneRecords
})

const total = sceneRecords.reduce((sum, scene) => sum + (scene.duration ?? 0), 0)
console.log(
  `${sceneRecords.filter(scene => scene.duration).length}/${SCENES.length} clips ready · ` +
  `${total.toFixed(2)}s narration`
)
if (!complete && !only) {
  throw new Error('Narration is incomplete. Regenerate the missing scenes before building.')
}
