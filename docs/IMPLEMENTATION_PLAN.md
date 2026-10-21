# TGO Migration Plan and Current Phase Status

Updated: 2026-10-21. The corrected full Temporal request and subsequent routing/fraction/offset decisions supersede older pending proposals. Main replanner only. The implementation is published on main at origin (https://github.com/rctdeclan/tgo.git). Linux Cloud baseline verification is recorded in CLOUD_BASELINE.md; recommended follow-up tasks there are recommendations, not feature authorization.

| Phase | Current status | Evidence / boundary |
| --- | --- | --- |
| P0-P1 | Complete | Baseline audit, characterization and executable Cookbook examples |
| P2-P3 | Implemented/verified | Confirmed builder lifecycle, isolated Parts, explicit Body wiring; retained in the 49-test suite |
| P4 | Implemented/verified | Temporal authority; five generic cell/coordinate operations; explicit timezone/DST/clamping; stable negative indices; semantic integer event intervals |
| P5a | Implemented/verified | Shared semantic navigation, local interval zoom scales, cursor/center anchoring, continuous rendering coverage |
| P5b | Implemented/verified | Temporal event intervals and half-open cell envelopes; actual calendar headers; definedUnit-based routing |
| P5c | Implemented/verified | Amsterdam list indicators and aligned anchor columns; shared Body layout; Chrome event/route/header interaction checks |
| P6 | Partly verified / manual checks remain | Full automated suite/build and headless Chrome pass. Physical Safari/trackpad gestures, cross-browser paint and exhaustive visual cases remain |

## Settled contracts

Cookbook's six-step class lifecycle and flexible alpha/beta/gamma semantics are confirmed. Do not modify them or replace explicit Part wiring with Context/bus/singleton orchestration. Pure Temporal calculations are ordinary helpers.

Calendar authority is @js-temporal/polyfill. Europe/Amsterdam, Monday weeks, fixed 1970-01-05 fortnight anchor, Gregorian quarters, half-open boundaries and constrained month-end arithmetic are approved. All event units add in local wall time. Gaps shift forward; overlap resolution defaults earlier, but calendar addition preserves a valid anchor offset. Fractional event amounts are explicitly deferred. ELAPSED coordinate fractions are separately approved.

Routing was revised by the user: definedUnit rank alone decides stroke/list placement. Amount controls interval, not semantic granularity. Strokes cover intersected real cells; an exclusive boundary end does not include the following cell. The former end-versus-one-display-unit proposal is rejected, not an open alternative.

## Implemented file-level work

- src/domain/calendar.js: core cellAt/nextCell/cellPosition/coordinate/instantAt, plus narrow local/addition/interval/formatting support; no custom timezone rules or Gregorian engine.
- src/domain/time.js: compatibility zoom-order re-export; fixed duration/ratio tables removed.
- src/domain/projection.js: semantic interval coverage and independent rank routing.
- src/state/viewport.js: semantic inverse/anchor/normalization and local transition scales, retaining per-app ownership and 640px presentation.
- ViewportPart: same capabilities, delegates animation-scale description to the existing viewport engine.
- HeaderPart/ListsPart: shared cells/coordinates and common Amsterdam formatting via domain/labels.js; no independent date engine.
- StrokesPart: validated integer intervals, semantic cell creation, rank routing and existing unchanged lanes; dynamic rendered-column count.
- App Body: same wiring, semantic seed offsets, shared presentation snapshot.
- useTrackpadTimeline: same use-gesture inputs/thresholds, native target/ref binding to make passive:false effective; Safari adapters retained.
- Tests/docs/package metadata: recorded in TEMPORAL_MIGRATION.md. compose.js, ViewportSVG styling/animation implementation, image assets and provisional lane algorithm are unchanged.

## Verification and review gate

49 automated tests and production build pass. Calendar/header checks also pass with a different host timezone. Real headless Chrome verifies loading, all keyboard levels, wheel/ctrl-wheel dispatch, creation, routing, headers and DOM alignment without application errors. Browser input simulation is not physical Safari gesture certification.

Keep 640px, in-memory records, lists, SVG appearance and provisional lane behavior. No future lane design, storage/backend, timezone selector, fractional-event approximation or unrelated event-management feature is authorized. Remaining work is review/manual verification, not permission to begin a redesign.
