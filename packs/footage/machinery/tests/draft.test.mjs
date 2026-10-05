import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const sceneModule = new URL('../scenes.mjs', import.meta.url)

test('third cut uses the approved screenplay narration in scene order', async () => {
  const { SCENES } = await loadScenes()
  const screenplay = readFileSync(new URL('../../STORYBOARD_REVIEW_V3.md', import.meta.url), 'utf8')
  const narration = [...screenplay.matchAll(/^> (.+)$/gm)].map(match =>
    match[1].replace(/\bBU\b/g, 'B U').replace(/\bOPSEXT\b/g, 'O P S E X T'))
  assert.equal(narration.length, 15)
  assert.deepEqual(SCENES.map(scene => scene.vo), narration)
  for (const index of [0, 3, 4]) assert.match(SCENES[index].vo, /telemetry/i)
})

test('variable-frame-rate model excerpt starts at zero and fills its cut', async () => {
  const prepared = spawnSync(process.execPath, ['scripts/prepare-footage.mjs', '--only', 's15-2'], { encoding: 'utf8' })
  assert.equal(prepared.status, 0, prepared.stderr)
  const probe = spawnSync('/opt/homebrew/bin/ffprobe', ['-v', 'error', '-show_entries', 'stream=start_time,duration', '-of', 'json', 'assets/footage/s15-2.mp4'], { encoding: 'utf8' })
  assert.equal(probe.status, 0, probe.stderr)
  const stream = JSON.parse(probe.stdout).streams[0]
  assert.ok(Number(stream.start_time) < 1 / 30)
  const { buildTimeline } = await import('../scripts/lib/timeline.mjs')
  const { sceneShots } = await import('../scripts/lib/shots.mjs')
  const scene = buildTimeline().scenes[14]
  const shot = sceneShots(scene, scene).find(shot => shot.id === 's15-2')
  assert.ok(Math.abs(Number(stream.duration) - shot.duration) < 1 / 30)
})

test('assembled timeline follows the voice without long silent tails', async () => {
  const { buildTimeline } = await import('../scripts/lib/timeline.mjs')
  const timeline = buildTimeline()
  assert.equal(timeline.duration, 900)
  assert.equal(timeline.scenes[0].start, 0)
  for (const scene of timeline.scenes) {
    assert.equal(scene.start, scene.programStart)
    assert.ok(scene.trailingSilence >= 0)
    assert.ok(scene.trailingSilence <= 2, `${scene.id}: ${scene.trailingSilence}s tail`)
  }
})

async function loadScenes() {
  assert.ok(existsSync(sceneModule), 'The draft scene configuration must exist')
  return import(sceneModule.href)
}

test('fixed crop contains telemetry throughout scrolling and footer uses measured time', async () => {
  const { SCENES } = await loadScenes()
  const { buildTimeline } = await import('../scripts/lib/timeline.mjs')
  const { renderSubcomposition } = await import('../scripts/lib/draft-render.mjs')
  const scene = buildTimeline().scenes[3]
  const composition = renderSubcomposition(SCENES[3], scene)
  const camera = JSON.parse(composition.match(/tl.set\('#camera-s04-2', (\{[^}]+\})/)[1])
  const track = JSON.parse(readFileSync(new URL('../assets/focus.json', import.meta.url), 'utf8'))['s04-2']
  for (const { box } of track.samples.filter(sample => sample.box)) {
    assert.ok(box.y * 710 * camera.scale + camera.y >= 0)
    assert.ok((box.y + box.height) * 710 * camera.scale + camera.y <= 668)
  }
  const time = `${String(Math.floor(scene.start / 60)).padStart(2, '0')}:${String(Math.floor(scene.start % 60)).padStart(2, '0')}`
  assert.ok(composition.includes(`<span>${time} / 15:00</span>`))
})

test('third cut shows early observability and tests in execution order', async () => {
  const { buildTimeline } = await import('../scripts/lib/timeline.mjs')
  const { sceneShots } = await import('../scripts/lib/shots.mjs')
  const timeline = buildTimeline()
  for (const index of [0, 3]) {
    const scene = timeline.scenes[index]
    const observability = sceneShots(scene, scene).find(shot => shot.source.startsWith('Screen Recording') && shot.sourceStart === 22)
    assert.ok(observability, scene.id)
    assert.ok(scene.start + observability.start < 240)
  }
  const tests = timeline.scenes[9]
  assert.deepEqual(sceneShots(tests, tests).map(shot => shot.sourceStart), [375, 430, 475])
  const ticket = timeline.scenes[2]
  assert.deepEqual(sceneShots(ticket, ticket).map(shot => shot.sourceStart), [100, 430, 645])
})

