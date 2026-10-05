// production/scripts/lib/shots.mjs — the edit decision list.
// Replace the reference file's `sources` map, owner labels and model-file
// selection with yours. Keep cameraForBox, resolvePoints and sceneShots.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { AUDIO_DIR, PROJECT, pad2 } from './project.mjs'
import { parseWordBoundaries, tokens } from './speech.mjs'

// Raw recordings live one level above production/ and are never committed.
const actor1 = '<actor-1>.mov'      // e.g. jira-creation.mov
const actor2 = '<actor-2>.mov'      // e.g. analysis.mov
const actor3 = '<actor-3>.mov'      // e.g. deliver.mov
const modelFiles = readdirSync(resolve(PROJECT, '..')).filter(name => name.startsWith('<model-capture-prefix>') && name.endsWith('.mov'))
if (modelFiles.length !== 1) throw new Error('Select exactly one operating-model source recording')
const model = modelFiles[0]

// Source-strip actor labels. Recordings identify who did what; they do not
// show a filmed handover. Keep "Engineer N: <phase>" wording.
const OWNERS = new Map([
  [actor1, 'Engineer 1: <phase>'],
  [actor2, 'Engineer 2: <phase>'],
  [actor3, 'Engineer 3: <phase>'],
  [model, 'Operating model']
])

// One fixed crop of the 1168×710 well around a normalised box (0–1).
export function cameraForBox(box) {
  const scale = Math.min(2.6, 0.88 / box.width, 0.68 / box.height)
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))
  return {
    scale,
    x: clamp(584 - (box.x + box.width / 2) * 1168 * scale, 1168 * (1 - scale), 0),
    y: clamp(334 - (box.y + box.height / 2) * 710 * scale, 710 * (1 - scale), 0)
  }
}

// Per scene: one excerpt per right-panel point (or more, with cue overrides).
//   [recording, startSeconds, holdLastFrame?, cueOverride?]
// The cut to excerpt n happens when the narrator reaches point n's cue
// (or the override phrase). Start seconds are chosen against MOTION in the
// original, not from the screenplay's lookup windows.
const sources = {
  s01: [[model, 0], [model, 22, true], [actor1, 655]],
  s02: [[actor1, 645], [actor1, 655], [actor2, 475]],
  s03: [[actor1, 100], [actor1, 430], [actor1, 645]],
  s04: [[actor2, 42, false, '<cue 1>'], [actor2, 104, false, '<cue 2>'], [model, 22, true, '<mid-scene phrase>'], [actor2, 149, false, '<cue 3>']],
  s05: [[actor2, 550], [actor2, 707], [actor2, 735]],
  s06: [[actor2, 944], [actor2, 968], [actor2, 986]],
  s07: [[actor2, 900], [actor2, 1080], [actor2, 1560]],
  s08: [[actor2, 1600], [actor3, 140], [actor3, 215]],        // the handoff: recording changes mid-scene
  s09: [[actor3, 215], [actor3, 245], [actor3, 350]],
  s10: [[actor3, 375], [actor3, 430], [actor3, 475]],
  s11: [[actor3, 663], [actor3, 710], [actor3, 745]],         // failure → inspection → repair/rerun
  s12: [[actor3, 1220], [actor3, 1240], [actor3, 1300]],
  s13: [[actor3, 1420], [actor3, 1460], [actor3, 1530]],
  s14: [[actor3, 350], [actor3, 475], [actor3, 1530]],        // reprises of real artifacts
  s15: [[model, 0], [model, 8, true], [model, 17, true]]
}

// Exclusion ranges belong in prepare-footage.mjs as hard failures, e.g.
//   if (shot.source === actor2 && shot.sourceStart < 1320 && shot.sourceStart + shot.duration > 1200) throw …
// Copy the two reference guards there and edit the file names and seconds.

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
      owner: OWNERS.get(entry?.[0]) ?? 'Operating model',
      asset: entry ? `assets/footage/${scene.id}-${index}.mp4` : null
    }
  })
}

// prepare-focus.mjs needs one OCR target list per shot id — regex alternatives
// of text the narration names, e.g.
//   's11-0': 'validator|schema|exits 1|scope drift',
// and a per-source minimumX (0.64 for a right-hand chat column, 0.12 for a
// Jira page, 0.10 for a full-width page). Edit the `targets` map there.
