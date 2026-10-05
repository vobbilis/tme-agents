import { FILM, SCENES } from '../../scenes.mjs'
import { PROJECT, projectRelative } from './project.mjs'
import { diagramTimeline, renderDiagram } from './diagram.mjs'

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const words = title => title.split(/\s+/).map(word =>
  `<span class="title-word">${escapeHtml(word)}</span>`
).join(' ')

const editableId = (scene, suffix) => `scene-${scene.id}-${suffix}`

const pointPills = scene => `
  <div class="point-row">
    ${scene.points.map(point => `<div class="point-pill detail-card">${escapeHtml(point)}</div>`).join('\n    ')}
  </div>`

const commonCopy = (scene, titleClass = '') => `
  <div class="eyebrow">${escapeHtml(scene.eyebrow)}</div>
  <h1 id="${editableId(scene, 'title')}" class="scene-title ${titleClass}">${words(scene.title)}</h1>
  <p id="${editableId(scene, 'support')}" class="scene-support">${escapeHtml(scene.support)}</p>
  <div class="accent-rule"></div>`

function hero(scene) {
  return `
    <div class="scene-body">
      ${commonCopy(scene, 'scene-title--hero')}
      ${pointPills(scene)}
    </div>`
}

function story(scene) {
  const nodes = [
    ['01', 'Treatment', 'Audience and argument'],
    ['02', 'Screenplay', 'Exact spoken story'],
    ['03', 'Shot plan', 'One visual job per beat'],
    ['04', 'Claims', 'Evidence and wording boundary']
  ]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="process-flow">
        ${nodes.map(([index, title, detail]) => `
          <div class="process-node detail-card">
            <span class="process-index">${index}</span>
            <strong>${title}</strong>
            <span>${detail}</span>
          </div>`).join('')}
      </div>
    </div>`
}

function source(scene) {
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="source-grid">
        <div class="source-card detail-card">
          <span class="source-card-label">Reel worktree</span>
          <strong>Story, timing, composition, verification</strong>
          <code>media/&lt;topic&gt;-reel</code>
        </div>
        <div class="source-link" data-layout-ignore>
          <span class="source-link-line"></span>
          <span>capture receipt</span>
        </div>
        <div class="source-card detail-card">
          <span class="source-card-label">Source worktree</span>
          <strong>The exact Digital Twin shown on screen</strong>
          <code>commit &lt;sha&gt;</code>
        </div>
      </div>
    </div>`
}

function product(scene, straight = false) {
  return `
    <div class="scene-body">
      <div class="split-layout">
        <div class="split-copy">
          ${commonCopy(scene)}
          ${pointPills(scene)}
        </div>
        <div class="product-stage">
          <div class="product-perspective ${straight ? 'product-perspective--straight' : ''}">
            <div class="product-float">
              <div class="browser-chrome">
                <div class="browser-dots" data-layout-ignore>
                  <span class="browser-dot"></span>
                  <span class="browser-dot"></span>
                  <span class="browser-dot"></span>
                </div>
                HPE OpsRamp · Digital Twin
              </div>
              <img
                class="product-image"
                src="${escapeHtml(scene.image)}"
                alt="Private Integrations page captured from the OpsRamp Digital Twin"
              />
              <div class="product-status">Actual Twin capture · fabricated data</div>
              <div class="product-highlight" data-layout-ignore></div>
              <div class="proof-badge">Source pinned</div>
            </div>
          </div>
        </div>
      </div>
    </div>`
}

function design(scene) {
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="design-grid">
        <div class="palette-panel detail-card">
          <div class="panel-label">Frame palette</div>
          <div class="swatch-row">
            <span class="swatch swatch--forest"></span>
            <span class="swatch swatch--green"></span>
            <span class="swatch swatch--warm"></span>
            <span class="swatch swatch--amber"></span>
          </div>
        </div>
        <div class="type-panel detail-card">
          <div class="panel-label">HPE Graphik</div>
          <div class="type-sample">One clear idea per frame.</div>
          <div class="type-detail">
            <span>Sentence case</span>
            <span>Large enough for video</span>
            <span>Evidence labelled</span>
          </div>
        </div>
      </div>
    </div>`
}

function motion(scene) {
  const cues = [
    ['Phrase', 'spoken boundary'],
    ['Action', 'visual response'],
    ['Result', 'meaning lands'],
    ['Hold', 'audience reads']
  ]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="cue-rail">
        ${cues.map(([title, detail]) => `
          <div class="cue-node detail-card">
            <div class="cue-dot"></div>
            <strong>${title}</strong>
            <span>${detail}</span>
          </div>`).join('')}
      </div>
    </div>`
}

