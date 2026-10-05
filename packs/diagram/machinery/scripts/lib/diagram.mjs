// Word-cued architecture diagrams. A scene of kind "diagram" lists items
// (nodes, zones, edges, text, ledger rows) and beats (glow, dim, move, ...).
// Each item or beat names a phrase from the scene's narration; this module
// resolves that phrase to a time using the Edge TTS word boundaries, or a
// word-position estimate before narration exists, and emits deterministic
// GSAP tweens on the scene's paused timeline.
import { existsSync, readFileSync } from 'node:fs'

import { VOICE_OFFSET, parseWordBoundaries, tokens } from './speech.mjs'

export const STAGE = { left: 88, top: 268, width: 1744, height: 632 }

const PULSE_SPEED = 520
const PULSE_GAP = 1.6
const EARLIEST_REVEAL = 1.2

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const px = value => `${Math.round(value)}px`
const num = value => Number(value.toFixed(3))

// ---------- cue clock ----------

function spokenTimes(timelineScene) {
  const expected = tokens(timelineScene.vo)
  if (timelineScene.words && existsSync(timelineScene.words)) {
    const words = parseWordBoundaries(readFileSync(timelineScene.words, 'utf8'), timelineScene.voiceDuration)
    const flat = words.flatMap(word => tokens(word.text).map(token => ({ token, start: word.start })))
    if (flat.length === expected.length && flat.every((item, index) => item.token === expected[index]))
      return { expected, times: flat.map(item => item.start), measured: true }
  }
  return {
    expected,
    times: expected.map((_token, index) => index / expected.length * timelineScene.voiceDuration),
    measured: false
  }
}

// A cue is a phrase from the narration. "phrase#2" picks the second
// occurrence. A word in [brackets] anchors the time to that word instead of
// the first word of the phrase.
export function cueClock(timelineScene) {
  const { expected, times, measured } = spokenTimes(timelineScene)
  const resolve = cue => {
    const [phrase, nth] = cue.split('#')
    const parts = phrase.trim().split(/\s+/)
    const anchorPart = parts.findIndex(part => part.startsWith('['))
    const want = tokens(phrase.replaceAll('[', ' ').replaceAll(']', ' '))
    const anchor = anchorPart === -1 ? 0 : tokens(parts.slice(0, anchorPart).join(' ')).length
    let seen = 0
    for (let index = 0; index + want.length <= expected.length; index += 1) {
      if (want.every((token, offset) => expected[index + offset] === token)) {
        seen += 1
        if (seen === (Number(nth) || 1)) return VOICE_OFFSET + times[index + anchor]
      }
    }
    throw new Error(`Diagram cue "${cue}" is not in the narration of ${timelineScene.id}`)
  }
  resolve.measured = measured
  return resolve
}

// ---------- geometry ----------

const segments = points => points.slice(1).map((point, index) => {
  const [x0, y0] = points[index]
  const [x1, y1] = point
  return { x0, y0, x1, y1, length: Math.hypot(x1 - x0, y1 - y0) }
})

const pathLength = points => segments(points).reduce((sum, segment) => sum + segment.length, 0)

const pathData = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ')

function arrowHead(from, to, size = 16) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0])
  const back = [to[0] - Math.cos(angle) * size, to[1] - Math.sin(angle) * size]
  const spread = size * 0.55
  const left = [back[0] + Math.sin(angle) * spread, back[1] - Math.cos(angle) * spread]
  const right = [back[0] - Math.sin(angle) * spread, back[1] + Math.cos(angle) * spread]
  return [to, left, right].map(point => point.map(value => value.toFixed(1)).join(',')).join(' ')
}

function labelPlacement(item) {
  if (item.labelAt) return { x: item.labelAt[0], y: item.labelAt[1], align: item.labelAlign ?? 'center' }
  const longest = segments(item.points).sort((a, b) => b.length - a.length)[0]
  const x = (longest.x0 + longest.x1) / 2
  const y = (longest.y0 + longest.y1) / 2
  if (Math.abs(longest.y1 - longest.y0) > Math.abs(longest.x1 - longest.x0))
    return { x: x + 14, y, align: 'left' }
  return { x, y, align: item.labelSide === 'below' ? 'below' : 'center' }
}

