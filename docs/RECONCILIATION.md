# TGO Reconciliation Ledger

Updated: 2026-10-21. The corrected Temporal task and later user replies define current authority. Main replanner only; archives excluded. The user authorized the verified handoff commit; see CLOUD_HANDOFF.md for transfer status.

| Subsystem | Approved decision | Implementation |
| --- | --- | --- |
| Cookbook Functions | Inline alpha, Part-owned beta, reusable closure-retaining gamma incorporating alpha; flexible invocation/return | Preserved and tested in examples/production |
| Cookbook Classes | Mandatory fluent chain; confirmed six-step lifecycle; own data, ordinary app-receiver methods, ordered Parts, one automatic init, explicit View args; reject own function fields | Implemented in compose.js; unchanged in calendar migration |
| Part isolation / Body | No direct/aliased sibling access; Compound explicitly wires, Body orchestrates | Same ten capabilities; no Context, bus, registry or singleton scheduling store |
| Views | Supplied state/actions, local visual hooks permitted | Preserved; native gesture ref binding fixes browser passive-listener failure |
| Calendar authority | Use @js-temporal/polyfill, not a custom Gregorian/timezone engine | Exact 0.5.1 dependency, pure shared domain/calendar.js |
| Calendar policies | Amsterdam; Monday; fortnight local 1970-01-05; quarters Jan/Apr/Jul/Oct; half-open intervals; month-end constrain | Implemented/tested |
| Arithmetic / DST | All event units use wall-clock addition; gaps forward, overlaps earlier by default, preserve valid anchor offsets | Implemented/tested. Fractional event amounts explicitly deferred, rejected before insertion |
| Coordinates | Equal-width real cells; index + elapsed fraction; reversible mapping; repeated hours distinct | Implemented/tested for all ten units, before 1970 and historical offset changes |
| Navigation | Continuous pan; cursor/center anchoring; shared unit model | Shared Temporal coordinates replace constant ratios; tested and Chrome exercised |
| Projection | Cover every actual intersected display cell; exclusive end does not own next cell | Implemented/tested, including January 31 and leap February |
| Routing | Finer definedUnit -> list; equal/coarser -> stroke; amount does NOT decide granularity | Explicitly approved revision, implemented/tested. Older T7 duration comparison is rejected |
| Header/lists | Preserve layout/styling and use shared definitions | Existing three header rows retained where available; Amsterdam labels and aligned columns verified |
| Frame/assets | 640px SVG, part-owned stationary bg.png/bg2.png, existing appearance | Preserved; dynamic render coverage and Chrome checks |
| Lane positioning | Keep active provisional algorithm; replacement separately designed | assignRowsForUnit unchanged; existing cache defect remains |
| Persistence | Memory only | Unchanged; no backend/DB/localStorage/IndexedDB |

## Superseded proposals

There is no fixed four-week month, 336-day year or universal adjacent calendar-unit ratio. There is no universal return alpha(...) requirement or blanket hook-removal rule. Cookbook lifecycle ambiguity is resolved. The event-end-versus-start-plus-display-unit routing proposal was explicitly rejected in favor of source-unit granularity.

The mixed-up earlier P5 attachment's two-level header phrase does not authorize a visual redesign under the corrected preserve-existing-interface request: the existing three-row header is retained. No fractional-event interpolation was approved; that feature is deferred.

## Remaining work

P4/P5 are implemented and ready for review; see CALENDAR.md, TEMPORAL_MIGRATION.md and IMPLEMENTATION_STATUS.md for evidence. Physical Safari/trackpad testing, exhaustive browser animation/visual review and existing clipping/cache defects remain. Linux/Cloud tests/build and server verification now pass; see CLOUD_BASELINE.md for evidence and limits. Those are not permission to redesign lanes or introduce persistence.

No essential policy ambiguity blocks the supported positive-integer event model. Future fractional semantics, lane replacement and unrelated scheduling features require separate decisions. The implementation is published on main at https://github.com/rctdeclan/tgo.git. Cloud initialization is documentation-only; current verification and next tasks are in CLOUD_BASELINE.md.
