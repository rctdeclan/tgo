# iPhone web preparation on main

Prepared 2026-11-01 from main at `11e009cf7a6936c76ff9040fbc4e42de23cea888`. Scope: adapt the existing Safari/web experience for iPhone. The temporary header study remains on `temporary/collapsible-header`; its source, hosting identity and published Site are not merged or overwritten. This work is not a native iOS/Xcode project.

## Current behavior

- The original timeline, three header rows where available, stroke/list routing, textures and provisional lanes are retained. Desktop still renders the original 640x520 frame, without the phone controls.
- Portrait phone screens use a centered, narrower window into the 640-unit scene. SVG units stay at one CSS pixel: text and cells are not scaled down to fit. Header labels clamp to the visible phone window, and offscreen grid culling uses that window.
- A lightweight TimelineFrame presentation adapter measures the available width and forwards resizeFrame through the existing viewport navigation capability. Resize preserves the center instant. The readable zoom cap fits at least three semantic unit-widths into the actual phone window; desktop defaults remain unchanged.
- Touch, wheel and Safari gesture coordinates are translated from physical screen pixels into the centered scene before calling the existing calendar/viewport functions. Pan and zoom remain atomic and frame-coalesced. No calendar arithmetic, event model or lane algorithm is replaced.
- A phone toolbar exposes Earlier, Later, Zoom out and Zoom in as 44x44 CSS-pixel buttons. It reports the active unit and disables steps at the ends of the ladder. The controls dispatch supplied capabilities; they do not mutate canonical state in a View.
- Native single-finger vertical scrolling reaches rows and the list section on short screens. Two-finger horizontal pan/pinch stays in the timeline. The phone SVG can grow vertically to cover its current stroke rows and list region. The existing crowded-list clipping inside the list section is not solved here.
- Phone event inputs use a 16px font, a Done keyboard hint and an on-screen horizontal position, reducing Safari focus zoom and clipped editors. Domain creation semantics (current viewport at submission, Enter/blur save and Escape cancel) are unchanged.
- The phone shell uses dynamic viewport height, viewport-fit=cover and CSS safe-area insets for portrait/landscape. Coarse-pointer short landscape screens get the phone shell as well. Page zoom is not globally disabled. Mobile blur/dissolve is disabled to avoid expensive repainting while changing units; desktop motion is retained.

## Implementation map

- `src/ui/TimelineFrame.jsx`, `phone.css`, `frameGeometry.js`: presentation shell, safe areas, controls, visible scene mapping and scrollable content height.
- `ViewportSVG.jsx`: centered viewBox, measured display size, native vertical touch allowance and mobile animation policy.
- `useTrackpadTimeline.js`: physical-to-scene conversion for all gesture paths; mobile vertical wheel scrolling is allowed through.
- `state/viewport.js`, `ViewportPart.js`: resizeFrame command through the existing navigation gamma, center anchoring and width-dependent readable cap.
- `App.jsx`: supplies presentation data/actions and measured frame dimensions to the existing Views.
- `HeaderPart.jsx`, `StrokesPart.jsx`: phone-aware label/grid bounds and editor placement. Existing packing and event routing are unchanged.
- `index.html`, `main.jsx`: safe-area viewport metadata, theme color, title and responsive stylesheet.

No dependencies or lockfile versions change. Cookbook construction/isolation and the Temporal calendar authority remain intact. No new application bus, context, singleton, persistence or scheduling feature is added.

## Verification

62 tests: the original main suite of 57 plus five phone regressions. New checks cover centered crop/moving pinch anchor, resizing/readable zoom and center preservation, enough vertical space for rows/lists, wired toolbar actions/unit limits, and cropped wheel coordinates/native vertical scroll allowance. Production Vite build passes.

Chromium mobile emulation verifies 320x568, 375x667, 390x844, 430x932 and 844x390: no horizontal page overflow; controls fit and have 44px hit targets. Real browser input verifies toolbar navigation, event creation with a 16px on-screen editor, two-finger pan/pinch with page scale unchanged, and single-finger vertical scrolling. A desktop browser verifies the 640x520 frame and hidden phone-only controls. No application console/page errors were reported.

## Remaining preparation / limits

Physical iPhone Safari is still required for final certification: check notch/home-indicator clearance, browser toolbar expansion, keyboard focus/Done/blur, rotation during editing, two-finger gestures and browser history/page zoom. Emulation cannot prove those hardware/browser behaviors. Safe areas are implemented but actual nonzero iPhone insets are not certified in Chromium.

This is web preparation, not an App Store build. Native packaging, offline install/service worker, app icons/splash screens, persistent event storage and native integrations are not provided. Existing main limitations remain: lost resolved-lane cache writes, crowded list clipping, long-stroke labels offscreen, current-viewport draft submission, font portability and memory-only data. SVG header controls retain their original compact targets; the 44px toolbar provides a phone navigation alternative.

The original owner-private TGO Site identified by main's `.openai/hosting.json` is used for this update. The header-study project has a different ID and is preserved separately. As in previous sessions, installed Sites helper scripts are unavailable; source authentication is passed through hidden stdin/in-memory Git configuration and only the hosting manifest and dist assets enter the deployment archive.