function audio(scene) {
  const heights = [32, 56, 84, 48, 112, 70, 128, 54, 96, 142, 66, 118, 82, 46, 104, 62, 126, 76, 138, 54, 90, 44, 116, 68]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="audio-layout">
        <div class="wave-panel detail-card">
          <div class="panel-label">One synthesis stream</div>
          <div class="waveform" data-layout-ignore>
            ${heights.map(height => `<span class="wave-bar" style="--bar-height:${height}px"></span>`).join('')}
          </div>
          <div class="audio-meta">
            <span>Andrew Multilingual Neural</span>
            <span>+2%</span>
          </div>
        </div>
        <div class="caption-panel detail-card">
          <div class="panel-label">Selectable captions</div>
          <div class="caption-preview">The audio and word timings share one fingerprint.</div>
          <div class="caption-meta">Two lines maximum · ordered · bounded by the scene</div>
        </div>
      </div>
    </div>`
}

function assembly(scene) {
  const tracks = [
    ['Scenes', '6%', '86%', ''],
    ['Narration', '10%', '79%', 'track-clip--audio'],
    ['Chapters + captions', '3%', '94%', 'track-clip--finish']
  ]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="track-stack">
        ${tracks.map(([name, left, width, extra]) => `
          <div class="track-row detail-card">
            <div class="track-name">${name}</div>
            <div class="track-lane">
              <div class="track-clip ${extra}" style="--clip-left:${left};--clip-width:${width}"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>`
}

function checks(scene) {
  const checks = [
    ['Composition', 'Runtime, layout, motion, contrast, caption clearance.'],
    ['Encoded media', 'Duration, streams, chapters, captions, loudness, decode.'],
    ['Human review', 'Pronunciation, fatigue, emphasis, and whether the story lands.']
  ]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="check-grid">
        ${checks.map(([title, detail]) => `
          <div class="check-card detail-card">
            <div class="check-icon">✓</div>
            <strong>${title}</strong>
            <p>${detail}</p>
          </div>`).join('')}
      </div>
    </div>`
}

function handover(scene) {
  const cards = [
    ['Plan', 'Brief and screenplay', 'What was approved'],
    ['Source', 'Commit and capture receipt', 'What the audience sees'],
    ['Build', 'Pinned tools and commands', 'How to reproduce it'],
    ['Status', 'Checks and open review', 'What remains']
  ]
  return `
    <div class="scene-body">
      ${commonCopy(scene)}
      <div class="handover-grid">
        ${cards.map(([label, title, detail]) => `
          <div class="handover-card detail-card">
            <span>${label}</span>
            <strong>${title}</strong>
            <p>${detail}</p>
          </div>`).join('')}
      </div>
    </div>`
}

function closing(scene) {
  return `
    <div class="closing-layout">
      ${commonCopy(scene, 'scene-title--hero')}
      <div class="closing-proof">
        ${scene.points.map(point => `<span class="detail-card">${escapeHtml(point)}</span>`).join('')}
      </div>
    </div>`
}

function sceneBody(scene) {
  switch (scene.kind) {
    case 'hero': return hero(scene)
    case 'story': return story(scene)
    case 'source': return source(scene)
    case 'product': return product(scene)
    case 'design': return design(scene)
    case 'perspective': return product(scene)
    case 'motion': return motion(scene)
    case 'audio': return audio(scene)
    case 'assembly': return assembly(scene)
    case 'checks': return checks(scene)
    case 'handover': return handover(scene)
    case 'closing': return closing(scene)
    case 'diagram': return renderDiagram(scene)
    default: return hero(scene)
  }
}