function midpoint(points) {
  const all = segments(points)
  let remaining = pathLength(points) / 2
  for (const segment of all) {
    if (remaining <= segment.length) {
      const ratio = segment.length ? remaining / segment.length : 0
      return [segment.x0 + (segment.x1 - segment.x0) * ratio, segment.y0 + (segment.y1 - segment.y0) * ratio]
    }
    remaining -= segment.length
  }
  return points.at(-1)
}

// ---------- HTML ----------

const box = (item, hidden) =>
  `left:${px(item.x)};top:${px(item.y)};width:${px(item.w)};height:${px(item.h)}${hidden ? ';opacity:0' : ''}`

const chipList = item => (item.chips ?? []).map(chip => typeof chip === 'string' ? { text: chip, cue: undefined } : chip)

function nodeHtml(item) {
  const variant = item.type && item.type !== 'node' ? ` dg-node--${item.type}` : ''
  const compact = item.compact ? ' dg-node--compact' : ''
  const top = item.top ? ' dg-node--top' : ''
  const chips = chipList(item)
  return `
        <div class="dg-item dg-node dg--${item.tone ?? 'raised'}${variant}${compact}${top}" data-dg="${item.id}" style="${box(item, item.cue !== null)}">
          <span class="dg-glow"></span>
          ${item.type === 'bus' ? '<span class="dg-bus-flow"></span>' : ''}
          <div class="dg-label">${escapeHtml(item.label)}</div>
          ${item.sub ? `<div class="dg-sub">${escapeHtml(item.sub)}</div>` : ''}
          ${chips.length ? `<div class="dg-chips">${chips.map((chip, index) =>
            `<span class="dg-chip" data-dg-chip="${item.id}-${index}"${chip.cue ? ' style="opacity:0"' : ''}>${escapeHtml(chip.text)}</span>`).join('')}</div>` : ''}
          ${item.check ? '<span class="dg-check">✓</span>' : ''}
        </div>`
}

function itemHtml(item) {
  const hidden = item.cue !== null
  switch (item.type) {
    case 'zone':
      return `
        <div class="dg-item dg-zone dg--${item.tone ?? 'raised'}${item.labelBottom ? ' dg-zone--label-bottom' : ''}" data-dg="${item.id}" style="${box(item, hidden)}">
          <span class="dg-glow"></span>
          <span class="dg-zone-label">${escapeHtml(item.label)}</span>
        </div>`
    case 'text':
      return `
        <div class="dg-item dg-text dg-text--${item.size ?? 'md'}${item.tone ? ` dg-text--${item.tone}` : ''}" data-dg="${item.id}" style="${box(item, hidden)}">${escapeHtml(item.label)}</div>`
    case 'row':
      return `
        <div class="dg-item dg-row dg-row--${item.badge.toLowerCase()}" data-dg="${item.id}" style="${box(item, hidden)}">
          <span class="dg-glow"></span>
          <span class="dg-row-label">${escapeHtml(item.label)}</span>
          <span class="dg-row-source">${escapeHtml(item.source)}</span>
          <span class="dg-badge">${escapeHtml(item.badge)}</span>
        </div>`
    case 'rule':
      return `
        <div class="dg-item dg-rule" data-dg="${item.id}" style="left:${px(item.x)};top:${px(item.y)};width:${px(item.w)}${hidden ? ';opacity:0' : ''}">
          <span>${escapeHtml(item.label)}</span>
        </div>`
    case 'cursor':
      return `
        <div class="dg-item dg-cursor" data-dg="${item.id}" style="left:${px(item.x)};top:${px(item.y)}${hidden ? ';opacity:0' : ''}">
          <span class="dg-ripple"></span>
          <svg width="40" height="48" viewBox="0 0 40 48"><path d="M2 2 L2 38 L12 29 L19 45 L26 42 L19 26 L33 26 Z" /></svg>
        </div>`
    default:
      return nodeHtml(item)
  }
}

