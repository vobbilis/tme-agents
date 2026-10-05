// A deterministic, seek-safe close. No clock, CSS animation, randomness, or
// external animation framework; every attribute is a function of one time.
export const CLOSING_MOTION_VERSION = 'shift-left-crisp-close-2'
const clamp = x => Math.max(0, Math.min(1, x))
const ease = x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2

export function closingMotionWindows(scene) {
  if (scene.phases.length !== 4) throw new Error('The closing needs four picture phases')
  const preferred = [1.05, .75, .4]
  return scene.phases.slice(1).map((phase, i) => ({
    id: ['shift-left', 'connect-pipeline', 'resolve-title'][i],
    start: phase.start - scene.start,
    duration: Math.min(preferred[i], phase.duration * .42),
    phase: i + 1
  }))
}

export function closingState(time, scene) {
  const windows = closingMotionWindows(scene)
  const progress = windows.map(w => ease(clamp((time - w.start) / w.duration)))
  const phase = Math.max(0, ...windows.filter(w => time >= w.start).map(w => w.phase))
  return { phase, shift: progress[0], flow: progress[1], hero: progress[2] }
}

export const closingPhaseState = phase => ({ phase, shift: phase >= 1 ? 1 : 0,
  flow: phase >= 2 ? 1 : 0, hero: phase >= 3 ? 1 : 0 })

export function closingMotionSamples(scene) {
  const windows = closingMotionWindows(scene)
  const samples = [{ id: 'opening', localTime: .2 }]
  for (const window of windows) for (const progress of [0, .25, .5, .75, 1]) {
    // Quantize to the same 30fps frame positions used by the encoder.
    const localFrame = Math.round((window.start + window.duration * progress) * 30)
    samples.push({ id: `${window.id}-${Math.round(progress * 100)}`, localTime: localFrame / 30 })
  }
  samples.push({ id: 'final-hold', localTime: scene.duration - .2 })
  return samples
}
