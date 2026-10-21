# TGO Verification

Use Node 22, npm ci, npm test and npm run build. The Node built-in runner uses esbuild for JSX/extensionless imports; Temporal is the only new application dependency in the calendar phase.

- builder.test.js and cookbook-example.test.js: confirmed lifecycle, normal method receivers/returns, own-function rejection, explicit fluent construction and corrected alpha/beta/gamma closure behavior.
- cookbook-application.test.js: ten production capability constructions, inline alpha source guards, reuse, event observation, isolation, shared Body presentation, in-memory behavior and navigation.
- current-implementation.test.js: preserved event/list/native-row-hint/lane behavior, known row-cache gap, semantic navigation fixtures and real React 640px SSR.
- presentation-actions.test.js: controlled hook adapters for draft/Enter/blur/Escape, keyboard filters and wheel/pinch dispatch. Native use-gesture target/ref config is asserted; this harness is not a real browser/effect scheduler.
- calendar.test.js: concrete leap/month/week/fortnight/quarter/year values, clamping, DST gaps/folds/offset preservation, elapsed cell fractions, historical/negative indexes, lookup-order stability, inverse continuity and explicit fractional-event rejection.
- semantic-viewport.test.js: all-unit pan, every adjacent cursor zoom, round trips, pre-1970 dates, DST and keyboard/header center/readability.
- semantic-header.test.js: all three available header levels use shared actual boundaries; both repeated-hour offsets remain labeled.
- semantic-projection.test.js: revised definedUnit-based routing independent of amount, approved month examples, half-open exact ends/one-ms intersections, actual month/day/DST spans, one route per event and unchanged canonical memory on invalid input.

49 tests pass. Full suite also passes under TZ=UTC; calendar/header tests pass under TZ=Pacific/Honolulu. No tests rely on synthetic UNIT_MS constants or require universal return alpha(...). No lint/type-check command exists.

TEMPORAL_MIGRATION.md records the real Chrome smoke test and driver limitations. The external temporary playwright-core driver does not alter project dependencies or replace unit tests. Physical Safari/macOS gestures, cross-browser paint timing and exhaustive visuals remain manual. Source assets/spacing and lane algorithm were not redesigned.

Cloud initialization: fresh Linux npm ci, all 49 tests/build and 10 calendar/header tests under TZ=Pacific/Honolulu pass with the lockfile unchanged. See ../docs/CLOUD_BASELINE.md for actual runtime versions, browser evidence and current limits; ../docs/CLOUD_HANDOFF.md preserves historical Mac evidence. No lint/type-check scripts or committed browser runner are present.

Follow-up iPad navigation: 53/53 tests now pass. two-finger-timeline.test.js covers moving midpoint anchoring, finger lifecycle, tap/click behavior and duplicate input suppression. See ../docs/TOUCH_NAVIGATION.md for native Chromium touch smoke evidence and physical iPad limits.

Responsiveness follow-up: 57 tests. navigation-performance.test.js validates atomic notifications/moving anchors and layout/header invalidation; two-finger tests also cover animation-frame coalescing and end/cancel behavior. Browser timing evidence is in ../docs/TOUCH_NAVIGATION.md; tests avoid machine-dependent time thresholds.
