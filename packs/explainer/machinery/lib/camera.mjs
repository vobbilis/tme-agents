import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE } from './tools.mjs'

export const SIZE = { width: 1920, height: 1080 }
export const BASE = process.env.REEL_BASE ?? 'http://127.0.0.1:5208'

export async function launchCamera() {
  const { resolveChromium, CHROMIUM_CANDIDATES } = await import(
    resolve(HERE, 'playwright-resolve.mjs')
  )
  const chromium = await resolveChromium()
  const shell = resolve(process.env.HOME, 'Library/Caches/ms-playwright/chromium_headless_shell-1181/chrome-mac/headless_shell')
  const executablePath = [process.env.PLAYWRIGHT_CHROMIUM, shell, ...CHROMIUM_CANDIDATES]
    .find(path => path && existsSync(path))
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
}

export const delay = milliseconds => new Promise(done => setTimeout(done, milliseconds))

export async function marker(page, kind, milliseconds = 220) {
  await page.evaluate(kind => {
    document.getElementById('reel-sync')?.remove()
    const mark = document.createElement('div')
    mark.id = 'reel-sync'
    mark.style.cssText = `position:fixed;left:0;top:0;width:16px;height:16px;background:${kind === 'start' ? '#ff00ff' : '#00ffff'};z-index:2147483647;pointer-events:none`
    document.documentElement.appendChild(mark)
  }, kind)
  await delay(milliseconds)
  await page.evaluate(() => document.getElementById('reel-sync')?.remove())
}

export async function setupTwin(context) {
  await context.addInitScript(() => {
    localStorage.setItem('itom-prototype-proposals-enabled', 'true')
    localStorage.setItem('itom-prototype-proposal:private-integration-governance', 'true')
    const install = () => {
      const style = document.createElement('style')
      style.textContent = '.proto-sign-in-as,.proto-reset-demo-data{display:none!important}'
      document.documentElement.appendChild(style)
    }
    document.addEventListener('DOMContentLoaded', install, { once: true })
  })
  const page = await context.newPage()
  page.setDefaultTimeout(25_000)
  await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await fetch('/api/session')
      if (response.headers.get('content-type')?.includes('json')) {
        const session = await response.json()
        const client = session.tenants.find(tenant => tenant.kind === 'client')
        if (!client) throw new Error('no client tenant')
        const selected = await fetch('/api/session/tenant', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tenantId: client.id })
        })
        if (!selected.ok) throw new Error('unable to select fabricated client')
        return
      }
      await new Promise(done => setTimeout(done, 250))
    }
    throw new Error('Twin API did not become ready')
  })
  return page
}

export async function navigateTwin(page, path, ready) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId(ready).waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)
}

export async function startLesson(page) {
  await page.getByTestId('learn-panel-actions').click()
  const start = page.locator('.ops-dropdown__menu--open .ops-list-item', { hasText: /^Start$/i })
  await start.waitFor({ state: 'visible' })
  await start.click()
  await page.getByTestId('assist-caption').waitFor({ state: 'visible' })
}
