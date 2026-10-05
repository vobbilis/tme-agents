import { FILM, SCENES } from '../../scenes.mjs'
import { PROJECT, projectRelative, readJson } from './project.mjs'
import { resolve } from 'node:path'
import { cameraForBox, resolvePoints, sceneShots } from './shots.mjs'

const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const timecode = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
const boundary = {
  s03: '/jira-ticket-creation',
  s06: 'PRODUCT REQUIREMENTS DOCUMENT',
  s07: 'EDITED EXCERPTS - earlier design discussion included',
  s10: 'SQL VALIDATION HARNESS',
  s12: 'RELEASE RECONCILIATION',
  s13: 'LOCAL COMMIT - push access blocked',
  s14: 'PROPOSED RETURN HANDOFF'
}
const missingTitles = {
  s01: 'Operating-model walkthrough', s08: 'Another engineer picks up the work',
  s09: "Second engineer's continuation", s11: 'Independent final-candidate review',
  s14: 'Engineering instrumentation', s15: 'Operating-model return and recorded recap'
}

export function renderSubcomposition(scene, timing) {
  const points = resolvePoints(scene, timing)
  const shots = sceneShots(scene, timing)
  const focus = readJson(resolve(PROJECT, 'assets/focus.json'))
  const media = shots.map(shot => `<div class="shot" id="shot-${shot.id}">${shot.pending
    ? `<div class="tbd"><div class="kicker">FIRST CUT / RECORDING PENDING</div><strong>TBD</strong><div class="label">${escapeHtml(missingTitles[scene.id])}</div><div class="detail">${escapeHtml(scene.pending.join(' / '))} - reserved for the next cut</div></div>`
    : `<div class="camera" id="camera-${shot.id}"><video id="video-${shot.id}" class="clip" src="${shot.asset}" data-start="${shot.start.toFixed(3)}" data-duration="${shot.duration.toFixed(3)}" data-media-start="0" data-track-index="2" muted playsinline preload="metadata"></video></div><div class="source-label">${escapeHtml(shot.owner)} / ${timecode(shot.sourceStart)} / ${shot.holdLastFrame ? `recorded excerpt <span id="hold-${shot.id}"> / HELD FRAME</span>` : 'excerpt at 1x'}</div>`}
    </div>`).join('\n')
  const motion = shots.map(shot => {
    const track = shot.pending ? null : focus[shot.id]
    if (!shot.pending && (!track || Math.abs(track.duration - shot.duration) > 0.01))
      throw new Error(`${shot.id}: regenerate source focus tracking for this excerpt`)
    const boxes = track?.samples.filter(sample => sample.box).map(sample => sample.box) ?? []
    const left = Math.min(...boxes.map(box => box.x))
    const top = Math.min(...boxes.map(box => box.y))
    const camera = shot.pending ? null : cameraForBox({
      x: left, y: top,
      width: Math.max(...boxes.map(box => box.x + box.width)) - left,
      height: Math.max(...boxes.map(box => box.y + box.height)) - top
    })
    const holdAfter = shot.holdLastFrame ? readJson(resolve(PROJECT, `${shot.asset}.json`)).holdAfter : null
    return `tl.set('#shot-${shot.id}', {opacity: 1}, ${shot.start});
      tl.set('#shot-${shot.id}', {opacity: 0}, ${shot.start + shot.duration});
      ${holdAfter === null ? '' : `tl.set('#hold-${shot.id}', {opacity:0}, 0);tl.set('#hold-${shot.id}', {opacity:1}, ${shot.start + holdAfter});`}
      ${shot.pending ? '' : `tl.set('#camera-${shot.id}', ${JSON.stringify(camera)}, ${shot.start});`}`
  }).join('\n')
  return `<template id="${scene.id}">
  <div data-composition-id="${scene.id}" data-width="1920" data-height="1080" data-duration="${timing.duration.toFixed(3)}" data-fps="30" style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden">
    <div class="surface ${scene.theme}" id="surface-${scene.id}">
      <div class="brand"><span class="brand-mark" data-layout-ignore></span>HPE OpsRamp</div>
      <div class="chapter">${String(timing.index).padStart(2, '0')} / 15 &nbsp; ${escapeHtml(scene.chapter)}</div>
      <div class="evidence" id="evidence-${scene.id}">${media}${boundary[scene.id] ? `<div class="boundary">${escapeHtml(boundary[scene.id])}</div>` : ''}</div>
      <div class="panel" id="panel-${scene.id}"><h1 id="title-${scene.id}">${escapeHtml(scene.title)}</h1>${points.map((point, index) => `<div class="point" id="point-${scene.id}-${index}"><div class="point-number">${String(index + 1).padStart(2, '0')}</div>${escapeHtml(point.text)}</div>`).join('')}</div>
      <div class="status" data-layout-allow-caption-zone><strong>DRAFT 03 / ${escapeHtml(scene.status)}</strong><span>${timecode(timing.start)} / ${timecode(FILM.minimumDurationSeconds)}</span></div>
      <div class="progress" id="progress-${scene.id}" data-layout-ignore></div>
    </div>
    <script>(() => {
      const tl = gsap.timeline({paused: true});
      ${motion}
      ${points.map((point, index) => `tl.fromTo('#point-${scene.id}-${index}', {opacity: 0}, {opacity: 1, duration: 0.35}, ${point.at.toFixed(3)});`).join('\n')}
      tl.fromTo('#progress-${scene.id}', {scaleX: 0}, {scaleX: 1, duration: ${timing.duration}, ease: 'none'}, 0);
      ${scene.id === 's02' ? `tl.fromTo('#evidence-${scene.id}', {scale: 1.644, x: -64, y: -165}, {scale: 1, x: 0, y: 0, duration: 1.1, ease: 'power2.inOut'}, 0.6);
      tl.fromTo('#surface-${scene.id} .brand, #surface-${scene.id} .chapter', {opacity: 0}, {opacity: 1, duration: 0.25}, 1.7);
      tl.fromTo('#panel-${scene.id}', {opacity: 0}, {opacity: 1, duration: 0.25}, 1.7);` : ''}
      window.__timelines['${scene.id}'] = tl;
    })();</script>
  </div>
</template>`
}

