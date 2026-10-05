import assert from 'node:assert/strict'
import test from 'node:test'

import { validateCaptureConfig } from '../scripts/lib/capture.mjs'

const valid = () => ({
  name: 'private-integrations',
  sourceWorktree: '/tmp/pinned-source',
  sourceCommit: 'a'.repeat(40),
  baseUrl: 'http://127.0.0.1:5173',
  dataClassification: 'fabricated',
  shots: [{
    id: 'review-page',
    route: '/setup/integrations/review',
    ready: '[data-testid="review"]',
    proof: ['review state is visible']
  }]
})

test('capture config accepts a local fabricated-data source', () => {
  assert.equal(validateCaptureConfig(valid()).name, 'private-integrations')
})

test('capture config rejects remote source servers by default', () => {
  const config = valid()
  config.baseUrl = 'https://example.invalid'
  assert.throws(() => validateCaptureConfig(config), /remote capture is disabled/)
})

test('capture config rejects non-fabricated data', () => {
  const config = valid()
  config.dataClassification = 'customer'
  assert.throws(() => validateCaptureConfig(config), /fabricated data only/)
})

test('capture config requires an exact source commit', () => {
  const config = valid()
  config.sourceCommit = 'main'
  assert.throws(() => validateCaptureConfig(config), /40-character sourceCommit/)
})

test('capture config rejects duplicate shot identities', () => {
  const config = valid()
  config.shots.push({ ...config.shots[0] })
  assert.throws(() => validateCaptureConfig(config), /duplicate capture shot id/)
})

test('every captured shot must state what it proves', () => {
  const config = valid()
  config.shots[0].proof = []
  assert.throws(() => validateCaptureConfig(config), /needs proof statements/)
})
