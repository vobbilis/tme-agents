import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { FILM, SCENES } from '../../scenes.mjs'
import { AUDIO_DIR, PROJECT, readJson } from './project.mjs'

export const MIN_SCENE_DURATION = 51.2
export const DEFAULT_TAIL = 3

export function estimateVoiceDuration(text) {
  return text.trim().split(/\s+/).length / 2.45
}

export function buildTimeline(voiceoverPath = resolve(AUDIO_DIR, 'voiceover.json')) {
  const voiceover = existsSync(voiceoverPath) ? readJson(voiceoverPath) : null
  const voiceById = new Map((voiceover?.scenes ?? []).map(scene => [scene.id, scene]))
  const timeline = []
  let cursor = 0

  for (const [index, scene] of SCENES.entries()) {
    const voice = voiceById.get(scene.id)
    const voiceDuration = Number.isFinite(voice?.duration)
      ? voice.duration
      : estimateVoiceDuration(scene.vo)
    const duration = Math.max(FILM.minimumSceneSeconds ?? MIN_SCENE_DURATION, voiceDuration + (scene.tail ?? DEFAULT_TAIL))
    const start = index === 0 ? 0 : cursor - FILM.transitionSeconds
    const audioStart = start + 0.35
    timeline.push({
      ...scene,
      index: index + 1,
      start,
      duration,
      end: start + duration,
      midpoint: start + duration / 2,
      audioStart,
      voiceDuration,
      trailingSilence: duration - voiceDuration - 0.35,
      audio: voice?.mp3 ? resolve(PROJECT, voice.mp3) : null,
      captions: voice?.vtt ? resolve(PROJECT, voice.vtt) : null,
      words: voice?.words ? resolve(PROJECT, voice.words) : null,
      fingerprint: voice?.fingerprint ?? null
    })
    cursor = start + duration
  }

  const duration = timeline.at(-1).end
  return {
    film: FILM,
    generatedFromAudio: Boolean(voiceover),
    narrationComplete: timeline.every(scene => scene.audio && scene.captions),
    voiceoverPath: voiceover ? voiceoverPath : null,
    duration,
    scenes: timeline,
    transitions: timeline.slice(1).map((scene, index) => ({
      from: timeline[index].id,
      to: scene.id,
      start: scene.start,
      duration: FILM.transitionSeconds
    }))
  }
}

export function reviewTimes(timeline) {
  const times = new Set([0.8, Math.max(0.8, timeline.duration - 1)])
  for (const scene of timeline.scenes) times.add(Number(scene.midpoint.toFixed(3)))
  for (const transition of timeline.transitions) {
    times.add(Number(Math.max(0, transition.start - 0.1).toFixed(3)))
    times.add(Number((transition.start + 0.2).toFixed(3)))
  }
  return [...times].sort((a, b) => a - b)
}