export function renderIndex(timeline) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><title>${escapeHtml(FILM.title)}</title><link rel="stylesheet" href="assets/opsramp.css"><script src="assets/vendor/gsap.min.js"></script></head><body>
  <div id="root" data-composition-id="${FILM.id}" data-width="1920" data-height="1080" data-duration="${FILM.minimumDurationSeconds}" data-fps="30">
  ${timeline.scenes.map((scene, index) => `<div id="${scene.id}" class="scene-slot" data-composition-id="${scene.id}" data-composition-src="compositions/${scene.id}.html" data-start="${scene.start.toFixed(3)}" data-duration="${scene.duration.toFixed(3)}" data-track-index="${index % 2 + 1}" data-width="1920" data-height="1080" style="opacity:${index === 0 ? 1 : 0}"></div>`).join('\n')}
  ${timeline.scenes.filter(scene => scene.audio).map(scene => `<audio id="voice-${scene.id}" src="${projectRelative(scene.audio)}" data-start="${scene.audioStart.toFixed(3)}" data-duration="${scene.voiceDuration.toFixed(3)}" data-volume="1" data-track-index="20"></audio>`).join('\n')}
  </div><script>(() => {const tl=gsap.timeline({paused:true});
  ${timeline.transitions.map(transition => `tl.fromTo('#${transition.to}', {opacity:0}, {opacity:1,duration:${transition.duration},ease:'power2.inOut',immediateRender:false},${transition.start});tl.fromTo('#${transition.from}',{opacity:1},{opacity:0,duration:${transition.duration},ease:'power2.inOut',immediateRender:false},${transition.start});`).join('\n')}
  window.__timelines['${FILM.id}']=tl;})();</script></body></html>`
}

export function renderMotionSidecar(scene, timing) {
  return { duration: timing.duration, assertions: [{ kind: 'staysInFrame', selector: `#title-${scene.id}` }] }
}

export function renderStoryboard(timeline) {
  return `# ${FILM.title} — GENERATED assembly\n\n${FILM.sourceStatus}\n\nEditorial source: ../STORYBOARD_REVIEW.md. Generated file — edit the screenplay, not this.\n\n` + timeline.scenes.map(scene => `## Frame ${scene.index}: ${scene.chapter}\n\n- src: compositions/${scene.id}.html\n- status: animated\n- duration: ${scene.duration.toFixed(3)}s\n- motion_rules: word-cued opacity, fixed crops, crossfade\n- evidence: ${scene.status}\n`).join('\n')
}

export function renderScript(timeline) {
  return `# Third-cut narration\n\nAndrew Multilingual Neural, ${FILM.rate}. Warm, competent senior architect.\nOpening invitation: genuine lift and forward energy, not a presenter flourish.\n\n` + timeline.scenes.map(scene => `## ${scene.chapter}\n\n${scene.vo}\n`).join('\n')
}