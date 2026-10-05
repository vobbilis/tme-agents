// Original, editable vector artwork. Each phase is a progressive state of one
// stable diagram, not a fabricated screenshot or claimed security-test result.
import { SCENES } from './story.mjs'
import { closingPhaseState } from './closing-motion.mjs'

export const escape = value => String(value ?? '').replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const DARK = { bg: '#071f23', panel: '#102e32', ink: '#f2f7f3', muted: '#a9c6c4',
  line: '#33595a', connector: '#789d9d', green: '#58e7ba', amber: '#ffc875', blue: '#a8ccff', soft: '#164541' }
const LIGHT = { bg: '#f3f2eb', panel: '#ffffff', ink: '#14312e', muted: '#496964',
  line: '#baccc4', connector: '#617e76', green: '#00785d', amber: '#a65516', blue: '#24549b', soft: '#dcebe2' }
export const palette = theme => theme === 'light' ? LIGHT : DARK

function text(x, y, value, size = 26, color = 'currentColor', extra = '') {
  const lines = Array.isArray(value) ? value : [value]
  return `<text data-fit="true" x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${lines.map((line, index) => `<tspan x="${x}" dy="${index ? size * 1.36 : 0}">${escape(line)}</tspan>`).join('')}</text>`
}
function line(d, color, width = 3, extra = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
}
function box(x, y, width, height, fill, stroke = 'none', radius = 12, extra = '') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`
}
function dot(x, y, color, radius = 6) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`
}
function arrow(x1, y1, x2, y2, color) {
  return line(`M${x1} ${y1}H${x2 - 12}`, color, 3) + line(`M${x2 - 22} ${y2 - 8}L${x2 - 10} ${y2}L${x2 - 22} ${y2 + 8}`, color, 3)
}
function appear(visible, markup, faint = false) {
  return `<g opacity="${visible ? 1 : faint ? 0.14 : 0}">${markup}</g>`
}
function icon(kind, x, y, color, scale = 1) {
  // Line-work extends the simple technical icon language of the previous reel.
  const paths = {
    code: '<path d="m16 13-11 11 11 11m16-22 11 11-11 11M28 6 20 42"/>',
    person: '<circle cx="24" cy="14" r="7"/><path d="M9 43v-5c0-9 6-14 15-14s15 5 15 14v5"/>',
    observe: '<path d="M2 24s8-14 22-14 22 14 22 14-8 14-22 14S2 24 2 24Z"/><circle cx="24" cy="24" r="6"/>',
    context: '<rect x="6" y="6" width="14" height="14" rx="2"/><rect x="28" y="6" width="14" height="14" rx="2"/><rect x="6" y="28" width="14" height="14" rx="2"/><path d="M35 28v14m-7-7h14"/>',
    packet: '<path d="M10 4h20l9 9v31H10Z M30 4v10h9 M17 23h15 M17 30h15 M17 37h10"/>',
    loop: '<path d="M8 17A18 18 0 0 1 39 11l5 7M44 7v11H33M40 31A18 18 0 0 1 9 37l-5-7M4 41V30h11"/>',
    target: '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="8"/><path d="M24 1v9m0 28v9M1 24h9m28 0h9"/>',
    boundary: '<path d="M5 17V5h12m14 0h12v12m0 14v12H31m-14 0H5V31"/><rect x="16" y="16" width="16" height="16" rx="3"/>'
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths[kind] ?? paths.context}</g>`
}
function label(x, y, value, p, color = p.muted) {
  return text(x, y, value.toUpperCase(), 16, color, 'font-weight="500" letter-spacing="2"')
}
function title(scene, p, { x = 104, y = 265, size = 64 } = {}) {
  return label(x, y - size * 1.45, scene.act, p) +
    text(x, y, scene.headline[0], size, p.ink, 'font-weight="500" letter-spacing="-2.5"') +
    text(x, y + size * 1.35, scene.headline[1], size, p.green, 'font-weight="500" letter-spacing="-2.5"')
}
function card(x, y, width, height, heading, detail, p, accent = p.green, kind) {
  return box(x, y, width, height, p.panel, p.line) +
    line(`M${x + 22} ${y + 1}H${x + width - 22}`, accent, 3) +
    (kind ? icon(kind, x + 23, y + 24, accent, 0.76) : '') +
    text(x + 24, y + (kind ? 94 : 46), heading, 27, p.ink, 'font-weight="500"') +
    (detail ? text(x + 24, y + (kind ? 131 : 84), detail, 21, p.muted) : '')
}
function note(value, p, color = p.muted) {
  return text(104, 874, value, 21, color)
}
function ribbon(x, y, width, value, p, accent = p.green) {
  return box(x, y, width, 53, p.soft, 'none', 6) + dot(x + 24, y + 26, accent, 5) +
    text(x + 43, y + 34, value, 21, p.ink, 'font-weight="500"')
}

// One unresolved, explicitly hypothetical question stays in the same position
// throughout chapters 4–7. The field describes intended evidence, not results.
function evidenceRecord(p, stage) {
  return `<g id="evidence-record" data-record="hypothetical-permissions">` +
    box(104, 775, 1712, 112, p.panel, p.green, 12) +
    icon('packet', 126, 809, p.green, .95) +
    dot(190, 802, p.amber, 5) +
    text(207, 807, 'HYPOTHETICAL · PERMISSIONS QUESTION', 16, p.amber, 'font-weight="500" letter-spacing="1.3"') +
    text(184, 853, 'Can a read-only user change a protected setting?', 27, p.ink, 'font-weight="500"') +
    line('M985 796V867', p.line, 1) +
    text(1015, 811, 'ONE CONNECTED RECORD', 16, p.green, 'font-weight="500" letter-spacing="1.6"') +
    text(1015, 853, stage, 25, p.ink) + '</g>'
}

function question(scene, phase, p) {
  const cx = 1340, cy = 515
  let art = title(scene, p, { y: 350, size: 77 }) +
    text(108, 548, ['Pull security upstream.', 'Into everyday development.'], 30, p.muted)
  art += appear(phase >= 2, label(108, 707, 'The regular AI-First SDLC, adapted', p, p.green))
  art += appear(phase >= 3, text(108, 757, ['Vulnerability scanning. Fixing.', 'Verification inside the pipeline.'], 27, p.ink))
  art += `<circle cx="${cx}" cy="${cy}" r="245" fill="none" stroke="${p.line}" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="193" fill="none" stroke="${p.line}" stroke-width="1" stroke-dasharray="3 13"/>` +
    box(cx - 128, cy - 75, 256, 150, p.panel, p.line, 16) +
    icon('code', cx - 24, cy - 48, p.green) +
    text(cx, cy + 37, ['Product change'], 27, p.ink, 'text-anchor="middle" font-weight="500"')
  for (const [x, y, heading] of [[1130, 353, 'Design'], [1590, 504, 'Behavior'], [1160, 708, 'Tests']]) {
    art += box(x - 103, y - 25, 206, 68, p.panel, p.line, 34) +
      text(x, y + 18, heading, 24, p.ink, 'text-anchor="middle"')
  }
  art += appear(phase >= 1, box(1450, 260, 300, 68, p.panel, p.amber, 34) +
    text(1600, 304, 'Late release check', 24, p.amber, 'text-anchor="middle"'))
  art += appear(phase >= 2, line('M1587 329C1700 508 1570 782 1340 760C1079 756 1005 500 1130 397', p.green, 5) +
    line('M1130 397L1146 415M1130 397L1122 421', p.green, 4) +
    dot(1340, 760, p.green, 9) + line('M1548 333L1430 427', p.green, 3))
  art += appear(phase >= 3, ribbon(990, 812, 750, 'Design → Commit → Build → Verify', p))
  return art
}

function handoff(scene, phase, p) {
  const names = [['Development', 'Change takes shape'], ['Security scan', 'Candidate findings'], ['SecOps review', 'Investigate + triage'], ['Ticket', 'Context handed off'], ['Developer fix', 'Return to the change'], ['Security recheck', 'Validate again']]
  let art = title(scene, p) + label(104, 407, 'Traditional workflow · conceptual', p)
  names.forEach(([heading, detail], i) => {
    const x = 104 + i * 284, visible = i < 3 || phase >= 1
    art += appear(visible, card(x, 467, 258, 126, heading, detail, p, i === 2 ? p.blue : p.amber))
    if (i < 5) art += appear(i < 2 || phase >= 1, arrow(x + 263, 530, x + 285, 530, p.connector))
  })
  art += appear(phase >= 2, line('M1654 617V713Q1654 738 1630 738H490Q465 738 465 713V636', p.amber, 3) +
    line('M454 650L465 635L476 650', p.amber, 3) +
    box(692, 701, 710, 74, p.bg, 'none') +
    text(1047, 732, 'Architecture. Design intent. Product behavior.', 24, p.ink, 'text-anchor="middle"') +
    text(1047, 765, 'The context has to travel back.', 22, p.muted, 'text-anchor="middle"'))
  art += appear(phase >= 3, note('Repeated handoffs. Delayed learning. Not a lack of effort.', p, p.amber))
  return art
}

function developmentLoop(scene, phase, p) {
  let art = title(scene, p) + label(104, 403, 'Context   /   Plan   /   Implement   /   Review   /   Test', p, p.green)
  const positions = [104, 710, 1316]
  for (const [i, heading] of ['Design + plan', 'Commit + build', 'Review + verify'].entries()) {
    const x = positions[i]
    art += card(x, 464, 500, 126, heading, ['Product context + intent', 'Code + tests together', 'Concern + legitimate behavior'][i], p)
    if (i < 2) art += arrow(x + 510, 527, positions[i + 1] - 4, 527, p.connector)
  }
  art += appear(phase >= 1, positions.map((x, i) => ribbon(x, 617, 500,
    ['Threat context + candidate scans', 'Investigate + propose fixes', 'Verify + regression-test'][i], p)).join(''))
  art += appear(phase >= 2, line('M354 685V735H1566V685', p.green, 4) +
    line('M960 685V735', p.green, 4) +
    [354, 960, 1566].map(x => dot(x, 735, p.green, 8)).join('') +
    box(545, 707, 850, 55, p.bg) + text(970, 742, 'PART OF THE REGULAR DEVELOPMENT PIPELINE', 22, p.green, 'text-anchor="middle" font-weight="500" letter-spacing="1.5"'))
  art += appear(phase >= 3, icon('person', 620, 810, p.blue, .72) +
    text(678, 840, 'Human ownership stays in the loop.', 29, p.blue, 'font-weight="500"'))
  return art
}

function context(scene, phase, p) {
  let art = title(scene, p, { size: 60 }) +
    card(1040, 581, 682, 118, 'Shared security harness', 'Ground analysis in the product’s rules', p)
  art += appear(phase === 0, text(1060, 483, 'A generic alert needs context.', 31, p.amber, 'font-weight="500"') +
    line('M1368 511V567', p.amber, 3))
  art += appear(phase >= 1, label(108, 435, 'Hypothetical example', p, p.amber) +
    text(108, 491, ['A read-only user.', 'A protected setting.', 'What should be allowed?'], 33, p.ink, 'font-weight="500"') +
    text(108, 678, 'Roles. Boundaries. Intended behavior.', 23, p.muted))
  const inputs = [
    [906, 285, 'Product', 'Actual behavior'],
    [1210, 285, 'Architecture', 'Trust boundaries'],
    [1514, 302, 'Design intent', 'Expected behavior']
  ]
  art += appear(phase >= 2, inputs.map(([x, w, heading, detail]) =>
    card(x, 407, w, 108, heading, detail, p)).join('') +
    card(906, 246, 910, 112, 'Function-specific threat model', 'Assumptions made explicit · another input to analysis', p) +
    line('M1361 362V382H886V550H1180V576', p.green, 3) +
    line('M1048 520V548H1570M1352 520V576M1665 520V548H1570V576', p.green, 3) +
    line('M1344 566L1352 576L1360 566', p.green, 3))
  art += appear(phase >= 3, line('M1361 704V765M1353 753L1361 765L1369 753', p.green, 3) +
    evidenceRecord(p, 'Question + context + assumptions'))
  return art
}

function sandbox(scene, phase, p) {
  let art = title(scene, p, { size: 62 }) +
    box(571, 410, 870, 305, p.panel, p.green, 18, 'stroke-dasharray="10 7"') +
    label(600, 453, 'Authorized scope · controlled environment', p, p.green)
  for (const [i, [heading, detail, kind]] of [['Application', 'Product behavior', 'code'], ['API', 'Contract boundary', 'boundary'], ['State', 'Observable result', 'context']].entries()) {
    art += card(601 + i * 280, 485, 250, 165, heading, detail, p, p.green, kind)
    if (i < 2) art += arrow(861 + i * 280, 568, 883 + i * 280, 568, p.connector)
  }
  art += text(1005, 685, 'Running product · isolated test environment', 22, p.muted, 'text-anchor="middle"')
  art += appear(phase >= 1, icon('target', 215, 427, p.amber, 1.0) +
    text(110, 529, ['Read-only role.', 'Protected setting.'], 31, p.ink, 'font-weight="500"') +
    text(110, 670, 'A scoped exercise.', 23, p.muted) +
    arrow(390, 612, 556, 612, p.amber))
  art += appear(phase >= 2, arrow(1447, 568, 1500, 568, p.green) +
    text(1515, 484, 'CAPTURE', 18, p.green, 'font-weight="500" letter-spacing="2"') +
    text(1515, 533, ['Role + action', 'State + observation'], 25, p.ink) +
    line('M1645 612V746H1380V768', p.green, 3))
  art += evidenceRecord(p, phase >= 3 ? 'Reviewable record · reproducibility' : phase >= 2 ? 'Role + action + state + observation' : 'Question + context + assumptions')
  return art
}

function evidence(scene, phase, p) {
  let art = title(scene, p, { size: 62 })
  const roles = [
    ['Exercise', 'Explore a scenario', 'target', p.amber],
    ['Observe', 'Capture the behavior', 'observe', p.green],
    ['Challenge', 'Agent: reproduce + test', 'boundary', p.green],
    ['Summarize', 'Make it reviewable', 'packet', p.green]
  ]
  roles.forEach(([heading, detail, kind, accent], i) => {
    const x = 104 + i * 446, visible = i < 2 || (i === 2 ? phase >= 1 : phase >= 3)
    art += appear(visible, card(x, 412, 374, 166, heading, detail, p, accent, kind))
    if (i < 3) art += appear(i === 0 || (i === 1 ? phase >= 1 : phase >= 3), arrow(x + 385, 504, x + 440, 504, p.connector))
  })
  art += appear(phase >= 2, label(104, 632, 'Correlate · deduplicate · prioritize using risk and evidence', p, p.green) +
    line('M106 702H1810', p.connector, 3) +
    ['Threat model', 'Code', 'Dependencies', 'Secrets', 'Infrastructure', 'Containers'].map((value, i) => {
      const x = 114 + i * 286
      return dot(x, 702, p.green) + text(x, 679, value, 24, p.ink)
    }).join(''))
  art += appear(phase >= 3, text(104, 748, 'Evidence for Security review. Agent agreement alone is insufficient.', 22, p.blue))
  art += evidenceRecord(p, phase >= 3 ? 'Concern · conditions · observation · next step' : phase >= 2 ? 'Correlate + prioritize by risk' : phase >= 1 ? 'Challenge the candidate · reproduce' : 'Reviewable record · reproducibility')
  return art
}

function verification(scene, phase, p) {
  let art = title(scene, p) +
    card(104, 475, 660, 181, 'Engineering change', 'If confirmed: evidence informs remediation', p, p.blue, 'code') +
    line('M423 769V670M415 682L423 670L431 682', p.green, 3)
  art += appear(phase >= 1, ribbon(104, 398, 660, 'AI assists. Engineering owns.', p, p.blue))
  art += appear(phase >= 2, line('M780 565H909V475H1060M909 565V635H1060', p.green, 3) +
    card(1070, 410, 746, 125, 'Read-only user blocked from changing it?', 'Re-run the relevant security checks', p, p.green) +
    card(1070, 570, 746, 125, 'Authorized user can still make the change?', 'Re-run the regression tests', p, p.green) +
    dot(909, 565, p.green, 7))
  art += appear(phase >= 3, line('M1443 701V764M1435 752L1443 764L1451 752', p.green, 3) +
    text(104, 735, 'Keep both results. Evidence applies to the tested conditions.', 24, p.muted))
  art += evidenceRecord(p, phase >= 3 ? 'Security checks + regression results' : 'Concern · conditions · observation · next step')
  return art
}

function governance(scene, phase, p) {
  let art = title(scene, p)
  const owners = [['AI', 'analyzes', p.green], ['Security', 'validates', p.blue], ['Engineering', 'fixes', p.blue], ['AI', 're-validates', p.green], ['Security', 'governs', p.blue]]
  owners.forEach(([owner, verb, accent], i) => {
    const x = 104 + i * 350
    art += box(x, 425, 310, 155, p.panel, p.line, 12) +
      line(`M${x + 25} 425H${x + 285}`, accent, 3) +
      text(x + 24, 477, owner, 31, p.ink, 'font-weight="500"') + text(x + 24, 534, verb, 28, accent)
    if (i < 4) art += arrow(x + 319, 506, x + 350, 506, p.connector)
  })
  art += appear(phase >= 1, label(104, 645, 'Developer self-service', p, p.green) +
    text(104, 687, 'Repeatable work and early feedback, within the operating model.', 28, p.ink))
  art += appear(phase >= 2, box(104, 738, 1710, 97, p.panel, p.blue, 10) +
    icon('person', 128, 759, p.blue, .84) +
    text(190, 778, 'SECOPS RISK AUTHORITY', 17, p.blue, 'font-weight="500" letter-spacing="2"') +
    text(190, 812, 'Critical risk     /     Exceptions     /     Policy     /     Risk acceptance', 26, p.ink))
  art += appear(phase >= 3, note('Accelerate the work. Preserve accountability.', p, p.blue))
  return art
}

function progress(scene, phase, p) {
  let art = title(scene, p, { y: 300, size: 66 }) +
    box(108, 465, 225, 56, 'none', p.amber, 28) + text(220, 502, 'IN PROGRESS', 20, p.amber, 'text-anchor="middle" font-weight="500" letter-spacing="2"') +
    text(108, 584, ['Build context.', 'Earn coverage.'], 33, p.ink, 'font-weight="500"')
  art += appear(phase >= 1, card(1050, 255, 460, 127, 'Define the area’s context', 'Architecture · permissions · intent', p) +
    card(1335, 504, 481, 127, 'Exercise and review', 'Findings + human judgment', p, p.blue) +
    card(877, 644, 440, 127, 'Refine the checks', 'Make the learning reusable', p) +
    line('M1515 319C1670 320 1650 425 1575 492', p.green, 3) +
    line('M1581 469L1575 492L1598 486', p.green, 3) +
    line('M1510 641C1480 725 1410 729 1330 711', p.green, 3) +
    line('M1353 706L1330 711L1349 725', p.green, 3))
  art += appear(phase >= 2, line('M1010 627C865 465 930 325 1036 318', p.green, 3) +
    line('M1016 309L1036 318L1016 330', p.green, 3) +
    text(1075, 510, ['Learn from', 'the work.'], 31, p.green, 'font-weight="500" text-anchor="middle"'))
  art += appear(phase >= 3, label(108, 781, 'Intended outcomes', p) +
    text(108, 818, ['Earlier feedback.', 'Less triage. Shorter cycles.'], 24, p.muted))
  return art
}

function closing(scene, phase, p, motion = closingPhaseState(phase)) {
  const { shift, flow, hero } = motion
  const x = 1610 - 1300 * shift
  const color = (a, b, mix) => '#' + [1, 3, 5].map(i => Math.round(
    parseInt(a.slice(i, i + 2), 16) * (1 - mix) + parseInt(b.slice(i, i + 2), 16) * mix
  ).toString(16).padStart(2, '0')).join('')
  const accent = color(p.amber, p.green, shift)
  let art = label(960, 208, 'HPE OpsRamp · AI-First Security', p, p.green).replace('<text ', '<text text-anchor="middle" ') +
    text(960, 302, scene.headline[0], 68 + 4 * hero, p.ink, 'text-anchor="middle" font-weight="500" letter-spacing="-2"') +
    text(960, 405, scene.headline[1], 68 + 4 * hero, p.green, 'text-anchor="middle" font-weight="500" letter-spacing="-2"')
  art += `<g id="shift-arrow" opacity="${shift * (1 - .5 * hero)}">` +
    line(`M1610 574H${x + 12}`, p.green, 3) +
    line(`M${x + 25} 563L${x + 12} 574L${x + 25} 585`, p.green, 3) + '</g>'
  art += `<g id="security-marker" data-x="${x}" transform="translate(${x} 0)">` +
    box(-115, 485, 230, 67, p.panel, accent, 34) +
    icon('boundary', -86, 502, accent, .68) +
    text(18, 528, 'Security', 28, p.ink, 'text-anchor="middle" font-weight="500"') +
    line('M0 555V610', accent, 3) + '</g>'
  art += line('M310 630H1610', p.connector, 3)
  art += `<path id="pipeline-feedback" d="M310 630H1610" fill="none" stroke="${p.green}" stroke-width="6" stroke-linecap="round" pathLength="1300" stroke-dasharray="1300" stroke-dashoffset="${1300 * (1 - flow)}" opacity="${flow > 0 ? 1 : 0}"/>`
  const stages = ['Design', 'Code', 'Build', 'Verify', 'Release']
  for (const [i, name] of stages.entries()) {
    const stageX = 310 + i * 325
    const lit = i === 0 ? shift : Math.max(0, Math.min(1, (flow - i / 4 + .04) / .04))
    art += `<g class="pipeline-stage" data-stage="${name}" data-lit="${lit}">` +
      `<circle cx="${stageX}" cy="630" r="14" fill="${p.bg}" stroke="${i === 4 && shift === 0 ? p.amber : p.connector}" stroke-width="3"/>` +
      `<circle cx="${stageX}" cy="630" r="14" fill="${p.bg}" stroke="${p.green}" stroke-width="4" opacity="${lit}"/>` +
      dot(stageX, 630, lit > .5 ? p.green : p.muted, 5) +
      text(stageX, 685, name, 29, p.ink, 'text-anchor="middle" font-weight="500"') + '</g>'
  }
  art += `<g id="closing-payoff" opacity="${hero}" transform="translate(0 ${12 * (1 - hero)})">` +
    text(960, 808, 'Security. Built in.', 42, p.ink, 'text-anchor="middle" font-weight="500" letter-spacing="-.8"') + '</g>'
  return art
}

const renderers = [question, handoff, developmentLoop, context, sandbox, evidence, verification, governance, progress, closing]

export function illustration(scene, phase = 3, { frame = true, fontStyle = '', motion } = {}) {
  if (!Number.isInteger(phase) || phase < 0 || phase > 3) throw new Error('Illustration phase must be 0–3')
  const p = palette(scene.theme)
  const header = box(108, 60, 94, 28, 'none', '#01a982', 0, 'style="stroke-width:8"') +
    text(231, 88, 'HPE OpsRamp', 27, p.ink, 'font-weight="500"') +
    text(1815, 86, 'AI-FIRST SECURITY', 16, p.muted, 'text-anchor="end" font-weight="500" letter-spacing="2.4"') +
    line('M104 123H1816', p.line, 1)
  const footer = line('M104 912H1816', p.line, 1) +
    line(`M104 912H${104 + (1712 * (scene.index + 1) / 10)}`, p.green, 3) +
    text(104, 943, 'OPERATING-MODEL ILLUSTRATION', 15, p.muted, 'letter-spacing="1.5"') +
    text(1010, 943, scene.captions[phase], 17, p.muted, 'text-anchor="middle"') +
    text(1816, 943, `${String(scene.index + 1).padStart(2, '0')} / 10`, 17, p.muted, 'text-anchor="end"')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-labelledby="title desc">
  <title id="title">${escape(scene.act)}</title><desc id="desc">${escape(scene.captions[phase])}. Conceptual operating model, not a product screenshot or test result.</desc>
  <defs><style>${fontStyle}text{font-family:Graphik,Arial,sans-serif}tspan{white-space:pre}</style>
  <radialGradient id="glow" cx="80%" cy="40%" r="70%"><stop offset="0" stop-color="${p.green}" stop-opacity="${scene.theme === 'light' ? .035 : .065}"/><stop offset="1" stop-color="${p.bg}" stop-opacity="0"/></radialGradient></defs>
  ${box(0, 0, 1920, 1080, p.bg, 'none', 0)}${box(0, 0, 1920, 1080, 'url(#glow)', 'none', 0)}
  ${frame ? header : ''}<g id="artwork">${renderers[scene.index](scene, phase, p, motion)}</g>${frame ? footer : ''}
  </svg>`
}

export const ILLUSTRATION_IDS = SCENES.map(scene => scene.id)