function edgeSvg(item) {
  const hidden = item.cue !== null
  const length = pathLength(item.points)
  const tone = item.tone ?? 'green'
  const points = item.points
  const lineStyle = item.dashed
    ? (hidden ? 'opacity:0' : '')
    : `stroke-dasharray:${length.toFixed(1)};stroke-dashoffset:${hidden ? length.toFixed(1) : 0}`
  const arrows = []
  if (item.arrow !== false)
    arrows.push(`<polygon class="dg-arrow" data-head="1" points="${arrowHead(points.at(-2), points.at(-1))}" style="${hidden ? 'opacity:0' : ''}" />`)
  if (item.arrow === 'both')
    arrows.push(`<polygon class="dg-arrow" data-head="0" points="${arrowHead(points[1], points[0])}" style="${hidden ? 'opacity:0' : ''}" />`)
  return `
          <g class="dg-edge dg-edge--${tone}" data-dg="${item.id}">
            <path class="dg-edge-glow" d="${pathData(points)}" />
            <path class="dg-edge-line${item.dashed ? ' dg-edge-line--dashed' : ''}" d="${pathData(points)}" style="${lineStyle}" />
            ${arrows.join('\n            ')}
            ${item.pulse ? `<circle class="dg-pulse" r="7" cx="${points[0][0]}" cy="${points[0][1]}" style="opacity:0" />` : ''}
          </g>`
}

function edgeExtrasHtml(item, broken) {
  const parts = []
  if (item.label) {
    const place = labelPlacement(item)
    parts.push(`
        <div class="dg-edge-label dg-edge-label--${place.align}" data-dg-label="${item.id}" style="left:${px(place.x)};top:${px(place.y)}${item.cue !== null ? ';opacity:0' : ''}">${escapeHtml(item.label)}</div>`)
  }
  if (broken) {
    const [x, y] = midpoint(item.points)
    parts.push(`
        <div class="dg-break" data-dg-break="${item.id}" style="left:${px(x)};top:${px(y)};opacity:0">×</div>`)
  }
  return parts.join('')
}

export function renderDiagram(scene) {
  const { items, beats = [] } = scene.diagram
  const broken = new Set(beats.filter(beat => beat.act === 'break').flatMap(beat => beat.targets))
  const zones = items.filter(item => item.type === 'zone')
  const edges = items.filter(item => item.type === 'edge')
  const others = items.filter(item => item.type !== 'zone' && item.type !== 'edge')
  return `
    <div class="diagram-head">
      <div class="eyebrow">${escapeHtml(scene.eyebrow)}</div>
      <h1 id="scene-${scene.id}-title" class="scene-title scene-title--diagram">${scene.title.split(/\s+/).map(word =>
        `<span class="title-word">${escapeHtml(word)}</span>`).join(' ')}</h1>
      <p id="scene-${scene.id}-support" class="scene-support">${escapeHtml(scene.support)}</p>
      <div class="accent-rule"></div>
    </div>
    <div class="dg-stage" style="left:${px(STAGE.left)};top:${px(STAGE.top)};width:${px(STAGE.width)};height:${px(STAGE.height)}">
      <div class="dg-layer dg-layer--zones">${zones.map(itemHtml).join('')}
      </div>
      <svg class="dg-layer dg-edges" width="${STAGE.width}" height="${STAGE.height}" viewBox="0 0 ${STAGE.width} ${STAGE.height}">${edges.map(edgeSvg).join('')}
      </svg>
      <div class="dg-layer dg-layer--nodes">${others.map(itemHtml).join('')}
      </div>
      <div class="dg-layer dg-layer--labels">${edges.map(item => edgeExtrasHtml(item, broken.has(item.id))).join('')}
      </div>
    </div>`
}

// ---------- motion ----------

