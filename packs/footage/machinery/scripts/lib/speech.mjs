import { createHash } from 'node:crypto'

export const EDGE_TTS_VERSION = 'edge-tts==7.2.8'
export const VOICE_OFFSET = 0.35

export function speechFingerprint(text, voice, rate) {
  return createHash('sha256')
    .update(JSON.stringify({
      text,
      voice,
      rate,
      engine: EDGE_TTS_VERSION,
      boundary: 'WordBoundary'
    }))
    .digest('hex')
}

export function tokens(text) {
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll('’', "'")
    .replaceAll('&', ' and ')
    .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? []
}

export function canonicalTokens(text) {
  const source = tokens(text)
  const result = []
  for (let index = 0; index < source.length;) {
    if (source[index].length === 1) {
      let end = index
      while (end < source.length && source[end].length === 1) end += 1
      if (end - index >= 2) {
        result.push(source.slice(index, end).join(''))
        index = end
        continue
      }
    }
    result.push(source[index])
    index += 1
  }
  return result
}

function tokenTimeline(words) {
  return words.flatMap((word, index) =>
    tokens(word.text).map(text => ({ ...word, text, index }))
  )
}

export function parseWordBoundaries(jsonl, duration) {
  const events = jsonl.trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  if (!events.length || events.some(event => event.type !== 'WordBoundary'))
    throw new Error('Speech metadata must contain WordBoundary events only')
  const spokenEvents = events.filter(event => tokens(event.text).length)
  if (!spokenEvents.length)
    throw new Error('Speech metadata contains no spoken word boundaries')
  const words = spokenEvents.map(event => ({
    text: event.text,
    start: event.offset / 10_000_000,
    end: (event.offset + event.duration) / 10_000_000
  }))
  let previousEnd = 0
  for (const word of words) {
    if (
      !Number.isFinite(word.start) ||
      !Number.isFinite(word.end) ||
      word.start < previousEnd - 0.001 ||
      word.end <= word.start ||
      word.end > duration + 0.02
    ) throw new Error(`Invalid word boundary: ${JSON.stringify(word)}`)
    previousEnd = word.end
  }
  return words
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

export function buildCaptions(text, words, duration) {
  const spoken = tokenTimeline(words)
  const expected = tokens(text)
  const mismatch = expected.findIndex((token, index) => token !== spoken[index]?.text)
  if (mismatch !== -1 || expected.length !== spoken.length)
    throw new Error(`Speech/script token mismatch at ${mismatch === -1 ? expected.length : mismatch}`)

  let cursor = 0
  const units = text.trim().split(/\s+/).map(text => {
    const count = tokens(text).length
    if (!count) throw new Error(`Caption contains punctuation-only token: ${text}`)
    const unit = {
      text,
      start: spoken[cursor].start,
      end: spoken[cursor + count - 1].end
    }
    cursor += count
    return unit
  })

  const captions = []
  let group = []
  const flush = () => {
    if (!group.length) return
    const text = wrapCaption(group.map(item => item.text).join(' '))
    if (!text) throw new Error('Caption cannot fit within two 42-character lines')
    captions.push({
      text,
      start: group[0].start,
      end: group.at(-1).end
    })
    group = []
  }

  for (const unit of units) {
    const candidate = [...group, unit]
    if (group.length && (
      !wrapCaption(candidate.map(item => item.text).join(' ')) ||
      unit.end - group[0].start > 6
    )) flush()
    group.push(unit)
    const chars = group.map(item => item.text).join(' ').length
    if (/[.!?][”"']?$/.test(unit.text) || (/[;:]$/.test(unit.text) && chars >= 35))
      flush()
  }
  flush()

  for (const [index, caption] of captions.entries()) {
    caption.end = Math.min(
      caption.end + 0.15,
      units.at(-1).end + 0.25,
      duration,
      (captions[index + 1]?.start ?? duration) - 0.001
    )
  }
  return captions
}

export function displayCaption(text) {
  return text
    .replace(/\bO P S E X T\b/g, 'OPSEXT')
    .replace(/\bB U\b/g, 'BU')
    .replace(/\bH P E\b/g, 'HPE')
    .replace(/\bA P I\b/g, 'API')
    .replace(/\bS D L C\b/g, 'SDLC')
    .replace(/\bHyper Frames\b/gi, 'Hyperframes')
}

export function formatTime(seconds, separator = ',') {
  const milliseconds = Math.round(seconds * 1000)
  return [
    Math.floor(milliseconds / 3_600_000),
    Math.floor(milliseconds / 60_000) % 60,
    Math.floor(milliseconds / 1000) % 60
  ].map(value => String(value).padStart(2, '0')).join(':') +
    separator + String(milliseconds % 1000).padStart(3, '0')
}

export function serializeCaptions(captions, format = 'srt') {
  const separator = format === 'vtt' ? '.' : ','
  const prefix = format === 'vtt' ? 'WEBVTT\n\n' : ''
  return prefix + captions.map((caption, index) =>
    `${index + 1}\n${formatTime(caption.start, separator)} --> ${formatTime(caption.end, separator)}\n${caption.text}\n`
  ).join('\n')
}

export function parseCaptions(text) {
  const parseTime = value => {
    const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/)
    if (!match) throw new Error(`Invalid caption time: ${value}`)
    return Number(match[1]) * 3600 +
      Number(match[2]) * 60 +
      Number(match[3]) +
      Number(match[4]) / 1000
  }
  return text.replace(/\r/g, '').trim().split(/\n\s*\n/)
    .filter(block => block.includes('-->'))
    .map(block => {
      const lines = block.split('\n')
      const row = lines.findIndex(line => line.includes('-->'))
      const [start, end] = lines[row].split('-->')
      return {
        start: parseTime(start),
        end: parseTime(end),
        text: lines.slice(row + 1).join('\n')
      }
    })
}
