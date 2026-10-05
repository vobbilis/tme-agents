import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  renameSync,
  writeFileSync
} from 'node:fs'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  PROJECT,
  REPO_ROOT,
  projectRelative,
  sha256File,
  writeJson
} from './lib/project.mjs'
import {
  runShotAssertions,
  validateCaptureConfig,
  waitForShot
} from './lib/capture.mjs'

const args = process.argv.slice(2)
const configArg = args.includes('--config') ? args[args.indexOf('--config') + 1] : null
if (!configArg) {
  throw new Error(
    'Pass --config <file>. Copy capture.config.example.mjs for a new reel.'
  )
}

const configPath = resolve(PROJECT, configArg)
if (!existsSync(configPath)) throw new Error(`capture config not found: ${configArg}`)
const imported = await import(`${pathToFileURL(configPath).href}?v=${Date.now()}`)
const config = validateCaptureConfig(imported.default, {
  allowRemote: args.includes('--allow-remote')
})
const headed = args.includes('--headed')
const sourceWorktree = resolve(config.sourceWorktree)
const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: sourceWorktree,
  encoding: 'utf8'
})
if (commit.status !== 0) throw new Error(`cannot inspect source worktree: ${commit.stderr}`)
const actualCommit = commit.stdout.trim()
if (actualCommit !== config.sourceCommit)
  throw new Error(`source worktree moved: expected ${config.sourceCommit}, found ${actualCommit}`)

const outputDir = resolve(
  PROJECT,
  config.outputDir ?? `assets/captures/${config.name}`
)
mkdirSync(outputDir, { recursive: true })

const resolver = await import(
  pathToFileURL(new URL('./playwright-resolve.mjs', import.meta.url).pathname).href
)
const chromium = await resolver.resolveChromium()
const browser = await chromium.launch({ headless: !headed })
const pageErrors = []
const requestFailures = []
const receipt = {
  version: 1,
  name: config.name,
  capturedAt: new Date().toISOString(),
  config: projectRelative(configPath),
  baseUrl: config.baseUrl,
  sourceWorktree: basename(sourceWorktree),
  sourceCommit: actualCommit,
  dataClassification: config.dataClassification,
  viewport: config.viewport ?? { width: 1920, height: 1080 },
  pageErrors,
  requestFailures,
  shots: []
}

let context
let page
try {
  context = await browser.newContext({
    viewport: receipt.viewport,
    ...(config.recordVideo
      ? { recordVideo: { dir: outputDir, size: receipt.viewport } }
      : {})
  })
  if (config.localStorage) {
    await context.addInitScript(values => {
      for (const [key, value] of Object.entries(values))
        window.localStorage.setItem(key, String(value))
    }, config.localStorage)
  }
  page = await context.newPage()
  page.setDefaultTimeout(config.timeoutMs ?? 30_000)
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('requestfailed', request => {
    requestFailures.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'request failed'
    })
  })

  if (typeof config.initialize === 'function')
    await config.initialize({ page, context, config })

  for (const shot of config.shots) {
    const url = new URL(shot.route, config.baseUrl).href
    await page.goto(url, { waitUntil: shot.waitUntil ?? 'domcontentloaded' })
    await waitForShot(page, shot.ready)
    if (typeof shot.prepare === 'function')
      await shot.prepare({ page, context, config })
    await runShotAssertions(page, shot.assertions)

    for (const selector of config.forbidSelectors ?? []) {
      if (await page.locator(selector).count())
        throw new Error(`${shot.id}: forbidden overlay present: ${selector}`)
    }

    const path = resolve(outputDir, `${shot.id}.png`)
    await page.screenshot({ path, fullPage: false })
    receipt.shots.push({
      id: shot.id,
      route: new URL(url).pathname,
      asset: projectRelative(path),
      sha256: sha256File(path),
      proof: shot.proof,
      status: shot.status ?? 'captured from pinned Digital Twin source'
    })
    console.log(`${shot.id} · ${receipt.shots.at(-1).sha256.slice(0, 12)}`)
  }

  if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join('; ')}`)
  if (requestFailures.length && !config.allowRequestFailures)
    throw new Error(`request failures: ${requestFailures.map(item => item.url).join(', ')}`)

  const video = config.recordVideo ? page.video() : null
  await context.close()
  context = null
  if (video) {
    const temporary = await video.path()
    const named = resolve(outputDir, `${config.name}.webm`)
    renameSync(temporary, named)
    receipt.video = {
      asset: projectRelative(named),
      sha256: sha256File(named)
    }
  }
  writeJson(resolve(outputDir, 'receipt.json'), receipt)
  console.log(`Capture receipt: ${projectRelative(resolve(outputDir, 'receipt.json'))}`)
} catch (error) {
  if (page && !page.isClosed()) {
    const failure = resolve(outputDir, 'failure.png')
    await page.screenshot({ path: failure }).catch(() => {})
  }
  writeFileSync(
    resolve(outputDir, 'failure.json'),
    `${JSON.stringify({ ...receipt, error: error.message }, null, 2)}\n`
  )
  throw error
} finally {
  if (context) await context.close().catch(() => {})
  await browser.close()
}