function animation(scene, duration, timelineScene) {
  const sceneNumber = String(SCENES.findIndex(item => item.id === scene.id) + 1).padStart(2, '0')
  return `
    (() => {
      const root = document.querySelector('[data-composition-id="${scene.id}"]')
      const one = selector => root.querySelector(selector)
      const all = selector => [...root.querySelectorAll(selector)]
      const duration = ${duration.toFixed(3)}
      const tl = gsap.timeline({ paused: true })
      const titleWords = all('.title-word')

      tl.fromTo(one('.frame-header'), { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0)
      titleWords.forEach((word, index) => {
        const at = 0.20 + index * 0.055
        const travel = index === 0 ? 72 : index === titleWords.length - 1 ? 38 : 48
        const settle = index === 0 ? 0.19 : index === titleWords.length - 1 ? 0.12 : 0.15
        tl.set(word, { opacity: 1, y: travel }, at)
        tl.to(word, { y: 0, duration: settle, ease: 'power4.out' }, at)
      })
      tl.fromTo(
        one('.scene-support'),
        { opacity: 0, x: -26 },
        { opacity: 1, x: 0, duration: 0.58, ease: 'power2.out' },
        0.86
      )
      tl.fromTo(
        one('.accent-rule'),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.54, ease: 'power2.out' },
        1.05
      )
      const details = all('.detail-card')
      if (details.length) {
        tl.fromTo(
          details,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.5, stagger: Math.min(0.12, 0.48 / details.length), ease: 'power2.out' },
          1.25
        )
      }
      tl.fromTo(one('.frame-footer'), { opacity: 0 }, { opacity: 1, duration: 0.45 }, 1.42)
      tl.fromTo(
        one('.scene-progress'),
        { scaleX: 0 },
        { scaleX: 1, duration: ${duration.toFixed(3)}, ease: 'none' },
        0
      )
      tl.fromTo(
        one('.ambient-grid'),
        { x: -22, y: -12, opacity: ${scene.theme === 'light' ? 0.34 : 0.22} },
        { x: 24, y: 14, opacity: ${scene.theme === 'light' ? 0.52 : 0.38}, duration: ${duration.toFixed(3)}, ease: 'sine.inOut' },
        0
      )
      const ambientOrb = one('.ambient-orb')
      tl.fromTo(
        ambientOrb,
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 0.30, duration: 1.2, ease: 'power2.out' },
        0.2
      )
      const ambientPhase = { p: 0 }
      const ambientCycles = Math.max(1, Math.floor((${duration.toFixed(3)} - 1.4) / 7))
      tl.to(
        ambientPhase,
        {
          p: Math.PI * 2 * ambientCycles,
          duration: ${Math.max(0.1, duration - 1.4).toFixed(3)},
          ease: 'none',
          onUpdate: () => {
            const value = Math.sin(ambientPhase.p)
            ambientOrb.style.opacity = String(0.30 + value * 0.025)
            ambientOrb.style.transform = 'scale(' + (1 + value * 0.018) + ')'
          }
        },
        1.4
      )

      const product = one('.product-float')
      if (product) {
        tl.fromTo(product, { opacity: 0, x: 68 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 0.62)
        tl.to(product, { y: -8, duration: ${Math.max(4, duration * 0.44).toFixed(3)}, ease: 'sine.inOut' }, 1.8)
        tl.to(product, { y: 8, duration: ${Math.max(4, duration * 0.45).toFixed(3)}, ease: 'sine.inOut' })
        const highlight = one('.product-highlight')
        tl.fromTo(highlight, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power1.out', immediateRender: false }, ${Math.max(4, duration * 0.23).toFixed(3)})
        tl.to(highlight, { opacity: 0, duration: 0.4 }, ${Math.max(5, duration * 0.34).toFixed(3)})
        tl.fromTo(highlight, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, ${Math.max(8, duration * 0.64).toFixed(3)})
        tl.to(highlight, { opacity: 0, duration: 0.4 }, ${Math.max(9, duration * 0.76).toFixed(3)})
      }

      const sourceLine = one('.source-link-line')
      if (sourceLine) {
        tl.fromTo(sourceLine, { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.out' }, ${Math.max(3, duration * 0.28).toFixed(3)})
      }

      const cueDots = all('.cue-dot')
      cueDots.forEach((dot, index) => {
        const at = duration * (0.18 + index * 0.18)
        tl.to(dot, { borderColor: '#3ee6b4', backgroundColor: '#01a982', scale: 1.12, duration: 0.32, ease: 'power2.out' }, at)
        tl.to(dot, { scale: 1, duration: 0.28, ease: 'power2.inOut' }, at + 0.32)
      })

      const bars = all('.wave-bar')
      if (bars.length) {
        tl.fromTo(bars, { scaleY: 0.15 }, { scaleY: 1, duration: 0.7, stagger: 0.018, ease: 'power3.out' }, 1.45)
        bars.filter((_bar, index) => index % 3 === 0).forEach((bar, index) => {
          tl.to(bar, { scaleY: 0.58 + (index % 4) * 0.08, duration: 0.7, ease: 'sine.inOut' }, duration * (0.25 + (index % 3) * 0.18))
        })
      }

      const trackClips = all('.track-clip')
      if (trackClips.length) {
        tl.fromTo(trackClips, { scaleX: 0 }, { scaleX: 1, duration: 1.15, stagger: 0.16, transformOrigin: 'left center', ease: 'power2.out' }, 1.62)
      }

      const checkIcons = all('.check-icon')
      if (checkIcons.length) {
        tl.fromTo(checkIcons, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.42, stagger: 0.18, ease: 'back.out(1.8)' }, 1.8)
      }

${scene.kind === 'diagram' ? diagramTimeline(scene, timelineScene) : ''}
      window.__timelines['${scene.id}'] = tl
      root.dataset.sceneNumber = '${sceneNumber}'
    })();`
}

