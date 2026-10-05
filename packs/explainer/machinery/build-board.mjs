import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launchCamera } from './lib/camera.mjs'
import { illustration, escape, palette } from './illustrations.mjs'
import { checkPreserved, contrast, hashFile, readJSON, scriptHash, visualHash } from './production.mjs'
import { DIR, OUT, REPO, SCENES, SIZE, WORD_COUNT, VERSION, NAME, TITLE, VOICE_OFFSET } from './story.mjs'

for (const directory of [OUT, resolve(OUT, 'plates'), resolve(DIR, 'illustrations')]) mkdirSync(directory, { recursive: true })
const preservation = checkPreserved()
const sourceFingerprint = visualHash()
const contrasts = ['dark', 'light'].map(theme => {
  const p = palette(theme)
  const ratio = contrast(p.connector, p.bg)
  if (ratio < 3) throw new Error(`${theme} semantic connectors below 3:1`)
  return { theme, foreground: p.connector, background: p.bg, ratio }
})
const fontStyle = ['Regular', 'Medium', 'Bold'].map((weight, i) => {
  const font = readFileSync(resolve(DIR, `assets/fonts/HPEGraphik-${weight}.otf`)).toString('base64')
  return `@font-face{font-family:Graphik;src:url(data:font/otf;base64,${font});font-weight:${[400, 500, 700][i]};font-display:block}`
}).join('')

