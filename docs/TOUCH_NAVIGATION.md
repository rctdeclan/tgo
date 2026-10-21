# iPad two-finger navigation

Implemented for the user-requested iPad/Sites task after the Cloud baseline. No calendar, Cookbook lifecycle, event routing, layout or lane algorithm changes.

Place two fingers on the timeline and slide horizontally to pan. Spread or pinch them to zoom; both motions can happen together. The instant under the previous midpoint stays under the new midpoint. Single-finger taps retain cell editing/header actions. Pinch affects the timeline rather than Safari page scale.

`src/hooks/twoFingerTimeline.js` attaches non-passive native touch listeners to the SVG. It tracks two touch identifiers, centroid and distance; it calls the supplied viewport zoom capability at the old midpoint using the distance ratio, then pans by the midpoint delta. Native input state resets on cancellation, additional fingers, changed finger identities and gesture completion. The hook reads current viewport actions through a ref so React refreshes do not reset an in-progress gesture. A brief capture-phase click guard prevents synthetic post-gesture clicks from creating drafts or navigating headers.

The existing wheel and desktop pinch thresholds/Safari gesture adapter remain. Touch pinch deliveries from use-gesture are ignored, and Safari gesture events are suppressed while the native two-touch path is active, preventing duplicate zoom. The viewport meta tag establishes CSS-pixel coordinates on iPad without disabling user page zoom globally. The fixed 640x520 interface and horizontal-only pan are preserved.

## Verification

- `npm test`: 53/53 pass, including four new tests covering combined pan/pinch anchor preservation across a semantic level, one-finger behavior, click suppression, finger replacement/third-finger/cancel reset, listener cleanup and duplicate touch pinch delivery.
- `npm run build`: passes; 55 modules, JS 354.24 kB / 109.15 kB gzip. No dependencies changed.
- Chromium with mobile/touch emulation and native CDP multi-touch delivery: horizontal translation and cell width change as expected; page scale remains 1; gestures do not open an editor; a later single-finger tap still opens one; no application console/page errors.
- Physical iPad Safari has not been exercised in this environment. Check simultaneous drag/pinch, finger lift/replacement, native page/history behavior and taps on-device. Existing clipping/cache/font/draft limitations in CLOUD_BASELINE.md remain.

## Sites hosting

`.openai/hosting.json` identifies the TGO Site and declares the Vite `dist` static output. The initial Site audience is owner-private. Sites source is a sanitized copy under `/workspace/sites/tgo-ipad`; GitHub remains the canonical project repository. Deployment archives contain only the hosting manifest and built assets, never node_modules, credentials or Git metadata. Runtime data remains session-only and reload resets additions.

The Cloud image has no installed Sites workflow/build helper scripts. Source synchronization therefore uses the supplied short-lived credential through hidden stdin/in-memory Git configuration; native Sites save/deploy receives the exact pushed source commit and its static archive. No credential is written into the project or archive. Reuse the manifest project ID for subsequent deployments.
