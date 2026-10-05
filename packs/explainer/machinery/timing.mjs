import { tokens, findCue, buildCaptions, validateWords, validateCaptions } from './lib/speech.mjs'
import { SCENES, FPS, VOICE_OFFSET, MIN_DURATION, MAX_DURATION, DISSOLVE_FRAMES, VERSION, SIZE } from './story.mjs'

export function checkScript(scenes = SCENES) {
  if (scenes.length === 0) throw new Error('No chapters — SCRIPT.md and story.mjs spec are empty or out of step')
  for (const scene of scenes) {
    if (scene.cues.length !== 3 || scene.captions.length !== 4) throw new Error(`Expected four phases: ${scene.id}`)
    const words = tokens(scene.vo).map((text, i) => ({ text, start: i, end: i + .5 }))
    const cues = scene.cues.map(phrase => findCue(words, phrase))
    if (cues.some((cue, i) => i && cue.start <= cues[i - 1].start)) throw new Error(`Out-of-order cues: ${scene.id}`)
  }
  return { chapters: scenes.length, cues: scenes.reduce((n, s) => n + s.cues.length, 0), words: scenes.reduce((n, s) => n + s.words, 0) }
}

export function makeTimeline(narrations, { enforceDuration = true } = {}) {
  checkScript()
  if (narrations.length !== SCENES.length) throw new Error('Incomplete narration')
  let cursor = 0
  const captions = []
  const scenes = SCENES.map((scene, i) => {
    const audio = narrations[i]
    if (audio.id !== scene.id) throw new Error('Narration order mismatch')
    validateWords(audio.words, audio.duration)
    const frameCount = Math.ceil((VOICE_OFFSET + audio.duration + scene.tail) * FPS)
    const startFrame = cursor
    const endFrame = startFrame + frameCount
    const cues = scene.cues.map(phrase => {
      // Do not use the old helper's .35-second offset or .07-second cue lead.
      const found = findCue(audio.words, phrase)
      const voiceTime = startFrame / FPS + VOICE_OFFSET + found.start
      const frame = Math.round(voiceTime * FPS)
      return { phrase, voiceTime, frame, time: frame / FPS, wordIndex: found.wordIndex,
        error: frame / FPS - voiceTime }
    })
    if (cues.some((cue, j) => j && cue.frame <= cues[j - 1].frame)) throw new Error(`Collapsed cue windows: ${scene.id}`)
    const frames = [startFrame, ...cues.map(cue => cue.frame)]
    const phases = frames.map((frame, phase) => {
      const end = frames[phase + 1] ?? endFrame
      // The close is continuous motion, not four narrated slides. Its short
      // internal intervals only need enough frames for their time-derived move;
      // the first nine chapters retain the original reading/dissolve allowance.
      const minimumFrames = scene.animation ? Math.ceil(.55 * FPS) : DISSOLVE_FRAMES + FPS
      if (end - frame < minimumFrames) throw new Error(`Picture state too short: ${scene.id}-${phase}`)
      return { id: `${scene.id}-${phase}`, phase, startFrame: frame, endFrame: end,
        start: frame / FPS, end: end / FPS, duration: (end - frame) / FPS,
        plate: `plates/${scene.id}-${phase}.png`, caption: scene.captions[phase] }
    })
    const offset = startFrame / FPS + VOICE_OFFSET
    captions.push(...buildCaptions(scene.vo, audio.words, audio.duration).map(caption => ({
      ...caption, start: caption.start + offset, end: caption.end + offset
    })))
    cursor = endFrame
    return { id: scene.id, title: scene.title, act: scene.act, startFrame, endFrame,
      start: startFrame / FPS, end: endFrame / FPS, duration: frameCount / FPS,
      frameCount, voiceStart: offset, voiceDuration: audio.duration, tail: scene.tail,
      animation: scene.animation ?? null,
      cues, phases, audioSha256: audio.audioSha256, narrationFingerprint: audio.fingerprint,
      audio: audio.mp3 }
  })
  const duration = cursor / FPS
  const ending = scenes.at(-1)
  if (ending.animation && (ending.duration > 12 || ending.duration < 6))
    throw new Error(`The crisp closing must stay within 6–12 seconds; got ${ending.duration.toFixed(3)}s`)
  if (enforceDuration && (duration < MIN_DURATION || duration > MAX_DURATION))
    throw new Error(`Reel must be ${MIN_DURATION}–${MAX_DURATION}s; actual narration requires ${duration.toFixed(3)}s`)
  validateCaptions(captions, duration)
  const phases = scenes.flatMap(scene => scene.phases)
  const transitions = phases.slice(1).map((phase, i) => ({
    from: phases[i].id, to: phase.id, midpointFrame: phase.startFrame,
    startFrame: phase.startFrame - DISSOLVE_FRAMES / 2,
    endFrame: phase.startFrame + DISSOLVE_FRAMES / 2,
    frames: DISSOLVE_FRAMES, midpoint: phase.start,
    kind: phase.phase === 0 ? 'chapter' : 'reveal'
  })).filter(transition => !(scenes.at(-1).animation && transition.to.startsWith(scenes.at(-1).id) && transition.kind === 'reveal'))
  return { version: VERSION, fps: FPS, size: SIZE, frameCount: cursor, duration,
    voiceOffset: VOICE_OFFSET, dissolveFrames: DISSOLVE_FRAMES, scenes, phases, transitions, captions }
}

// Rendering uses stable holds plus short blends. Every nominal frame belongs
// to exactly one segment; adding transitions does not shorten the voice edit.
export function pictureSegments(timeline) {
  const pieces = []
  let cursor = 0
  let current = timeline.phases[0].id
  for (const t of timeline.transitions) {
    if (t.startFrame > cursor) pieces.push({ kind: 'hold', plate: current, startFrame: cursor, frames: t.startFrame - cursor })
    pieces.push({ kind: 'dissolve', from: current, to: t.to, startFrame: t.startFrame, frames: t.frames })
    cursor = t.endFrame
    current = t.to
  }
  const closing = timeline.scenes.at(-1)
  if (cursor < timeline.frameCount) pieces.push(closing.animation
    ? { kind: 'animation', scene: closing.id, startFrame: cursor, localStartFrame: cursor - closing.startFrame, frames: timeline.frameCount - cursor }
    : { kind: 'hold', plate: current, startFrame: cursor, frames: timeline.frameCount - cursor })
  if (pieces.reduce((n, p) => n + p.frames, 0) !== timeline.frameCount) throw new Error('Picture segment duration mismatch')
  return pieces.map((piece, i) => ({ ...piece, index: i, duration: piece.frames / timeline.fps }))
}
