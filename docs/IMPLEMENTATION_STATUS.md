# Current Implementation Status

Updated: 2026-10-21. P2-P3 Cookbook and P4/P5 Temporal integration are implemented and ready for user review. Earlier source audits describe baseline history, not these current implementation facts.

| Feature | Status and verification limit |
| --- | --- |
| Confirmed Cookbook builder lifecycle | Implemented/tested; unchanged in calendar phase |
| Strict Compound Functions / isolated Parts / Body orchestration | Implemented; production/source/runtime guards pass |
| Semantic calendar engine | Implemented using Temporal, Amsterdam and explicit arithmetic/DST policies |
| Equal-width semantic coordinates and inverse | Implemented/tested for all units, DST/leap dates and negative/historical indices; <=1ms round trips |
| Semantic navigation and cursor anchoring | Implemented; all adjacent transitions/repeated cycles tested; Chrome input checks pass |
| Real interval projection / exclusive ends | Implemented/tested, including one-ms boundary crossings |
| Stroke/list routing | Semantic definedUnit rank only; amount independent; approved month examples tested |
| Headers and lists | Shared coordinates/timezone; actual interval grouping; three-row appearance retained; Chrome column alignment checks pass |
| Creation / memory / provisional lanes | Preserved/tested; integer validation before mutation; no storage or new lane algorithm |
| Native wheel handling | Corrected to use-gesture target/ref passive:false; actual Chrome passive errors eliminated |
| Production build | Passes; Temporal increases bundled JS to ~353kB /109kB gzip |
| Automated tests | 49 pass; calendar/header tests also pass under Pacific/Honolulu host timezone |
| Browser runtime | Real headless Chrome loads and exercises navigation, creation, routing and header interactions without application console/page errors |
| Physical Safari/macOS gestures | Not verified; manual steps in TEMPORAL_MIGRATION.md |
| Fractional event amounts | Explicitly deferred; not approximated |
| Existing row-cache loss/list clipping/offscreen stroke labels | Still present; not repaired or adopted as intended design |
| Persistence/backend/new lane architecture | Not introduced |
| Linux/Codex Cloud runtime | Fresh npm ci, 49 tests, build and Vite HTTP serving pass; current evidence in CLOUD_BASELINE.md |

The implementation is published at origin (https://github.com/rctdeclan/tgo.git), with main tracking origin/main. See CLOUD_BASELINE.md for current Cloud verification and outstanding issues. See TEMPORAL_MIGRATION.md for file inventory, test increments and remaining limitations; CALENDAR.md documents the API and distinction between calendar addition, cell traversal, elapsed fractions and projection.

## Historical Mac actual-path environment check

The main project's 49 tests, production build and diff-whitespace check pass. Real Chrome smoke checks pass against its production preview (port 5182). The same source runs successfully under the local /private/tmp development server, but the iCloud-backed development server still stalls on requests; actual-path npm run dev is not verified working. No node_modules relocation was performed.

## Historical Mac handoff verification

These pre-publication results are preserved as history. Missing-remote and unverified-Linux statements below are superseded by CLOUD_BASELINE.md.

2026-10-21: all 49 tests/build pass in the actual project and after a fresh source-only lockfile install outside iCloud; 10 calendar/header tests pass under Pacific/Honolulu. Chrome smoke passes the clean development checkout. Common secret/build/dependency paths are ignored and not tracked. Linux/Cloud execution and physical Safari remain unverified. Futura is not bundled and can fall back on Linux. See CLOUD_HANDOFF.md for reproducible setup and missing-remote steps. Commit is authorized by the user; no remote is configured for publication.

Actual-project production-preview Chrome interaction check also passed the complete smoke sequence again (rendering, navigation, creation, routing, header actions and column alignment), with no application runtime or console errors.
