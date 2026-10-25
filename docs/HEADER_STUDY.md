# Temporary collapsible-header schedule

Branch: `temporary/collapsible-header`, based on `main` at `11e009cf7a6936c76ff9040fbc4e42de23cea888`. This is the user-requested visual experiment based on the supplied dark schedule/blue backdrop reference. It is not merged into main and does not replace the original TGO Site.

## Interaction contract

- Each of the 20 existing seed items gets one separate row, in source order. Names stay in a pinned left column; actual Temporal-derived intervals form the colored bars. There is no overlap packing or separate finer-event list in this experimental presentation. The original routing and lane code remains intact.
- One active leaf header is shown: weeks, days or hours, determined by zoom. Clicking a week opens days; clicking a day opens hours. Tabs and the slider move between levels. Zoom retains the instant beneath the cursor/midpoint.
- “Fold week” at day detail or “Fold day” at hour detail collapses the visible center parent into a single header disclosure. Clicking that disclosure reopens its children. Folding changes header presentation, not event times or time geometry.
- Native horizontal scrolling generates the newly visible header leaves at the current zoom level. Manual folds are discarded after their periods leave the viewport, so returning to them automatically unfolds the appropriate detail. There is no stack of simultaneous week/day/hour scale rows.
- The event column stays fixed during horizontal scrolling and the header stays fixed during vertical scrolling. A narrower event column is used on phone-sized screens. iPad two-finger pan/pinch uses the existing frame-coalesced touch adapter. Trackpad Ctrl-wheel changes zoom; ordinary horizontal scrolling stays native.

## Architecture

`src/main.jsx` selects `ExperimentApp` on this branch only. The original App, Parts, viewport engine, calendar policies, packing and tests remain unchanged. New implementation lives under `src/experiment/`:

- `ExperimentApp.jsx` uses the mandatory compose/part/body/view/build class builder. Body wires event insertion/observation, timeline presentation and navigation with inline alphas and reusable Part-owned gammas. It publishes a shared snapshot with useSyncExternalStore.
- `TimelinePart.js` owns the study viewport and fold state. It retains no sibling/app instance. Presentation caches event geometry by source/unit and visible header geometry by range/scale/fold revision.
- `model.js` uses the shared Temporal cell/coordinate/inverse/eventInterval functions, including distinct repeated-hour cells. It does not replace the calendar engine with fixed day/month millisecond ratios.
- `ScheduleView.jsx` and `study.css` render the compact dark table and blue backdrop. Browser-local scroll/resize/touch adapters dispatch supplied capabilities; CSS grid lines and visible-only header leaves keep rendering small.
- `seeds.js` copies the existing 20 demo items into explicit study fixtures, with reference-inspired red/cyan/teal accents. It is not a new persistence layer.

## Verification

63 automated tests pass: the original 57 plus six study checks covering leaf levels, zoom anchoring, 25-hour DST-day expansion, independent rows, opening/folding and automatic scroll unfolding. The production Vite build passes. No dependency or lockfile changes.

Chromium browser checks pass: 20 names/bars, week → day → hour, fold/reopen, horizontal auto-unfold and return navigation, pinned names, sticky header with actual vertical scrolling, emulated two-finger pan/pinch and narrower phone layout, with no application console/page errors. Physical iPad Safari remains unverified. Screenshot review compared the implementation against the supplied reference.

## Limits / unfinished work

This is an in-memory, read-only scheduling study. It provides navigation and header exploration; original inline creation/editing is not exposed in this view. It shows a bounded 24-week range, eight weeks before the initial week and sixteen after, rather than infinite timeline loading. There are three detail levels; minute/month/quarter/year controls are not part of the experiment. Thin events retain a small visible hit-width and full titles. Header folds do not compress calendar time or rearrange rows. The clock/current marker is captured when opening the page, with no periodic timer. Existing main-branch limitations are not declared fixed by this experiment.

The reference is adapted to actual TGO event names and calendar semantics; ticket/engineer metadata from the picture is not fabricated. No backend, event persistence, recurrence, drag/resize or lane architecture is added.

## Isolated hosting

This branch has its own `.openai/hosting.json` project identity for the owner-private `tgo-header-study` Site. The main branch retains the original `tgo-ipad-planner` identity. Never publish this branch to the original Site as a shortcut. Source packaging uses a separate sanitized checkout at `/workspace/sites/tgo-header-study` and contains only the hosting manifest and built dist assets. As in earlier tasks, Sites helper scripts are unavailable in this environment; short-lived credentials are passed through hidden stdin and in-memory Git config, never saved in source or archives.