const browser = await launchCamera()
const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 })
// Artwork has embedded local fonts. No external asset or product traffic exists.
const externalRequests = []
await context.route('**/*', route => {
  if (route.request().url().startsWith(pathToFileURL(DIR).href + '/')) return route.continue()
  externalRequests.push(route.request().url())
  return route.abort()
})
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const probes = []
try {
  for (const scene of SCENES) {
    for (let phase = 0; phase < 4; phase++) {
      const svg = illustration(scene, phase, { fontStyle })
      const id = `${scene.id}-${phase}`
      writeFileSync(resolve(OUT, 'plates', `${id}.svg`), svg)
      if (phase === 3) writeFileSync(resolve(DIR, 'illustrations', `${scene.id}.svg`), svg)
      const xml = spawnSync('xmllint', ['--noout', '-'], { input: svg, encoding: 'utf8' })
      if (xml.status !== 0) throw new Error(`Invalid standalone XML ${id}: ${xml.stderr}`)
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontStyle}html,body{margin:0;width:1920px;height:1080px;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`)
      await page.evaluate(async () => {
        await Promise.all([400, 500, 700].map(weight => document.fonts.load(`${weight} 24px Graphik`)))
        await document.fonts.ready
      })
      const layout = await page.evaluate(() => {
        const issues = [], boxes = []
        for (const el of document.querySelectorAll('[data-fit]')) {
          let visible = true
          for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
            if (Number(getComputedStyle(ancestor).opacity) === 0) { visible = false; break }
          }
          if (!visible) continue
          const b = el.getBoundingClientRect()
          const item = { text: el.textContent, x: b.x, y: b.y, w: b.width, h: b.height }
          boxes.push(item)
          if (b.x < 86 || b.right > 1838 || b.y < 42 || b.bottom > 951) issues.push(item)
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j]
          const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
          const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
          if (w > 4 && h > 4) issues.push({ overlap: [a.text, b.text], w, h })
        }
        const record = document.getElementById('evidence-record')
        const recordBox = record?.getBoundingClientRect()
        return { issues, boxes, fontsReady: [400, 500, 700].every(w => document.fonts.check(`${w} 24px Graphik`)),
          contentBottom: Math.max(...boxes.map(b => b.y + b.h)),
          evidenceRecord: recordBox ? { identity: record.dataset.record, x: recordBox.x, y: recordBox.y, width: recordBox.width, height: recordBox.height,
            visible: Number(getComputedStyle(record.parentElement).opacity) > 0 } : null }
      })
      await page.screenshot({ path: resolve(OUT, 'plates', `${id}.png`), animations: 'disabled' })
      const caption = await page.evaluate(() => {
        const el = document.createElement('div')
        el.textContent = 'Could a read-only user change a setting?\nKeep the evidence with the investigation.'
        el.style.cssText = 'position:absolute;left:0;top:965px;width:1920px;text-align:center;white-space:pre;font:32px/41px Graphik;color:white;background:#071f23'
        document.body.append(el)
        const box = el.getBoundingClientRect()
        const result = { top: box.top, bottom: box.bottom }
        el.remove()
        return result
      })
      if (caption.top - layout.contentBottom < 12 || caption.bottom > 1065)
        throw new Error(`Caption clearance failed: ${id}`)
      probes.push({ id, ...layout, caption, xmlValid: true,
        pngSha256: hashFile(resolve(OUT, 'plates', `${id}.png`)), svgSha256: hashFile(resolve(OUT, 'plates', `${id}.svg`)) })
      if (layout.issues.length || !layout.fontsReady) throw new Error(`Illustration overflow/font issue ${id}: ${JSON.stringify(layout.issues)}`)
    }
    console.log(`Illustrated ${scene.id}: four progressive plates`)
  }
  const timing = existsSync(resolve(OUT, 'timing.json')) ? readJSON(resolve(OUT, 'timing.json')) : null
  const narration = existsSync(resolve(OUT, 'narration.json')) ? readJSON(resolve(OUT, 'narration.json')) : null
  const currentTiming = timing?.version === VERSION && narration?.scriptHash === scriptHash() ? timing : null
  const cards = SCENES.map(scene => {
    const seconds = scene.words / 153 * 60 + VOICE_OFFSET + scene.tail
    const measured = currentTiming?.scenes.find(s => s.id === scene.id)
    const timeLabel = measured ? `${measured.duration.toFixed(2)}s measured${scene.animation ? ' · animated close' : ''}` : `~${Math.round(seconds)}s estimated`
    return `<article id="${scene.id}"><div class="art"><img src="illustrations/${scene.id}.svg" alt="${escape(scene.captions[3])}"></div><div class="detail"><span class="eyebrow">${String(scene.index + 1).padStart(2, '0')} / 10 · ${scene.words} words · ${timeLabel}</span><h2>${escape(scene.act)}</h2><p>${escape(scene.vo)}</p><ol>${scene.captions.map((value, phase) => `<li><a href="out/plates/${scene.id}-${phase}.png">${escape(value)}</a></li>`).join('')}</ol><a href="illustrations/${scene.id}.svg">Open editable illustration ↗</a></div></article>`
  }).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(TITLE)} — illustrated storyboard</title><style>${fontStyle}
  *{box-sizing:border-box}body{margin:0;background:#071f23;color:#f2f7f3;font:17px/1.6 Graphik,Arial,sans-serif}main{max-width:1540px;margin:auto;padding:65px 42px 100px}.brand{width:96px;height:32px;border:7px solid #01a982;margin-bottom:30px}.eyebrow{color:#a9c6c4;font-size:13px;letter-spacing:1.5px;text-transform:uppercase}h1{font-size:clamp(36px,5vw,68px);line-height:1.08;font-weight:500;letter-spacing:-2.5px;margin:16px 0 22px}h1 span{color:#58e7ba}.intro{max-width:940px;color:#a9c6c4;font-size:21px}nav{display:flex;flex-wrap:wrap;gap:14px;margin:32px 0 40px}a{color:#58e7ba;text-decoration:none}nav a{border:1px solid #33595a;border-radius:25px;padding:9px 17px;font-size:14px}article{margin:40px 0 70px;border:1px solid #33595a;border-radius:15px;overflow:hidden;background:#102e32;scroll-margin-top:24px}.art{background:#071f23}.art img{display:block;width:100%;height:auto}.detail{padding:32px 38px;display:grid;grid-template-columns:1.45fr 1fr;gap:14px 56px}.detail .eyebrow,.detail h2{grid-column:1/-1}.detail h2{font-size:30px;font-weight:500;margin:0}.detail p{margin:0;color:#d6e6df}.detail ol{margin:0;padding-left:24px;color:#a9c6c4}.detail a{grid-column:1/-1;font-size:15px}.notice{border-left:3px solid #ffc875;padding:14px 22px;background:#102e32;color:#d6e6df}.status{font-size:15px;color:#a9c6c4}@media(max-width:850px){main{padding:30px 16px}.detail{display:block;padding:24px}.detail>*{margin-bottom:18px!important}}@media print{body{background:white;color:black}main{padding:0}nav{display:none}article{break-inside:avoid}.detail{display:block}.detail p{color:black}.detail ol{color:#333}}
  </style></head><body><main><div class="brand" aria-label="HPE brand mark"></div><div class="eyebrow">HPE OpsRamp · Shift-left SecOps · Illustrated story reel</div><h1>OpsRamp's<br><span>Shift-left SecOps.</span></h1><p class="intro">Pulling security upstream: the regular AI-First SDLC workflow, customized for vulnerability scanning, remediation, and verification inside the development pipeline.</p><p class="status">${WORD_COUNT} words · ten chapters · forty key states · animated shift-left close · target 5–6 minutes</p><div class="notice">Self-contained operating-model story with a hypothetical permissions example and animated closing. No product screenshots, security findings, or measured results.</div><nav><a href="SCRIPT.md">Narration script</a><a href="STORYBOARD.md">Storyboard</a><a href="SCREENPLAY.md">Production screenplay</a>${existsSync(resolve(OUT, `${NAME}.mp4`)) ? `<a href="out/${NAME}.mp4">Rendered story reel</a><a href="out/review.html">Captioned review player</a>` : '<span>Movie production in progress</span>'}${SCENES.map(scene => `<a href="#${scene.id}">${String(scene.index + 1).padStart(2, '0')}</a>`).join('')}</nav>${cards}</main></body></html>`
  writeFileSync(resolve(DIR, 'storyboard.html'), html)
  await page.goto(pathToFileURL(resolve(DIR, 'storyboard.html')).href)
  const imageLoads = await page.evaluate(async () => Promise.all([...document.images].map(async img => {
    await img.decode()
    return { src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth === 1920 && img.naturalHeight === 1080 }
  })))
  if (imageLoads.length !== 10 || imageLoads.some(img => !img.loaded)) throw new Error('Storyboard image load failure')
  const standalone = []
  for (const scene of SCENES) {
    await page.goto(pathToFileURL(resolve(DIR, 'illustrations', `${scene.id}.svg`)).href)
    const ok = await page.evaluate(() => document.documentElement.localName === 'svg' && !document.querySelector('parsererror'))
    if (!ok) throw new Error(`Standalone SVG load failure: ${scene.id}`)
    standalone.push({ id: scene.id, loaded: ok })
  }
  if (errors.length || externalRequests.length) throw new Error(`Unexpected artwork errors/network: ${JSON.stringify({ errors, externalRequests })}`)
  checkPreserved()
  writeFileSync(resolve(OUT, 'illustration-report.json'), JSON.stringify({ version: VERSION, generatedAt: new Date().toISOString(), sourceFingerprint, scenes: SCENES.length, plates: probes.length, probes, errors, externalRequests, contrasts, imageLoads, standalone, preserved: preservation, fontsEmbedded: true, passed: true }, null, 2))
  console.log('Illustrated storyboard complete: demo/secops-ai-first-reel/storyboard.html')
} finally {
  await context.close()
  await browser.close()
}
