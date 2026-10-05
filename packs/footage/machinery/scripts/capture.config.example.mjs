// Capture configuration — copy to capture.config.mjs and fill in.
// /cmo:new or the session writes this WITH the owner from their plain-words
// description of which screens and journeys to show. Run with:
//   node scripts/capture-product.mjs --config scripts/capture.config.mjs
//   (add --headed to watch it; add --allow-remote for a non-localhost URL)
export default {
  // The product repo this capture is pinned to (its current commit is
  // recorded in the receipt). For a hosted product with no local checkout,
  // point this at the reel folder itself and note that in the register.
  sourceWorktree: '..',

  // Where the product is. Localhost by default; a hosted address needs the
  // explicit --allow-remote flag at run time.
  baseUrl: 'http://localhost:3000',

  // One entry per thing to show. Each shot navigates, waits for the UI to
  // prove it is really showing what you asked for, then records.
  shots: [
    {
      id: 'login',
      path: '/',
      // assertions: selectors or visible text that MUST be present before
      // recording starts — this is how a capture proves it shows the real
      // thing and not a loading spinner
      assertions: ['text=Sign in'],
      // actions the browser performs, in plain steps the session writes
      // from the owner's description (click, fill, press, waitFor…)
      steps: []
    }
  ]
}