export function renderSubcomposition(scene, timelineScene) {
  const { duration, index } = timelineScene
  return `<!-- generated by scripts/build.mjs; edit scenes.mjs or assets/opsramp.css -->
<template id="${scene.id}-template">
  <div
    data-composition-id="${scene.id}"
    data-width="${FILM.width}"
    data-height="${FILM.height}"
    data-duration="${duration.toFixed(3)}"
    data-fps="${FILM.fps}"
    style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden"
  >
    <div
      id="${editableId(scene, 'root')}"
      class="clip scene scene--${scene.theme} scene--${scene.kind}"
      data-start="0"
      data-duration="${duration.toFixed(3)}"
      data-track-index="0"
    >
      <div class="ambient-grid" data-layout-ignore></div>
      <div class="ambient-orb" data-layout-ignore></div>
      <div class="scene-progress" data-layout-ignore></div>
      <div class="scene-inner">
        <header class="frame-header">
          <div class="brand-lockup"><span class="brand-mark" data-layout-ignore></span>HPE OpsRamp</div>
          <div class="chapter-label">${String(index).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')} · ${escapeHtml(scene.chapter)}</div>
        </header>
        ${sceneBody(scene)}
      </div>
      <footer class="frame-footer" data-layout-allow-caption-zone>
        <span class="status-chip">${escapeHtml(scene.status)}</span>
        <span class="timecode">${timelineScene.start.toFixed(1)}s</span>
      </footer>
    </div>
    <script>
      ${animation(scene, duration, timelineScene)}
    </script>
  </div>
</template>
`
}

export function renderMotionSidecar(scene, timelineScene) {
  return {
    duration: Number(timelineScene.duration.toFixed(3)),
    assertions: [
      { kind: 'appearsBy', selector: `#${editableId(scene, 'title')} .title-word:first-child`, bySec: 0.8 },
      { kind: 'appearsBy', selector: `#${editableId(scene, 'support')}`, bySec: 1.8 },
      {
        kind: 'before',
        a: `#${editableId(scene, 'title')} .title-word:first-child`,
        b: `#${editableId(scene, 'support')}`
      },
      { kind: 'staysInFrame', selector: `#${editableId(scene, 'title')}` },
      { kind: 'keepsMoving', withinSelector: '.scene', maxStaticSec: 12 }
    ]
  }
}

