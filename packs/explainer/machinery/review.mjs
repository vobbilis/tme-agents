// Build a self-contained local review UI. Captions are embedded for file://
// use as well as supplied as SRT/VTT and selectable tracks in the master.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launchCamera } from './lib/camera.mjs'
import { DIR, OUT, NAME, TITLE, REPO, VERSION } from './story.mjs'
import { readJSON, hashFile, sourceHash, checkPreserved } from './production.mjs'

const timeline = readJSON(resolve(OUT, 'timing.json'))
const verification = readJSON(resolve(OUT, 'verification-report.json'))
if (!verification.technicalPass || verification.version !== VERSION || verification.sha256 !== hashFile(resolve(OUT, `${NAME}.mp4`)))
  throw new Error('Verify the current encoded master before building the delivery review player')
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
const durationLabel = `${clock(timeline.duration)}.${Math.round((timeline.duration % 1) * 10)}`
const data = JSON.stringify({ duration: timeline.duration, captions: timeline.captions,
  scenes: timeline.scenes.map(({ id, start, end }) => ({ id, start, end })) }).replaceAll('<', '\\u003c')
const font = readFileSync(resolve(DIR, 'assets/fonts/HPEGraphik-Regular.otf')).toString('base64')
const medium = readFileSync(resolve(DIR, 'assets/fonts/HPEGraphik-Medium.otf')).toString('base64')
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(TITLE)} — story reel review</title><style>
@font-face{font-family:Graphik;src:url(data:font/otf;base64,${font});font-weight:400}
@font-face{font-family:Graphik;src:url(data:font/otf;base64,${medium});font-weight:500}
*{box-sizing:border-box}body{margin:0;background:#071f23;color:#f2f7f3;font:16px/1.65 Graphik,Arial,sans-serif}
main{max-width:1500px;margin:auto;padding:36px 40px 70px}.brand{border:5px solid #01a982;width:78px;height:25px;margin-bottom:26px}
h1{font-size:clamp(30px,4vw,58px);line-height:1.12;letter-spacing:-1.8px;font-weight:500;margin:0 0 14px}h1 span{color:#58e7ba}
p{color:#a9c6c4}header p{margin:0 0 24px}.eyebrow{font-size:12px;letter-spacing:1.5px;color:#a9c6c4;text-transform:uppercase;margin-bottom:10px}
.player{container-type:inline-size;position:relative;width:100%;aspect-ratio:16/9;background:#071f23;overflow:hidden;border:1px solid #33595a;border-radius:10px}
video{width:100%;height:100%;display:block}.captions{position:absolute;inset:auto 0 0;min-height:10%;padding:.2% 4% .5%;text-align:center;white-space:pre-line;background:#071f23;color:#fff;font-size:clamp(10px,1.667cqw,32px);line-height:1.28;pointer-events:none}
.transport{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:15px 0}button,a{font:inherit}button{background:#102e32;color:#f2f7f3;border:1px solid #789d9d;border-radius:7px;padding:9px 14px;cursor:pointer}button:hover,button[aria-current="true"]{border-color:#58e7ba;background:#164541}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #a8ccff;outline-offset:3px}
.play{min-width:88px}.transport label{display:flex;gap:8px;align-items:center}input[type=range]{flex:1;min-width:150px;accent-color:#58e7ba}.time{font-variant-numeric:tabular-nums;color:#a9c6c4;font-size:14px;min-width:108px}
nav{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}a{color:#58e7ba;text-decoration:none}a:hover{text-decoration:underline}.content{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:26px}
h2{font-size:22px;font-weight:500;margin:0 0 15px}.chapters{display:grid;grid-template-columns:1fr 1fr;gap:10px}.chapters button{text-align:left;font-size:14px;line-height:1.45}.chapters time{display:block;color:#a9c6c4;font-size:12px}
.status{border-left:3px solid #58e7ba;background:#102e32;padding:16px 20px}.status p{margin:6px 0}.note{font-size:14px;color:#a9c6c4;margin-top:20px}.transcript{max-height:560px;overflow:auto;padding-right:18px;scrollbar-color:#789d9d #102e32}.transcript article{border-top:1px solid #33595a;padding:18px 0}.transcript h3{font-size:16px;font-weight:500;margin:0}.transcript p{font-size:15px;margin:8px 0}
.player:fullscreen{border:0;border-radius:0;display:grid;place-items:center;background:#071f23}.player:fullscreen video{object-fit:contain}.player:fullscreen .captions{font-size:clamp(14px,1.667cqw,32px)}
@media(max-width:850px){main{padding:20px 16px 50px}.content{grid-template-columns:1fr}.chapters{grid-template-columns:1fr}.transport{gap:8px}.captions{font-size:1.667cqw}}
</style></head><body><main><header><div class="brand" aria-label="HPE"></div><div class="eyebrow">HPE OpsRamp · Shift-left SecOps · completed local story master</div>
<h1>OpsRamp's<br><span>Shift-left SecOps.</span></h1><p>${durationLabel} · 1080p / 30 fps · ten chapters · ${timeline.captions.length} English captions · Andrew narration</p></header>
<section aria-label="Story reel player"><div class="player" id="player"><video id="film" preload="metadata" playsinline poster="plates/01-question-3.png" aria-label="${esc(TITLE)} story reel"><source src="${NAME}.mp4" type="video/mp4"></video><div id="captions" class="captions" aria-hidden="true"></div></div>
<div class="transport"><button class="play" id="play" type="button">Play</button><label for="seek">Seek</label><input id="seek" type="range" min="0" max="${timeline.duration}" step="0.033333" value="0" aria-label="Playback position"><span class="time" id="time">0:00 / ${clock(timeline.duration)}</span><label><input id="cc" type="checkbox" checked>English captions</label><button id="fullscreen" type="button">Full screen</button></div></section>
<nav aria-label="Downloads"><a href="${NAME}.mp4" download>Download master MP4</a><a href="closing/ending-preview.mp4">Watch the animated ending</a><a href="${NAME}.srt" download>English SRT</a><a href="${NAME}.vtt" download>English VTT</a><a href="../storyboard.html">Illustrated storyboard</a><a href="verification-report.json">Verification evidence</a>${existsSync(resolve(OUT, 'pronunciation-review', 'corrected-passage.mp4')) ? '<a href="pronunciation-review/corrected-passage.mp4">12-second pronunciation check</a>' : ''}</nav>
<div class="content"><section><h2>Chapters</h2><div class="chapters">${timeline.scenes.map((scene, i) => `<button type="button" data-start="${scene.start}" data-id="${scene.id}"><time>${String(i + 1).padStart(2, '0')} · ${clock(scene.start)}</time>${esc(scene.title)}</button>`).join('')}</div>
<div class="status" style="margin-top:26px"><h2>Technical verification passed</h2><p>${verification.checks.length} encoded-media checks · ${timeline.phases.length} key states · ${timeline.transitions.length} dissolves · animated shift-left close.</p><p>Voice: ${verification.evidence.audio.loudness.input_i} LUFS / ${verification.evidence.audio.loudness.input_tp} dBTP.</p></div>
<p class="note">The regular AI-First SDLC workflow, customized for vulnerability scanning, remediation, and verification. A crisp ${timeline.scenes.at(-1).duration.toFixed(1)}-second closing moves Security left and resolves to “Security. Built in.” No separate demonstration is required.</p><p class="note">The permissions example is hypothetical; no security results are claimed. The corrected speech-only hint “Seck-ops” is retained, while captions keep the normal spelling. Unprompted local recognition checks the audio; this is a targeted diagnostic, not human listening approval.</p><p class="note">Technical checks are complete. This production session could not view images or listen to audio; a fresh human watch/listen is still recommended before external presentation.</p></section>
<section><h2>Script, chapter by chapter</h2><div class="transcript">${timeline.scenes.map(scene => `<article><h3>${clock(scene.start)} · ${esc(scene.title)}</h3><p>${esc(narrationText(scene.id))}</p></article>`).join('')}</div></section></div>
<p class="note">The master has selectable English captions and no burned-in subtitles. This review page embeds its caption data so captions work when opened locally.</p>
</main><script>const timeline=${data};
const film=document.getElementById('film'),seek=document.getElementById('seek'),caption=document.getElementById('captions'),cc=document.getElementById('cc'),play=document.getElementById('play');
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function update(){const t=film.currentTime;seek.value=String(t);document.getElementById('time').textContent=fmt(t)+' / '+fmt(timeline.duration);const active=timeline.captions.find(c=>t>=c.start&&t<c.end);caption.textContent=cc.checked&&active?active.text:'';caption.hidden=!cc.checked;const chapter=timeline.scenes.findLast(s=>s.start<=t+.001);for(const b of document.querySelectorAll('[data-start]'))b.setAttribute('aria-current',String(chapter?.id===b.dataset.id));}
play.addEventListener('click',()=>{if(film.paused)film.play().catch(e=>{play.textContent='Play';document.getElementById('time').textContent=e.message;});else film.pause();});film.addEventListener('play',()=>play.textContent='Pause');film.addEventListener('pause',()=>play.textContent='Play');film.addEventListener('ended',()=>play.textContent='Play');film.addEventListener('timeupdate',update);film.addEventListener('seeked',update);seek.addEventListener('input',()=>{film.currentTime=Number(seek.value);update();});cc.addEventListener('change',update);for(const b of document.querySelectorAll('[data-start]'))b.addEventListener('click',()=>{film.currentTime=Number(b.dataset.start);update();});document.getElementById('fullscreen').addEventListener('click',()=>document.getElementById('player').requestFullscreen());update();</script></body></html>`

function narrationText(id) {
  const report = readJSON(resolve(OUT, 'narration.json'))
  return report.scenes.find(s => s.id === id).words.map(w => w.text).join(' ')
}

writeFileSync(resolve(OUT, 'review.html'), html)
// The normal storyboard links now point to existing delivery artifacts.
const boardPath = resolve(DIR, 'storyboard.html')
let board = readFileSync(boardPath, 'utf8').replace('<span>Movie production in progress</span>',
  `<a href="out/${NAME}.mp4">Rendered story reel</a><a href="out/review.html">Captioned review player</a>`)
writeFileSync(boardPath, board)

// Refresh the local deliverable without launching a browser. Useful when GUI
// execution approval is pending; it must not produce a passed playback receipt.
if (process.argv.includes('--generate-only')) {
  writeFileSync(resolve(OUT, 'review-player-report.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), version: VERSION, file: resolve(OUT, 'review.html'),
    sha256: hashFile(resolve(OUT, 'review.html')), sourceFingerprint: sourceHash(['review.mjs']),
    passed: false, status: 'generated-awaiting-playback-check', checks: [],
    limitation: 'Page refreshed locally; this generation has not yet run browser playback checks.'
  }, null, 2))
  console.log(`Generated local review page without browser checks: ${resolve(OUT, 'review.html')}`)
  process.exit(0)
}

// The cached open-source headless shell does not necessarily ship H.264/AAC
// decoding. Prefer installed Chrome for actual MP4 playback verification. This
// launches a new isolated temporary profile, never the user's existing profile.
const installedChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!process.env.PLAYWRIGHT_CHROMIUM && existsSync(installedChrome)) process.env.PLAYWRIGHT_CHROMIUM = installedChrome
const browser = await launchCamera()
const context = await browser.newContext({ viewport: { width: 1440, height: 1180 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const errors = [], checks = [], externalRequests = []
page.on('pageerror', e => errors.push(e.message))
await context.route('**/*', route => {
  if (route.request().url().startsWith(pathToFileURL(DIR).href + '/')) return route.continue()
  externalRequests.push(route.request().url())
  return route.abort()
})
try {
  await page.goto(pathToFileURL(resolve(OUT, 'review.html')).href)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.querySelector('video').readyState >= 1 || document.querySelector('video').error,
    null, { timeout: 15000 })
  const metadata = await page.evaluate(() => {
    const v = document.querySelector('video')
    return { duration: v.duration, width: v.videoWidth, height: v.videoHeight,
      canPlay: v.canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"'), error: v.error ? { code: v.error.code, message: v.error.message } : null }
  })
  if (metadata.error) throw new Error(`MP4 playback unsupported or unavailable: ${JSON.stringify(metadata)}`)
  checks.push({ name: 'local MP4 loads with expected duration and dimensions', passed: Math.abs(metadata.duration - timeline.duration) < .05 && metadata.width === 1920 && metadata.height === 1080, metadata })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('video').currentTime > .7)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  checks.push({ name: 'local playback advances and pause responds', passed: await page.evaluate(() => document.querySelector('video').paused && document.querySelector('video').currentTime > .7) })
  const button = page.locator('[data-id="07-verification"]')
  await button.click()
  // MP4 time is represented at microsecond precision by the browser. A seek to
  // a repeating 30fps fraction can land a fraction of a microsecond before the
  // source boundary; the UI gives chapter selection a 1ms rounding tolerance.
  await page.waitForFunction(start => !document.querySelector('video').seeking &&
    Math.abs(document.querySelector('video').currentTime - start) < .05 &&
    document.querySelector('[data-id="07-verification"]').getAttribute('aria-current') === 'true', timeline.scenes[6].start)
  const chapterSeek = await page.evaluate(() => ({ time: document.querySelector('video').currentTime,
    active: [...document.querySelectorAll('[data-start][aria-current="true"]')].map(b => b.dataset.id) }))
  checks.push({ name: 'chapter jump seeks to verified chapter boundary', passed: chapterSeek.active.length === 1 &&
    chapterSeek.active[0] === '07-verification' && Math.abs(chapterSeek.time - timeline.scenes[6].start) < .001,
    expected: timeline.scenes[6].start, ...chapterSeek })
  const probe = timeline.captions.filter(c => c.text.includes('\n')).sort((a, b) => b.text.length - a.text.length)[0]
  const seekTo = (probe.start + probe.end) / 2
  await page.evaluate(t => { document.querySelector('video').currentTime = t }, seekTo)
  await page.waitForFunction(text => document.getElementById('captions').textContent === text, probe.text)
  const captionLayout = await page.evaluate(() => {
    const area = document.querySelector('.captions').getBoundingClientRect()
    const video = document.querySelector('video').getBoundingClientRect()
    return { top: area.top, bottom: area.bottom, videoTop: video.top, videoBottom: video.bottom,
      contentBottom: video.top + video.height * 951 / 1080, text: document.getElementById('captions').textContent }
  })
  checks.push({ name: 'two-line caption renders inside reserved safe area', passed: captionLayout.top > captionLayout.contentBottom && captionLayout.bottom <= captionLayout.videoBottom + 1, captionLayout })
  await page.getByRole('checkbox', { name: 'English captions' }).uncheck()
  checks.push({ name: 'captions can be disabled without changing the master', passed: await page.locator('#captions').isHidden() })
  await page.getByRole('checkbox', { name: 'English captions' }).check()
  const closingButton = page.locator('[data-id="10-shift-left"]')
  await closingButton.click()
  await page.waitForFunction(start => !document.querySelector('video').seeking &&
    Math.abs(document.querySelector('video').currentTime - start) < .05 &&
    document.querySelector('[data-id="10-shift-left"]').getAttribute('aria-current') === 'true', timeline.scenes.at(-1).start)
  const closingSeek = await page.evaluate(() => ({ time: document.querySelector('video').currentTime,
    active: [...document.querySelectorAll('[data-start][aria-current="true"]')].map(b => b.dataset.id) }))
  checks.push({ name: 'standalone animated closing has its own working chapter link', passed:
    closingSeek.active.length === 1 && closingSeek.active[0] === '10-shift-left' &&
    Math.abs(closingSeek.time - timeline.scenes.at(-1).start) < .001, ...closingSeek })
  await page.evaluate(t => { document.querySelector('video').currentTime = t }, timeline.duration - .5)
  await page.waitForFunction(t => !document.querySelector('video').seeking &&
    Math.abs(document.querySelector('video').currentTime - t) < .05, timeline.duration - .5)
  checks.push({ name: 'final title hold is seekable without a video error', passed: await page.evaluate(() =>
    !document.querySelector('video').error && document.querySelector('video').readyState >= 2) })
  mkdirSync(resolve(OUT, 'review-checks'), { recursive: true })
  await page.screenshot({ path: resolve(OUT, 'review-checks', 'desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 768, height: 1024 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  checks.push({ name: 'review controls remain within a tablet-width page', passed: !overflow })
  await page.screenshot({ path: resolve(OUT, 'review-checks', 'tablet.png'), fullPage: true })
  checks.push({ name: 'no review player script errors', passed: errors.length === 0, errors })
  checks.push({ name: 'review player uses only local project assets', passed: externalRequests.length === 0, externalRequests })
  checks.push({ name: 'sources and previous reels remain unchanged', passed: checkPreserved().every(p => p.unchanged) })
  const report = { checkedAt: new Date().toISOString(), version: VERSION, file: resolve(OUT, 'review.html'),
    sha256: hashFile(resolve(OUT, 'review.html')), sourceFingerprint: sourceHash(['review.mjs']),
    browser: process.env.PLAYWRIGHT_CHROMIUM ?? 'default local Chromium', passed: checks.every(c => c.passed), checks,
    limitation: 'Functional browser checks and screenshots captured; no human viewing/listening approval claimed.' }
  writeFileSync(resolve(OUT, 'review-player-report.json'), JSON.stringify(report, null, 2))
  if (!report.passed) throw new Error(`Review player checks failed: ${JSON.stringify(checks.filter(c => !c.passed))}`)
  console.log(`Review player passed ${checks.length} checks: ${resolve(OUT, 'review.html')}`)
} catch (error) {
  writeFileSync(resolve(OUT, 'review-player-report.json'), JSON.stringify({
    checkedAt: new Date().toISOString(), version: VERSION, passed: false, error: error.message, checks,
    browser: process.env.PLAYWRIGHT_CHROMIUM ?? 'default local Chromium'
  }, null, 2))
  throw error
} finally {
  await context.close()
  await browser.close()
}