test('draft renderer uses the supplied model video and focused engineering footage', async () => {
  const renderer = new URL('../scripts/lib/draft-render.mjs', import.meta.url)
  assert.ok(existsSync(renderer), 'The footage-led renderer must exist')
  const { renderSubcomposition } = await import(renderer.href)
  const { buildTimeline } = await import('../scripts/lib/timeline.mjs')
  const timeline = buildTimeline()
  const opening = renderSubcomposition(timeline.scenes[0], timeline.scenes[0])
  assert.doesNotMatch(opening, />TBD</)
  assert.match(opening, /<video/)
  const recorded = renderSubcomposition(timeline.scenes[1], timeline.scenes[1])
  assert.match(recorded, /<video/)
  assert.match(recorded, /muted/)
  assert.match(recorded, /data-start=/)
  for (const scene of timeline.scenes) {
    const composition = renderSubcomposition(scene, scene)
    assert.equal(composition.includes('class="focus-rect"'), false, scene.id)
    assert.equal(composition.includes("tl.to('#camera-"), false, scene.id)
    assert.equal(composition.includes("tl.set('#camera-"), true, scene.id)
  }
  assert.doesNotMatch(recorded, /x: -934/)
  assert.doesNotMatch(recorded, /fabricated data|ambient-orb/)
  assert.match(recorded, /Engineer 1: ticket preparation/)
  const held = renderSubcomposition(timeline.scenes[3], timeline.scenes[3])
  assert.match(held, /HELD FRAME/)
  assert.match(held, /hold-s04-2/)
})

test('source-text crop keeps the complete focus box in the evidence viewport', async () => {
  const { cameraForBox } = await import('../scripts/lib/shots.mjs')
  for (const box of [
    { x: 0.66, y: 0.2, width: 0.3, height: 0.12 },
    { x: 0.74, y: 0.65, width: 0.22, height: 0.12 },
    { x: 0.2, y: 0.1, width: 0.5, height: 0.25 }
  ]) {
    const camera = cameraForBox(box)
    assert.ok(box.x * 1168 * camera.scale + camera.x >= 0)
    assert.ok((box.x + box.width) * 1168 * camera.scale + camera.x <= 1168)
    assert.ok(box.y * 710 * camera.scale + camera.y >= 0)
    assert.ok((box.y + box.height) * 710 * camera.scale + camera.y <= 668)
  }
})

test('draft reserves exactly fifteen minutes across fifteen scenes', async () => {
  const { SCENES } = await loadScenes()
  assert.equal(SCENES.length, 15)
  assert.equal(SCENES[0].slotSeconds, 45)
  assert.equal(SCENES.reduce((total, scene) => total + scene.slotSeconds, 0), 900)
})

test('the four supplied recordings replace future capture promises', async () => {
  const { SCENES } = await loadScenes()
  assert.deepEqual(SCENES.flatMap(scene => scene.pending), [])
  assert.match(SCENES[7].vo, /Engineer three takes up the implementation/)
  for (const scene of SCENES) assert.doesNotMatch(scene.vo, /recording.*(?:still to come|will go)|Claude Code|recording arrives|recording is still/)
})

test('draft narration and reveal cues contain no unresolved placeholders', async () => {
  const { SCENES } = await loadScenes()
  for (const scene of SCENES) {
    assert.doesNotMatch(scene.vo, /\{R\d{2}_|R0[12478]|\bS\d{2}\b/)
    for (const point of scene.points) assert.ok(scene.vo.includes(point.cue), point.cue)
  }
})

test('opening explains the feature purpose and spells BU for narration', async () => {
  const { SCENES } = await loadScenes()
  assert.match(SCENES[0].vo, /Common principles/)
  assert.match(SCENES[0].vo, /enforced baseline/)
  assert.match(SCENES[0].vo, /Telemetry records execution/)
  assert.match(SCENES[0].vo, /real, recent Private Cloud/)
  assert.match(SCENES[0].vo, /six months/)
  assert.doesNotMatch(SCENES[9].vo, /supports browser testing/)
  assert.match(SCENES[0].vo, /Private Cloud B U/)
  assert.match(SCENES[0].vo, /billing and reporting/)
  assert.match(SCENES[8].vo, /Assigned Memory and State/)
})

test('Jira intent, assignment, and agent responsibilities are explicit', async () => {
  const { SCENES } = await loadScenes()
  assert.match(SCENES[1].vo, /intent/)
  assert.match(SCENES[2].vo, /required fields/)
  assert.match(SCENES[2].vo, /product or engineering manager/)
  assert.match(SCENES[2].vo, /assigns/)
  assert.doesNotMatch(SCENES[2].vo, /twelve story rows|rather than assigned/)
  assert.match(SCENES[3].vo, /feature.analysis agent/i)
  assert.match(SCENES[4].vo, /repository.level skills/)
  assert.match(SCENES[5].vo, /implementation agent/)
  for (const scene of SCENES) assert.doesNotMatch(scene.vo, /OPSEXT/)
  assert.match(SCENES[1].vo, /O P S E X T/)
})

test('delivery uses the agreed voice, profile, and explicit draft provenance', async () => {
  const { FILM } = await loadScenes()
  assert.equal(FILM.voice, 'en-US-AndrewMultilingualNeural')
  assert.equal(FILM.rate, '-12%')
  assert.equal(FILM.width, 1920)
  assert.equal(FILM.height, 1080)
  assert.equal(FILM.fps, 30)
  assert.match(FILM.sourceStatus, /DRAFT/)
  assert.doesNotMatch(FILM.sourceStatus, /fabricated reference data/i)
})