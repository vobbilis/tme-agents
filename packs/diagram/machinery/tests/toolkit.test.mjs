import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import { FILM, SCENES } from '../scenes.mjs'
import {
  compositionFingerprint,
  PROJECT,
  readJson,
  sha256File
} from '../scripts/lib/project.mjs'
import {
  buildCaptions,
  canonicalTokens,
  displayCaption,
  parseCaptions,
  parseWordBoundaries,
  serializeCaptions,
  speechFingerprint
} from '../scripts/lib/speech.mjs'
import { buildTimeline, reviewTimes } from '../scripts/lib/timeline.mjs'
import {
  renderIndex,
  renderMotionSidecar,
  renderStoryboard,
  renderSubcomposition
} from '../scripts/lib/render-scene.mjs'

test('the reel is a twenty-chapter, ten-minute-plus story', () => {
  const timeline = buildTimeline(resolve(PROJECT, 'assets/audio/not-generated.json'))
  assert.equal(SCENES.length, 20)
  assert.ok(timeline.duration >= FILM.minimumDurationSeconds)
  assert.equal(timeline.transitions.length, SCENES.length - 1)
  assert.equal(new Set(SCENES.map(scene => scene.id)).size, SCENES.length)
})

test('transition overlap and narration lead are derived once', () => {
  const timeline = buildTimeline(resolve(PROJECT, 'assets/audio/not-generated.json'))
  for (const [index, scene] of timeline.scenes.entries()) {
    assert.equal(scene.audioStart, scene.start + 0.35)
    if (index) {
      assert.ok(
        Math.abs(
          scene.start -
          (timeline.scenes[index - 1].end - FILM.transitionSeconds)
        ) < 1e-9
      )
    }
  }
})

test('review times include every midpoint and both sides of every seam', () => {
  const timeline = buildTimeline(resolve(PROJECT, 'assets/audio/not-generated.json'))
  const times = reviewTimes(timeline)
  for (const scene of timeline.scenes)
    assert.ok(times.includes(Number(scene.midpoint.toFixed(3))))
  assert.ok(times.length >= SCENES.length + timeline.transitions.length * 2)
})

test('the HPE Control Plane deck does not enter audience-facing narration', () => {
  assert.ok(SCENES.every(scene => !/control plane/i.test(scene.vo)))
  const brief = readFileSync(resolve(PROJECT, 'BRIEF.md'), 'utf8')
  assert.match(brief, /terminology and big-picture context only/)
  assert.match(brief, /does not supply this reel's claims/)
})

test('storyboard and compositions carry the declared motion and local assets', () => {
  const timeline = buildTimeline(resolve(PROJECT, 'assets/audio/not-generated.json'))
  const storyboard = renderStoryboard(timeline)
  assert.equal((storyboard.match(/^## Frame /gm) ?? []).length, SCENES.length)
  assert.doesNotMatch(storyboard, /control-target-sync/)
  const index = renderIndex(timeline)
  assert.match(index, /assets\/vendor\/gsap\.min\.js/)
  assert.doesNotMatch(index, /https?:\/\//)

  const scene = timeline.scenes[0]
  const html = renderSubcomposition(SCENES[0], scene)
  assert.match(html, new RegExp(`data-composition-id="${SCENES[0].id}"`))
  assert.match(html, new RegExp(`window\\.__timelines\\['${SCENES[0].id}'\\]`))
  assert.doesNotMatch(html, /Math\.random|Date\.now|repeat:\s*-1/)
  const motion = renderMotionSidecar(SCENES[0], scene)
  assert.equal(motion.duration, Number(scene.duration.toFixed(3)))
  assert.ok(motion.assertions.some(item => item.kind === 'keepsMoving'))
})

test('speech fingerprint binds text, voice, rate, and engine', () => {
  const one = speechFingerprint('One line.', FILM.voice, FILM.rate)
  assert.notEqual(one, speechFingerprint('Another line.', FILM.voice, FILM.rate))
  assert.notEqual(one, speechFingerprint('One line.', FILM.voice, '+3%'))
})

test('word-boundary captions round-trip with two-line limits', () => {
  const text = 'A repeatable reel starts with one approved story and ends with verified evidence.'
  const words = text.split(/\s+/).map((word, index) => ({
    type: 'WordBoundary',
    text: word,
    offset: index * 5_000_000,
    duration: 4_000_000
  }))
  const boundaries = parseWordBoundaries(
    words.map(word => JSON.stringify(word)).join('\n'),
    8
  )
  const captions = buildCaptions(text, boundaries, 8)
  assert.ok(captions.every(caption =>
    caption.text.split('\n').length <= 2 &&
    caption.text.split('\n').every(line => line.length <= 42)
  ))
  const encoded = serializeCaptions(captions, 'srt')
  assert.deepEqual(
    canonicalTokens(parseCaptions(encoded).map(item => item.text).join(' ')),
    canonicalTokens(text)
  )
})

test('punctuation-only speech boundaries are ignored', () => {
  const boundaries = parseWordBoundaries([
    { type: 'WordBoundary', text: 'H', offset: 0, duration: 2_000_000 },
    { type: 'WordBoundary', text: '.', offset: 2_000_000, duration: 1_000_000 },
    { type: 'WordBoundary', text: '264', offset: 3_000_000, duration: 4_000_000 }
  ].map(word => JSON.stringify(word)).join('\n'), 1)

  assert.deepEqual(boundaries.map(boundary => boundary.text), ['H', '264'])
})

test('display captions normalize letter-spaced abbreviations', () => {
  assert.equal(
    displayCaption('H P E uses the exact A P I in the S D L C.'),
    'HPE uses the exact API in the SDLC.'
  )
})

test('asset receipts match the vendored bytes', () => {
  const manifest = readJson(resolve(PROJECT, 'assets/manifest.json'))
  for (const asset of manifest.assets)
    assert.equal(sha256File(resolve(PROJECT, asset.path)), asset.sha256)
  const receipt = readJson(
    resolve(PROJECT, 'assets/reference/private-integrations.receipt.json')
  )
  assert.equal(
    sha256File(resolve(PROJECT, 'assets/reference/private-integrations.png')),
    receipt.sha256
  )
  assert.equal(receipt.fabricatedData, true)
})

test('composition fingerprint is deterministic', () => {
  assert.equal(compositionFingerprint(), compositionFingerprint())
})
