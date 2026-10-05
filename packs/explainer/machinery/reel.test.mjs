import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { SCENES, TITLE, WORD_COUNT, VOICE_OFFSET, FPS } from './story.mjs'
import { palette, illustration } from './illustrations.mjs'
import { contrast, checkPreserved } from './production.mjs'
import { canonicalWords, spokenText, narrationFingerprint } from './pronunciation.mjs'
import { checkScript, makeTimeline, pictureSegments } from './timing.mjs'
import { tokens } from './lib/speech.mjs'
import { closingState, closingPhaseState, closingMotionWindows, closingMotionSamples } from './closing-motion.mjs'

const fakeNarration = () => SCENES.map(scene => {
  const units = scene.vo.split(/\s+/)
  return { id: scene.id, mp3: `${scene.id}.mp3`, fingerprint: 'test', audioSha256: 'test',
    words: units.map((text, i) => ({ text, start: .1 + i * .42, end: .1 + i * .42 + .34 })),
    duration: units.length * .42 + .3 }
})

test('ten chapters, forty phases, thirty unique ordered canonical cues', () => {
  assert.deepEqual(checkScript(), { chapters: 10, cues: 30, words: WORD_COUNT })
  assert.equal(WORD_COUNT, 682)
  const bad = structuredClone(SCENES)
  bad[0].cues[1] = bad[0].cues[0]
  assert.throws(() => checkScript(bad), /order/)
})

test('all forty phases are valid standalone XML, without bare data-fit attributes', () => {
  for (const scene of SCENES) for (let phase = 0; phase < 4; phase++) {
    const svg = illustration(scene, phase)
    assert.doesNotMatch(svg, /data-fit\s/)
    const parsed = spawnSync('xmllint', ['--noout', '-'], { input: svg, encoding: 'utf8' })
    assert.equal(parsed.status, 0, `${scene.id}-${phase}: ${parsed.stderr}`)
  }
})

test('semantic connectors exceed 3:1; all semantic text colors exceed 4.5:1', () => {
  for (const theme of ['dark', 'light']) {
    const p = palette(theme)
    assert.ok(contrast(p.connector, p.bg) >= 3)
    for (const color of ['ink', 'muted', 'green', 'amber', 'blue'])
      assert.ok(contrast(p[color], p.bg) >= 4.5, `${theme}/${color}`)
  }
})

test('the same hypothetical record exists from 04D through 07D', () => {
  for (const scene of SCENES.slice(3, 7)) {
    for (let phase = scene.index === 3 ? 3 : 0; phase < 4; phase++) {
      const svg = illustration(scene, phase)
      assert.match(svg, /id="evidence-record" data-record="hypothetical-permissions"/)
      assert.match(svg, /HYPOTHETICAL · PERMISSIONS QUESTION/)
      assert.match(svg, /Can a read-only user change a protected setting\?/)
    }
  }
})

test('risk prioritization and agent-vs-human ownership corrections are present', () => {
  assert.match(SCENES[5].vo, /prioritize actionable issues using risk and evidence/)
  assert.match(illustration(SCENES[5], 3), /Agent: reproduce \+ test/)
  assert.match(illustration(SCENES[5], 3), /Evidence for Security review/)
  assert.equal(SCENES[7].headline[0], 'Earlier feedback.')
  assert.doesNotMatch(illustration(SCENES[9], 3), /The story leads into/)
})

test('pronunciation respelling preserves canonical script and caption tokens', () => {
  const text = 'AI-First uses SecOps and API checks.'
  assert.equal(spokenText(text), 'A I-First uses Seck-ops and A P I checks.')
  const raw = tokens(spokenText(text)).map((text, i) => ({ text, start: i * .25, end: i * .25 + .2 }))
  const words = canonicalWords(text, raw, raw.length * .25)
  assert.equal(words.map(w => w.text).join(' '), text)
  assert.notEqual(narrationFingerprint(text, 'a', '+2%'), narrationFingerprint(text + ' More.', 'a', '+2%'))
  const wrong = structuredClone(raw)
  wrong[1].text = 'wrong'
  assert.throws(() => canonicalWords(text, wrong, raw.length * .25), /mismatch/)
})

test('SecOps no longer uses the ambiguous Sec abbreviation and security stays natural', () => {
  const text = "OpsRamp's Shift-left SecOps. Security validates. Security's review covers security."
  const spoken = spokenText(text)
  assert.equal(spoken, "Ops Ramp's Shift-left Seck-ops. Security validates. Security's review covers security.")
  assert.doesNotMatch(spokenText(SCENES.map(s => s.vo).join(' ')), /\bSec Ops\b|secretary/i)
  const raw = tokens(spoken).map((text, i) => ({ text, start: i * .25, end: i * .25 + .2 }))
  const words = canonicalWords(text, raw, raw.length * .25)
  assert.equal(words.map(w => w.text).join(' '), text)
  assert.equal(words[0].text, "OpsRamp's")
  assert.equal(words[2].text, 'SecOps.')
})

