# TGO Invariants and Verification Status

Updated: 2026-10-21. Cookbook and the Temporal-backed P4/P5 implementation are verified at the automated/Chrome boundary. See CALENDAR.md and TEMPORAL_MIGRATION.md; historical audits are not current policy.

| Invariant | Status / evidence |
| --- | --- |
| Essential compose(Base).part(...).body(...).view(...).build() | Preserved; builder tests pass; compose.js unchanged in calendar migration |
| Own Body data before declaration-ordered Parts; ordinary prototype methods use app receiver; one automatic init; explicit View(parts,app) | Implemented/tested; own function fields rejected clearly |
| Inline alpha, Part-owned beta, one reusable gamma created/returned per construction, retained context and executable alpha incorporation | Preserved; examples and production tests pass. Conditional/repeated calls and independent/no gamma result remain valid |
| No sibling-Part discovery/aliases; Compound wires, Body orchestrates | Preserved; source/runtime isolation checks pass; same ten capabilities in Body.init |
| Views render supplied state/actions; harmless UI hooks remain local | Preserved; event/viewport/layout behavior remains in Parts/Body; draft/hover/animation stay presentation-local |
| One timezone/calendar authority | Temporal in Europe/Amsterdam; no custom Gregorian/TZ engine; host timezone independence tested |
| Real month/year/quarter/week/fortnight boundaries | Implemented/tested: leap years, Jan/Apr/Jul/Oct quarters, Monday weeks, local 1970-01-05 fortnight anchor |
| Explicit wall-clock event addition with constrained month ends and valid-offset preservation | Implemented/tested; no silent Date ambiguity; all event-unit additions use local civil time |
| Positive integer event amounts; fractional amounts deferred | Validated before event insertion; invalid input does not poison in-memory records |
| Half-open positive-duration cells and events | Implemented; repeated hours distinct, missing hour skipped, exact ending boundary excluded; one-ms intersections retained |
| Equal-width semantic cells and one continuous index/fraction map | Implemented/tested across all ten units, historical dates and DST. Fractions use actual elapsed time |
| Forward/inverse mapping | Tested to <=1 millisecond; cell traversal and calendar arithmetic remain distinct |
| Cursor-anchored zoom and center-anchored keyboard changes | Tested across all adjacent units/repeated cycles; no constant month ratios |
| Header/grid/stroke/list alignment | Shared coordinates/boundaries; automated projection tests and Chrome DOM alignment checks pass |
| Stroke/list routing uses source semantic granularity | User-approved rule: finer definedUnit -> list, equal/coarser -> stroke, independent of amount. Duration comparison is explicitly not the rule |
| Stroke envelope covers actual intersected cells | Implemented/tested for month ends/leap years/DST and exact exclusive ends; stored terms unchanged |
| 640px frame; at least three settled unit-widths fit | Width 640/cell cap640/3 tested; dynamic rendered coverage prevents blank edges at smaller widths |
| Provisional lanes remain provisional | assignRowsForUnit unchanged; no replacement Packing activation, cache redesign or new conflict rules |
| Memory only | Existing arrays/session behavior retained; no storage/backend/persistence |
| Existing styling/assets, three header rows where levels available, stationary part backgrounds and horizontal motion | Preserved structurally; Chrome screenshots/interaction checks performed, not exhaustive visual regression testing |

## Remaining limitations

Physical Safari/macOS pinch, browser history/page zoom and animation paint nuances require device testing. Native SVG-ref use-gesture binding fixes the passive wheel listener failure reproduced in Chrome. A global CSS scale is only a local approximation across nonlinear semantic mappings; settled anchor/geometry tests pass.

Existing row-cache loss, clipped/crowded lists and long-stroke offscreen labels are not fixed or approved invariants. Drafts retain current-viewport-at-submission behavior. Historical zone data depends on the host IANA database; far sub-day lookup cost depends on transitions enumerated by Temporal. Fractional event meanings remain deferred. The GitHub origin is https://github.com/rctdeclan/tgo.git and main tracks origin/main. Linux Cloud verification and tooling audit findings are recorded in CLOUD_BASELINE.md.
