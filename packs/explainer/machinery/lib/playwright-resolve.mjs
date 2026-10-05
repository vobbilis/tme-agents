// Playwright is deliberately NOT a dependency of this repo — the prototype's own
// suite is vitest, and the browser tooling is developer-machine tooling. So every
// script that needs a browser resolves it from wherever it happens to be
// installed rather than hardcoding one checkout's node_modules.
//
// Shared by scripts/browser-check/harness.mjs (the assertion checks) and
// scripts/product-capture/capture.mjs (the live product capture session).
//
// Env overrides:
//   PLAYWRIGHT_MODULE     path to a playwright entry point, if not resolvable
//   PLAYWRIGHT_CHROMIUM   path to a Chromium binary, if not bundled

const PLAYWRIGHT_CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE,
  'playwright',
  'playwright-core',
  '/opt/homebrew/lib/node_modules/flowise/node_modules/playwright/index.mjs'
].filter(Boolean)

export const CHROMIUM_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM,
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1181/chrome-mac/Chromium.app/Contents/MacOS/Chromium`
].filter(Boolean)

/** The `chromium` export from whichever Playwright this machine has. */
export async function resolveChromium() {
  const failures = []
  for (const specifier of PLAYWRIGHT_CANDIDATES) {
    try {
      const mod = await import(specifier)
      if (mod.chromium) return mod.chromium
      failures.push(`${specifier}: no chromium export`)
    } catch (error) {
      failures.push(`${specifier}: ${error.message.split('\n')[0]}`)
    }
  }
  throw new Error(
    `could not load playwright. Set PLAYWRIGHT_MODULE to its entry point.\n  ${failures.join('\n  ')}`
  )
}