test('opening names OpsRamp shift-left SecOps and ties security work to the regular pipeline', () => {
  assert.equal(TITLE, "OpsRamp's Shift-left SecOps")
  assert.ok(SCENES[0].vo.startsWith(TITLE + '.'))
  assert.deepEqual(SCENES[0].headline, ["OpsRamp's", 'Shift-left SecOps.'])
  assert.match(SCENES[0].vo, /starts at design.*commit and build/)
  assert.match(SCENES[0].vo, /regular AI-First SDLC workflow/)
  assert.match(SCENES[0].vo, /Vulnerability scanning, fixing, and verification become part of the development pipeline/)
  assert.match(SCENES[2].vo, /regular AI-First SDLC loop/)
  assert.match(SCENES[2].vo, /scanning, remediation, and regression tests in the regular commit and build pipeline/)
  assert.match(illustration(SCENES[2], 3), /PART OF THE REGULAR DEVELOPMENT PIPELINE/)
  assert.match(SCENES[9].vo, /Shift security left, and build it into the way you develop/)
})

test('actual timing uses the new .40-second offset and frame-rounded cues', () => {
  const narration = fakeNarration()
  const t = makeTimeline(narration)
  assert.equal(t.voiceOffset, .4)
  assert.equal(t.scenes[0].voiceStart, VOICE_OFFSET)
  assert.equal(t.scenes.length, 10)
  assert.equal(t.phases.length, 40)
  assert.equal(t.transitions.length, 36)
  assert.ok(t.scenes.flatMap(s => s.cues).every(c => Math.abs(c.error) <= .5 / FPS + 1e-10))
  assert.equal(tokens(t.captions.map(c => c.text).join(' ')).join(' '), tokens(SCENES.map(s => s.vo).join(' ')).join(' '))
  assert.ok(t.scenes[2].phases[3].duration > 8, 'human ownership must have a readable final hold')
})

test('holds, dissolves, and the closing animation partition every encoded frame', () => {
  const t = makeTimeline(fakeNarration())
  const segments = pictureSegments(t)
  assert.equal(segments.filter(s => s.kind === 'hold').length, 36)
  assert.equal(segments.filter(s => s.kind === 'dissolve').length, 36)
  assert.equal(segments.filter(s => s.kind === 'animation').length, 1)
  assert.equal(segments.at(-1).scene, '10-shift-left')
  assert.equal(segments.at(-1).localStartFrame, 5)
  assert.equal(segments.reduce((n, s) => n + s.frames, 0), t.frameCount)
  for (let i = 1; i < segments.length; i++)
    assert.equal(segments[i].startFrame, segments[i - 1].startFrame + segments[i - 1].frames)
})

test('standalone closing completes the story without a demonstration handoff', () => {
  const scene = SCENES.at(-1)
  assert.equal(scene.animation, 'shift-left')
  assert.equal(scene.tail, 1.2)
  assert.equal(scene.words, 14)
  assert.ok(scene.vo.endsWith('build it into the way you develop.'))
  assert.doesNotMatch(scene.vo + scene.captions.join(' ') + illustration(scene, 3), /let us show|let.s show|walkthrough|separate demo|now.{0,10}show/i)
  assert.match(illustration(scene, 3), /Release/)
  assert.match(illustration(scene, 3), /Security\. Built in\./)
  assert.doesNotMatch(illustration(scene, 3), /VULNERABILITY SCANNING|Engineering owns the change/)
})

test('shift-left animation moves monotonically left, extends coverage, and is seek-safe', () => {
  const scene = makeTimeline(fakeNarration()).scenes.at(-1)
  const windows = closingMotionWindows(scene)
  const start = closingState(0, scene), end = closingState(scene.duration, scene)
  assert.deepEqual(start, closingPhaseState(0))
  assert.deepEqual(end, closingPhaseState(3))
  let previous = 0
  for (let t = 0; t <= scene.duration; t += 1 / FPS) {
    const state = closingState(t, scene)
    assert.ok(state.shift >= previous)
    previous = state.shift
    for (const key of ['shift', 'flow', 'hero']) assert.ok(state[key] >= 0 && state[key] <= 1)
  }
  const mid = windows[0].start + windows[0].duration / 2
  const first = closingState(mid, scene)
  closingState(scene.duration, scene)
  assert.deepEqual(closingState(mid, scene), first)
  assert.ok(Math.abs(first.shift - .5) < 1e-12)
  assert.equal(closingMotionSamples(scene).length, 17)
  const svg = illustration(SCENES.at(-1), first.phase, { motion: first })
  const x = Number(svg.match(/id="security-marker" data-x="([^"]+)"/)[1])
  assert.ok(Math.abs(x - 960) < 1e-9)
})

test('timeline rejects missing or reordered narration and films outside five to six minutes', () => {
  const narration = fakeNarration()
  assert.throws(() => makeTimeline(narration.slice(1)), /Incomplete/)
  const wrong = structuredClone(narration)
  wrong.reverse()
  assert.throws(() => makeTimeline(wrong), /order/)
  const tooLong = structuredClone(narration)
  for (const s of tooLong) s.duration += 20
  assert.throws(() => makeTimeline(tooLong), /300–360|crisp closing/)
})

test('closing stays short, with enough movement time and a brief final hold', () => {
  const scene = makeTimeline(fakeNarration()).scenes.at(-1)
  assert.ok(scene.duration >= 6 && scene.duration <= 12)
  assert.ok(scene.tail <= 1.5)
  assert.ok(scene.phases.at(-1).duration >= 1.5)
  for (const motion of closingMotionWindows(scene)) {
    const phase = scene.phases[motion.phase]
    assert.ok(motion.duration > 0 && motion.duration <= phase.duration * .42 + 1e-9)
  }
})

test('two source inputs and three earlier films match frozen pre-production hashes', () => {
  const preserved = checkPreserved()
  assert.equal(preserved.length, 5)
  assert.ok(preserved.every(p => p.unchanged))
})