export function diagramTimeline(scene, timelineScene) {
  const { items, beats = [] } = scene.diagram
  const at = cueClock(timelineScene)
  const duration = timelineScene.duration
  const end = duration - 0.2
  const byId = new Map(items.map(item => [item.id, item]))
  const lines = []
  const push = line => lines.push(`      ${line}`)
  const clamp = time => Math.min(Math.max(time, EARLIEST_REVEAL), end - 0.6)
  const when = (cue, delay = 0) => num(clamp(at(cue) - 0.08 + delay))
  const q = id => `el(${JSON.stringify(id)})`
  const reveal = (target, from, to, time, extra = '') =>
    push(`tl.fromTo(${target}, ${from}, { ${to}, immediateRender: false${extra} }, ${time})`)

  for (const beat of beats)
    for (const target of beat.targets)
      if (!byId.has(target)) throw new Error(`Beat target "${target}" is not an item in ${scene.id}`)

  for (const item of items) {
    const start = item.cue === null ? null : when(item.cue, item.delay)
    if (item.type === 'edge') {
      const length = pathLength(item.points)
      const draw = Math.min(0.9, Math.max(0.35, length / 900))
      const line = `${q(item.id)}.querySelector('.dg-edge-line')`
      if (start !== null) {
        if (item.dashed) reveal(line, '{ opacity: 0 }', 'opacity: 1, duration: 0.5', start)
        else reveal(line, `{ strokeDashoffset: ${length.toFixed(1)} }`, `strokeDashoffset: 0, duration: ${draw.toFixed(2)}, ease: 'power1.inOut'`, start)
        push(`${q(item.id)}.querySelectorAll('.dg-arrow').forEach(arrow => tl.fromTo(arrow, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, arrow.dataset.head === '1' ? ${num(start + draw - 0.12)} : ${start}))`)
        if (item.label) reveal(`root.querySelector('[data-dg-label="${item.id}"]')`, '{ opacity: 0 }', 'opacity: 1, duration: 0.4', num(start + draw * 0.5))
      }
      const flowStart = start === null ? 0 : start
      if (item.dashed)
        push(`tl.fromTo(${line}, { strokeDashoffset: 0 }, { strokeDashoffset: ${-Math.round((end - flowStart) * 24)}, duration: ${num(end - flowStart)}, ease: 'none', immediateRender: false }, ${num(flowStart)})`)
      if (item.pulse) {
        const circle = `${q(item.id)}.querySelector('.dg-pulse')`
        const parts = segments(item.points)
        const travel = Math.max(0.5, length / PULSE_SPEED)
        push(`{ const c = ${circle}`)
        for (let loop = (start === null ? 0.6 : start + draw); loop + travel < end - 0.3; loop += travel + PULSE_GAP) {
          push(`  tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, ${num(loop)})`)
          let offset = loop
          for (const part of parts) {
            const seconds = travel * (part.length / length)
            push(`  tl.fromTo(c, { attr: { cx: ${part.x0}, cy: ${part.y0} } }, { attr: { cx: ${part.x1}, cy: ${part.y1} }, duration: ${num(seconds)}, ease: 'none', immediateRender: false }, ${num(offset)})`)
            offset += seconds
          }
          push(`  tl.fromTo(c, { opacity: 1 }, { opacity: 0, duration: 0.12, immediateRender: false }, ${num(loop + travel - 0.12)})`)
        }
        push('}')
      }
      continue
    }

    if (start !== null) {
      if (item.type === 'bus' || item.type === 'band')
        reveal(q(item.id), '{ opacity: 0, scaleX: 0.04 }', "opacity: 1, scaleX: 1, duration: 0.8, ease: 'power3.out'", start)
      else if (item.type === 'text' && item.size === 'xl')
        reveal(q(item.id), '{ opacity: 0, scale: 0.9 }', "opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)'", start)
      else
        reveal(q(item.id), '{ opacity: 0, y: 14 }', "opacity: 1, y: 0, duration: 0.5, ease: 'power2.out'", start)
    }
    const base = start ?? 0
    chipList(item).forEach((chip, index) => {
      if (!chip.cue) return
      reveal(`root.querySelector('[data-dg-chip="${item.id}-${index}"]')`, '{ opacity: 0, scale: 0.7 }',
        "opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)'", num(Math.max(base + 0.2, when(chip.cue))))
    })
    if (item.check)
      reveal(`${q(item.id)}.querySelector('.dg-check')`, '{ opacity: 0, scale: 0.4 }', "opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)'", num(base + 0.35))
    if (item.type === 'bus')
      push(`tl.fromTo(${q(item.id)}.querySelector('.dg-bus-flow'), { x: -260 }, { x: ${STAGE.width}, duration: 2.6, ease: 'none', repeat: ${Math.max(0, Math.floor((end - base - 1) / 2.6) - 1)}, immediateRender: false }, ${num(base + 0.8)})`)
  }

  for (const beat of beats) {
    const time = num(Math.min(Math.max(at(beat.cue) - 0.08 - (beat.lead ?? 0) + (beat.delay ?? 0), 0.3), end - 0.8))
    for (const target of beat.targets) {
      const item = byId.get(target)
      const glowTarget = item.type === 'edge' ? `${q(target)}.querySelector('.dg-edge-glow')` : `${q(target)}.querySelector('.dg-glow')`
      switch (beat.act) {
        case 'glow': {
          const hold = Math.min(beat.hold ?? 1.6, Math.max(0.2, end - time - 1.0))
          reveal(glowTarget, '{ opacity: 0 }', "opacity: 1, duration: 0.35, ease: 'power2.out'", time)
          reveal(glowTarget, '{ opacity: 1 }', "opacity: 0, duration: 0.6, ease: 'power2.inOut'", num(time + 0.35 + hold))
          break
        }
        case 'dim':
          reveal(q(target), '{ opacity: 1 }', `opacity: ${beat.to ?? 0.35}, duration: 0.7, ease: 'power2.inOut'`, time)
          break
        case 'hide':
          reveal(q(target), '{ opacity: 1 }', "opacity: 0, duration: 0.5, ease: 'power2.inOut'", time)
          break
        case 'move': {
          const [tx, ty] = beat.to
          reveal(q(target), '{ x: 0, y: 0, scale: 1 }',
            `x: ${tx - item.x}, y: ${ty - item.y}, scale: ${num(beat.scale ?? 1)}, duration: ${beat.duration ?? 1.2}, ease: 'power3.inOut'`, time)
          break
        }
        case 'click':
          reveal(q(target), '{ scale: 1 }', "scale: 0.82, duration: 0.12, ease: 'power2.out'", time)
          reveal(q(target), '{ scale: 0.82 }', "scale: 1, duration: 0.2, ease: 'power2.out'", num(time + 0.12))
          reveal(`${q(target)}.querySelector('.dg-ripple')`, '{ opacity: 0.85, scale: 0.2 }', "opacity: 0, scale: 1.6, duration: 0.7, ease: 'power2.out'", time)
          break
        case 'break':
          reveal(`${q(target)}.querySelector('.dg-edge-line')`, "{ stroke: '#01a982' }", "stroke: '#f4b942', duration: 0.3", time)
          push(`${q(target)}.querySelectorAll('.dg-arrow').forEach(arrow => tl.fromTo(arrow, { fill: '#01a982' }, { fill: '#f4b942', duration: 0.3, immediateRender: false }, ${time}))`)
          reveal(`root.querySelector('[data-dg-break="${target}"]')`, '{ opacity: 0, scale: 0.3 }', "opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)'", num(time + 0.2))
          reveal(q(target), '{ opacity: 1 }', "opacity: 0.4, duration: 0.8, ease: 'power2.inOut'", num(time + 0.7))
          if (item.label) reveal(`root.querySelector('[data-dg-label="${target}"]')`, '{ opacity: 1 }', 'opacity: 0, duration: 0.3', time)
          break
        default:
          throw new Error(`Unknown beat "${beat.act}" in ${scene.id}`)
      }
    }
  }

  return `
      const el = id => root.querySelector('[data-dg="' + id + '"]')
${lines.join('\n')}`
}
