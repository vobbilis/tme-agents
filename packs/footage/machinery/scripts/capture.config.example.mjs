// Capture configuration — copy to capture.config.mjs and fill in.
// The session writes this WITH the owner from their plain-words description
// of which screens to show. Run with:
//   node scripts/capture-product.mjs --config scripts/capture.config.mjs
//   (--headed shows the browser window; --allow-remote permits a
//    non-localhost baseUrl)
//
// TWO RULES THIS ADAPTER ENFORCES, BY DESIGN:
// 1. It films FABRICATED DATA ONLY (dataClassification below is checked).
//    Point it at a demo/staging instance seeded with made-up data — never
//    a live system holding real customer or colleague data. To film real
//    day-to-day usage, the owner records their own screen instead, and the
//    evidence register + privacy review handle what that may show.
// 2. It opens ITS OWN browser (a fresh Chromium). It cannot see or reuse
//    your Chrome/Firefox session. To log in: script the steps in
//    initialize(), seed a session via localStorage below — or run with
//    --headed, log in yourself in the window it opens, and let
//    initialize() simply wait until a post-login element is visible.
export default {
  name: 'example-capture',                 // kebab-case; names the output folder

  // Provenance pin: the product source this capture is tied to. The run
  // refuses if the worktree's commit differs from sourceCommit.
  sourceWorktree: '/path/to/product/checkout',
  sourceCommit: '0000000000000000000000000000000000000000',
  dataClassification: 'fabricated',        // the only accepted value

  baseUrl: 'http://localhost:3000',
  viewport: { width: 1920, height: 1080 },
  recordVideo: true,                       // true = film it (webm); stills are always kept

  // Optional: seed a session instead of scripting a login
  // localStorage: { authToken: '…fabricated…' },

  // Optional: runs once before the shots. For manual login under --headed:
  // initialize: async ({ page }) => {
  //   await page.locator('#dashboard').waitFor({ state: 'visible', timeout: 300000 })
  // },

  // Overlays that must never be on screen in any shot
  forbidSelectors: ['.toast-error'],

  // One entry per screen to show, in order.
  shots: [
    {
      id: 'dashboard',
      route: '/dashboard',                 // navigated as baseUrl + route
      ready: '#dashboard',                 // selector (or function) proving the real screen loaded
      proof: ['shows the operations dashboard with fabricated tenants'],
      assertions: [
        { selector: 'h1', text: 'Dashboard' }
      ]
    }
  ]
}
