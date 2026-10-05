import { createHash } from 'node:crypto'

export const SPEECH_ENGINE = 'edge-tts==7.2.8'
export const VOICE_OFFSET = 0.35
export const CUE_LEAD = 0.07

export function speechFingerprint(text, voice, rate) {
  return createHash('sha256')
    .update(JSON.stringify({ text, voice, rate, engine: SPEECH_ENGINE, boundary: 'WordBoundary' }))
    .digest('hex')
}

export function tokens(text) {
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll('’', "'")
    .replaceAll('&amp;', ' and ')
    .replaceAll('&', ' and ')
    .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? []
}

function tokenTimeline(words) {
  return words.flatMap((word, index) =>
    tokens(word.text).map(text => ({ ...word, text, index }))
  )
}

export function validateWords(words, duration) {
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error('invalid narration duration')
  if (!words.length) throw new Error('no word boundaries in speech metadata')
  let previousEnd = 0
  for (const word of words) {
    if (
      !tokens(word.text).length ||
      !Number.isFinite(word.start) ||
      !Number.isFinite(word.end) ||
      word.start < 0 ||
      word.end <= word.start ||
      word.end > duration + 0.01 ||
      word.start < previousEnd - 0.001
    ) throw new Error(`invalid or out-of-bounds word boundary: ${JSON.stringify(word)}`)
    previousEnd = word.end
  }
  return words
}

export function parseWordBoundaries(jsonl, duration) {
  const events = jsonl.trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  if (events.some(event => event.type !== 'WordBoundary'))
    throw new Error('speech metadata must contain WordBoundary events only')
  return validateWords(events.map(event => ({
    text: event.text,
    start: event.offset / 10_000_000,
    end: (event.offset + event.duration) / 10_000_000
  })), duration)
}

export function findCue(words, phrase) {
  const wanted = tokens(phrase)
  if (!wanted.length) throw new Error('empty narration cue')
  const timeline = tokenTimeline(words)
  const matches = []
  for (let start = 0; start <= timeline.length - wanted.length; start += 1) {
    if (wanted.every((token, index) => timeline[start + index].text === token))
      matches.push(start)
  }
  if (!matches.length) throw new Error(`missing narration cue: ${phrase}`)
  if (matches.length !== 1) throw new Error(`ambiguous narration cue (${matches.length} matches): ${phrase}`)
  const start = matches[0]
  return {
    phrase,
    start: timeline[start].start,
    end: timeline[start + wanted.length - 1].end,
    wordIndex: timeline[start].index,
    expected: timeline[start].start + VOICE_OFFSET - CUE_LEAD
  }
}

export function cueSchedule(words, phrases, duration) {
  validateWords(words, duration)
  const cues = phrases.map(phrase => findCue(words, phrase))
  for (const [index, cue] of cues.entries()) {
    if (cue.expected >= duration + VOICE_OFFSET)
      throw new Error(`cue overruns narration: ${cue.phrase}`)
    if (index && cue.expected <= cues[index - 1].expected)
      throw new Error(`cue times must be strictly increasing: ${cue.phrase}`)
  }
  return cues
}

function wrapCaption(text, width = 42) {
  if (text.length <= width) return text
  const words = text.split(' ')
  const options = []
  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(' ')
    const right = words.slice(index).join(' ')
    if (left.length <= width && right.length <= width)
      options.push({ text: `${left}\n${right}`, balance: Math.abs(left.length - right.length) })
  }
  return options.sort((a, b) => a.balance - b.balance)[0]?.text ?? null
}

export function validateCaptions(captions, duration) {
  if (!captions.length) throw new Error('no captions')
  let previousEnd = 0
  for (const caption of captions) {
    if (
      !caption.text.trim() ||
      !Number.isFinite(caption.start) ||
      !Number.isFinite(caption.end) ||
      caption.start < previousEnd - 0.001 ||
      caption.end <= caption.start ||
      caption.end > duration + 0.01
    ) throw new Error(`invalid or out-of-bounds caption: ${JSON.stringify(caption)}`)
    previousEnd = caption.end
  }
  return captions
}

// Audio, word timing, and the original script must agree. Caption grouping
// changes readability only; action cues never depend on those groups.
export function buildCaptions(text, words, duration) {
  validateWords(words, duration)
  const spoken = tokenTimeline(words)
  const expected = tokens(text)
  const mismatch = expected.findIndex((token, index) => token !== spoken[index]?.text)
  if (mismatch !== -1 || expected.length !== spoken.length)
    throw new Error(`speech/script token mismatch at ${mismatch === -1 ? expected.length : mismatch}`)
  let cursor = 0
  const units = text.trim().split(/\s+/).map(text => {
    const count = tokens(text).length
    if (!count) throw new Error(`caption has punctuation-only word: ${text}`)
    const unit = { text, start: spoken[cursor].start, end: spoken[cursor + count - 1].end }
    cursor += count
    return unit
  })
  const captions = []
  let group = []
  const flush = () => {
    if (!group.length) return
    const text = wrapCaption(group.map(unit => unit.text).join(' '))
    if (!text) throw new Error('caption cannot fit within two 42-character lines')
    captions.push({ text, start: group[0].start, end: group.at(-1).end })
    group = []
  }
  for (const unit of units) {
    const candidate = [...group, unit]
    if (group.length && (
      !wrapCaption(candidate.map(part => part.text).join(' ')) ||
      unit.end - group[0].start > 6
    )) flush()
    group.push(unit)
    const length = group.map(part => part.text).join(' ').length
    if (/[.!?][”"']?$/.test(unit.text) || (/[;:]$/.test(unit.text) && length >= 35)) flush()
  }
  flush()
  // A small hold avoids abruptly removing a caption at the last phoneme.
  for (const [index, caption] of captions.entries())
    caption.end = Math.min(caption.end + 0.15, units.at(-1).end + 0.25, duration, (captions[index + 1]?.start ?? duration) - 0.001)
  return validateCaptions(captions, duration)
}

export function formatTime(seconds, decimal = ',') {
  const milliseconds = Math.round(seconds * 1000)
  return [
    Math.floor(milliseconds / 3_600_000),
    Math.floor(milliseconds / 60_000) % 60,
    Math.floor(milliseconds / 1000) % 60
  ].map(value => String(value).padStart(2, '0')).join(':') +
    decimal + String(milliseconds % 1000).padStart(3, '0')
}

export function serializeCaptions(captions, format = 'vtt') {
  const separator = format === 'vtt' ? '.' : ','
  return (format === 'vtt' ? 'WEBVTT\n\n' : '') + captions.map((caption, index) =>
    `${index + 1}\n${formatTime(caption.start, separator)} --> ${formatTime(caption.end, separator)}\n${caption.text}\n`
  ).join('\n')
}
