// Only the speech input is respelled. Captions and cues retain SCRIPT.md exactly.
import { tokens, validateWords, speechFingerprint } from './lib/speech.mjs'
import { hash } from './production.mjs'

// Andrew expands "Sec" as "Secretary" when the old input says "Sec Ops".
// Local, unprompted audio recognition reproduced that failure in the old cut.
// "Seck-ops" keeps the intended two spoken syllables. Leave "security" intact:
// sampled syllable respellings degraded its pronunciation rather than helping.
export const PRONUNCIATION_VERSION = 'shift-left-seck-ops-2'
export const PRONUNCIATIONS = Object.freeze({ AI: 'A I', SecOps: 'Seck-ops', OpsRamp: 'Ops Ramp', SDLC: 'S D L C', API: 'A P I', HPE: 'H P E' })
export const speechUnits = text => text.trim().split(/\s+/).map(display => ({
  display,
  spoken: display.replace(/\b(?:SecOps|OpsRamp|SDLC|API|HPE|AI)\b/g, match => PRONUNCIATIONS[match])
}))
export const spokenText = text => speechUnits(text).map(unit => unit.spoken).join(' ')
export const narrationFingerprint = (text, voice, rate) => hash(JSON.stringify({
  script: text, speech: speechFingerprint(spokenText(text), voice, rate),
  pronunciationVersion: PRONUNCIATION_VERSION, aliases: PRONUNCIATIONS
}))

export function canonicalWords(text, raw, duration) {
  validateWords(raw, duration)
  const units = speechUnits(text)
  const expected = tokens(spokenText(text))
  const actual = raw.flatMap(word => tokens(word.text).map(token => ({ ...word, text: token })))
  const mismatch = expected.findIndex((token, i) => token !== actual[i]?.text)
  if (mismatch !== -1 || actual.length !== expected.length)
    throw new Error(`Spoken token mismatch at ${mismatch}: expected ${expected.slice(Math.max(0, mismatch - 2), mismatch + 5).join(' ')}; actual ${actual.slice(Math.max(0, mismatch - 2), mismatch + 5).map(w => w.text).join(' ')}`)
  let cursor = 0
  const mapped = units.map(unit => {
    const length = tokens(unit.spoken).length
    if (!length) throw new Error(`Empty speech unit ${unit.display}`)
    const word = { text: unit.display, start: actual[cursor].start, end: actual[cursor + length - 1].end }
    cursor += length
    return word
  })
  return validateWords(mapped, duration)
}

export const serializeWords = words => words.map(word => JSON.stringify({
  type: 'WordBoundary', text: word.text, offset: Math.round(word.start * 10_000_000),
  duration: Math.round((word.end - word.start) * 10_000_000)
})).join('\n') + '\n'