export function renderIndex(timeline) {
  const hosts = timeline.scenes.map((scene, index) => `
      <div
        id="slot-${scene.id}"
        class="scene-slot"
        data-composition-id="${scene.id}"
        data-composition-src="compositions/${scene.id}.html"
        data-start="${scene.start.toFixed(3)}"
        data-duration="${scene.duration.toFixed(3)}"
        data-track-index="${index % 2 + 1}"
        data-width="${FILM.width}"
        data-height="${FILM.height}"
        style="opacity:${index === 0 ? 1 : 0}"
      ></div>`).join('\n')

  const audio = timeline.scenes.filter(scene => scene.audio).map(scene => `
      <audio id="voice-${scene.id}" src="${escapeHtml(projectRelative(scene.audio))}" data-audio-group="voiceover" data-start="${scene.audioStart.toFixed(3)}" data-duration="${scene.voiceDuration.toFixed(3)}" data-track-index="20" data-volume="1"></audio>`).join('\n')

  const transitions = timeline.transitions.map(transition => `
      tl.fromTo(document.querySelector('#slot-${transition.to}'), { opacity: 0 }, { opacity: 1, duration: ${transition.duration}, ease: 'power2.inOut', immediateRender: false }, ${transition.start.toFixed(3)})
      tl.fromTo(document.querySelector('#slot-${transition.from}'), { opacity: 1 }, { opacity: 0, duration: ${transition.duration}, ease: 'power2.inOut', immediateRender: false }, ${transition.start.toFixed(3)})`).join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${FILM.width}, height=${FILM.height}" />
    <title>${escapeHtml(FILM.title)}</title>
    <link rel="stylesheet" href="./assets/opsramp.css" />
    <script src="./assets/vendor/gsap.min.js"></script>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="${FILM.id}"
      data-start="0"
      data-duration="${timeline.duration.toFixed(3)}"
      data-width="${FILM.width}"
      data-height="${FILM.height}"
      data-fps="${FILM.fps}"
    >
      <hf-audio-group id="voiceover" data-label="Voiceover" data-volume="1"></hf-audio-group>
${hosts}
${audio}
    </div>
    <script>
      (() => {
        const tl = gsap.timeline({ paused: true })
${transitions}
        window.__timelines['${FILM.id}'] = tl
      })();
    </script>
  </body>
</html>
`
}

export function renderStoryboard(timeline) {
  const frames = timeline.scenes.map(scene => `## Frame ${scene.index} — ${scene.chapter}

- status: animated
- src: compositions/${scene.id}.html
- duration: ${scene.duration.toFixed(3)}s
- transition_in: ${scene.index === 1 ? 'cut' : 'crossfade'}
- scene: ${JSON.stringify(scene.title)}
- voiceover: ${JSON.stringify(scene.vo)}
- poster: ${Math.min(4, Math.max(1.8, scene.duration * 0.18)).toFixed(2)}s
- motion_rules: waterfall-entry, ambient-glow-bloom
- evidence: ${scene.image ? scene.image : scene.status}

${scene.support}
`).join('\n')

  return `---
format: ${FILM.width}x${FILM.height}
duration: ${Math.round(timeline.duration)}s
message: ${JSON.stringify(FILM.message)}
arc: ${FILM.arc}
audience: ${FILM.audience}
mode: autonomous
music: none
---

# Storyboard — ${FILM.title}

${FILM.subtitle}

${frames}`
}

export function renderScript(timeline) {
  const lines = timeline.scenes.map(scene => `## Line ${scene.index} — ${scene.chapter} (Frame ${scene.index})

**Time:** ${scene.start.toFixed(1)} – ${scene.end.toFixed(1)}s
**Delivery:** Calm, direct, technical, and unhurried.

    ${scene.vo}
`).join('\n')

  return `# SCRIPT — ${FILM.title}

**Voice:** Microsoft Edge TTS · ${FILM.voice}
**Voice settings:** ${FILM.rate} · WordBoundary metadata
**Voice direction:** Plain English. Confident because the evidence is clear, not promotional.

---

${lines}`
}
