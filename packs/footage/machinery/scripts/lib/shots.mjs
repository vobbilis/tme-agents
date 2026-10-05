import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { AUDIO_DIR, PROJECT, pad2 } from './project.mjs'
import { parseWordBoundaries, tokens } from './speech.mjs'

const analysis = 'analysis.mov'
const delivery = 'deliver.mov'
const jira = 'jira-creation.mov'
const modelFiles = readdirSync(resolve(PROJECT, '..')).filter(name => name.startsWith('Screen Recording') && name.endsWith('.mov'))
if (modelFiles.length !== 1) throw new Error('Select exactly one operating-model source recording')
const model = modelFiles[0]
export function cameraForBox(box) {
  const scale = Math.min(2.6, 0.88 / box.width, 0.68 / box.height)
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))
  return {
    scale,
    x: clamp(584 - (box.x + box.width / 2) * 1168 * scale, 1168 * (1 - scale), 0),
    y: clamp(334 - (box.y + box.height / 2) * 710 * scale, 710 * (1 - scale), 0)
  }
}

const sources = {
  s01: [[model, 0], [model, 22, true], [jira, 655]],
  s02: [[jira, 645], [jira, 655], [analysis, 475]],
  s03: [[jira, 100], [jira, 430], [jira, 645]],
  s04: [[analysis, 42, false, 'Engineer two sets'], [analysis, 104, false, 'State retains'], [model, 22, true, 'Telemetry records how the flow executes'], [analysis, 149, false, 'The feature-analysis agent loads']],
  s05: [[analysis, 550], [analysis, 707], [analysis, 735]],
  s06: [[analysis, 944], [analysis, 968], [analysis, 986]],
  s07: [[analysis, 900], [analysis, 1080], [analysis, 1560]],
  s08: [[analysis, 1600], [delivery, 140], [delivery, 215]],
  s09: [[delivery, 215], [delivery, 245], [delivery, 350]],
  s10: [[delivery, 375], [delivery, 430], [delivery, 475]],
  s11: [[delivery, 663], [delivery, 710], [delivery, 745]],
  s12: [[delivery, 1220], [delivery, 1240], [delivery, 1300]],
  s13: [[delivery, 1420], [delivery, 1460], [delivery, 1530]],
  s14: [[delivery, 350], [delivery, 475], [delivery, 1530]],
  s15: [[model, 0], [model, 8, true], [model, 17, true]]
}

export function resolvePoints(scene, timing) {
  const wordFile = resolve(AUDIO_DIR, `${pad2(timing.index)}-${scene.id}.words.jsonl`)
  const words = existsSync(wordFile)
    ? parseWordBoundaries(readFileSync(wordFile, 'utf8'), timing.voiceDuration)
        .flatMap(word => tokens(word.text).map(text => ({ text, start: word.start })))
    : tokens(scene.vo).map((text, index, all) => ({ text, start: index / all.length * timing.voiceDuration }))
  return scene.points.map(point => {
    const phrase = tokens(point.cue)
    const matches = words.flatMap((word, index) => phrase.every((part, offset) => words[index + offset]?.text === part) ? [index] : [])
    if (matches.length !== 1) throw new Error(`${scene.id}: cue must resolve once: ${point.cue}`)
    return { ...point, at: 0.35 + words[matches[0]].start }
  })
}

export function sceneShots(scene, timing) {
  const source = sources[scene.id]
  if (!source) return [{ id: `${scene.id}-tbd`, start: 0, duration: timing.duration, pending: true }]
  const points = resolvePoints({ ...scene, points: source.map((entry, index) => ({ cue: entry[3] ?? scene.points[index].cue })) }, timing)
  return source.map((entry, index) => {
    const start = index === 0 ? 0 : Math.round(points[index].at * 30) / 30
    const end = index === source.length - 1 ? timing.duration : Math.round(points[index + 1].at * 30) / 30
    return {
      id: `${scene.id}-${index}`, start, duration: end - start,
      pending: !entry, source: entry?.[0], sourceStart: entry?.[1],
      holdLastFrame: entry?.[2] === true,
      owner: entry?.[0] === jira ? 'Engineer 1: ticket preparation' : entry?.[0] === analysis ? 'Engineer 2: analysis and planning' : entry?.[0] === delivery ? 'Engineer 3: implementation and delivery' : 'Operating model',
      asset: entry ? `assets/footage/${scene.id}-${index}.mp4` : null
    }
  })
}