export function validateCaptureConfig(config, { allowRemote = false } = {}) {
  if (!config || typeof config !== 'object') throw new Error('capture config must export an object')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.name ?? ''))
    throw new Error('capture config name must be kebab-case')
  if (!config.sourceWorktree) throw new Error('capture config needs sourceWorktree')
  if (!/^[0-9a-f]{40}$/.test(config.sourceCommit ?? ''))
    throw new Error('capture config needs an exact 40-character sourceCommit')
  if (config.dataClassification !== 'fabricated')
    throw new Error('capture adapter accepts fabricated data only')

  let url
  try {
    url = new URL(config.baseUrl)
  } catch {
    throw new Error('capture config needs a valid baseUrl')
  }
  if (
    !allowRemote &&
    !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  ) throw new Error('remote capture is disabled; use a local pinned source server')

  if (!Array.isArray(config.shots) || !config.shots.length)
    throw new Error('capture config needs at least one shot')
  const ids = new Set()
  for (const shot of config.shots) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(shot.id ?? ''))
      throw new Error('every capture shot needs a kebab-case id')
    if (ids.has(shot.id)) throw new Error(`duplicate capture shot id: ${shot.id}`)
    ids.add(shot.id)
    if (!shot.route) throw new Error(`capture shot ${shot.id} needs a route`)
    if (!shot.ready) throw new Error(`capture shot ${shot.id} needs a ready selector or function`)
    if (!Array.isArray(shot.proof) || !shot.proof.length)
      throw new Error(`capture shot ${shot.id} needs proof statements`)
  }
  return config
}

export async function waitForShot(page, ready) {
  if (typeof ready === 'function') {
    await ready({ page })
    return
  }
  await page.locator(ready).first().waitFor({ state: 'visible' })
}

export async function runShotAssertions(page, assertions = []) {
  for (const assertion of assertions) {
    if (typeof assertion === 'function') {
      const result = await assertion({ page })
      if (result === false) throw new Error('capture assertion returned false')
      continue
    }
    const locator = page.locator(assertion.selector).first()
    if (assertion.absent) {
      if (await locator.count()) throw new Error(`unexpected ${assertion.selector}`)
      continue
    }
    await locator.waitFor({ state: assertion.state ?? 'visible' })
    if (assertion.text) {
      const text = await locator.innerText()
      if (!text.includes(assertion.text))
        throw new Error(`${assertion.selector} does not contain ${assertion.text}`)
    }
  }
}
