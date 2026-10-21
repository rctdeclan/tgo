# Codex Cloud development baseline

Verified 2026-10-21 from source commit `b765f608285ef913f94ede1da0f977a502d169ae` (the existing Cookbook/Temporal handoff). Branch: `main`, tracking `origin/main`. Remote: `https://github.com/rctdeclan/tgo.git`. A fresh public clone succeeded after repository access was enabled; `git pull --ff-only` reported already up to date. Initial working tree was clean, with no unfinished local changes to preserve. The earlier Mac workspace or chat-only artifacts are not available in this checkout.

The repository is ready for continued Codex Cloud development with the limitations below. This initialization changes documentation only. Application code, UI, active lane algorithm, dependencies and lockfile remain unchanged. Existing implementation and tests are already committed in the source baseline; no implementation work was invented to satisfy documented plans.

## Publication status

Resolved: after the user updated the GitHub connection, `git push origin main` succeeded and published the verified documentation commit `5041e0c39b1fa840c126d48a78a45e5a20e78330` to https://github.com/rctdeclan/tgo. The earlier attempt returned HTTP 403; that access failure is historical. This session now has verified push access to origin/main. No force-push or application changes were needed. Retrieve the latest local documentation commit with `git log -1 --format=%H`.

## Setup and verification

Checkout: `/workspace/tgo`, Linux x86_64. Default environment: Node 24.19.0 and npm 11.9.0. `.nvmrc` specifies Node 22.14.0; that exact Node version was also used for a separate full test/build run through a temporary npm-exec runtime. No Node pin or package version was changed.

```sh
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
# Production smoke after building:
npm run preview -- --host 0.0.0.0
```

Install devDependencies: esbuild is used by the focused JSX test loader and Vite builds the application. Never copy macOS node_modules. No backend, database, application secrets or runtime external API access is required. Installation needs registry access or a populated cache. Cloud networking was available through the configured proxy; no VPN or outbound identity was configured. The current task does not configure future environment setup scripts or guarantee that preview URLs persist across sessions.

| Check | Cloud result |
| --- | --- |
| Fresh `npm ci` | Pass; 67 packages installed; package-lock.json unchanged |
| `npm test` with default Node 24.19.0 | 49/49 pass, zero skipped/failures |
| Node 22.14.0 full suite | 49/49 pass via `npm exec --yes --package=node@22.14.0 -- node --test tests/*.test.js` |
| Host-timezone independence | 10/10 calendar/header tests pass with `TZ=Pacific/Honolulu` |
| Production build on both Node versions | Pass; 54 modules; JS 352.80 kB / 108.72 kB gzip |
| Lint / static type checking | No scripts or configured lint/type-check toolchain; not claimed as passing checks |
| Vite development server | Starts in this Linux checkout; port 5173 HTML and `/src/main.jsx` return HTTP 200 |
| Production preview | Port 4173; the same complete browser smoke sequence passes |
| Dependency manifests / generated outputs | package.json and lockfile tracked; node_modules, dist, coverage and common secret paths ignored and not tracked |
| Credential pattern check | No matches for scoped private-key/GitHub-token/AWS-access-key patterns; not an exhaustive secret audit |
| `git diff --check` | Pass |

Browser testing uses the environment's installed Python Playwright and Chromium 154.0.8037.57. A temporary `/tmp` driver adds no repository dependency or committed browser test suite. Both development-server and production-preview smoke checks passed HTTP loading, React rendering, the 640x520 SVG/two backgrounds, keyboard zoom/pan, native wheel/ctrl-wheel dispatch, inline Enter creation, stroke-to-list transition, header click, and session reset on reload without application console/page errors. The routing smoke pans into an uncrowded future period because existing lists show at most six entries per column. This does not verify physical trackpad delivery, all levels/paint frames, pixel-perfect alignment or accessibility. Domain/geometry assertions remain covered by the existing automated suite.

## Current functionality and architecture

Cookbook P2–P3 and Temporal P4–P5 are implemented, supported by source inspection and the passing tests. P6 remains partly verified: automated tests/build and Chromium smoke are available; hardware Safari/trackpad and exhaustive visual checks remain outstanding.

- **Compound Class:** `compose(Base).part(...).body(...).view(...).build()` returns a class. `src/main.jsx` constructs one App and mounts its View. After Base construction, the builder constructs Body and copies its own data, installs ordinary Body prototype members on app, constructs Parts in declaration order, automatically calls init once, and later supplies `(parts, app)` to View. Own accessor/function-valued Body fields are rejected; no arrow rebinding is attempted. Methods retain normal JavaScript receiver semantics. Built classes capture their declarations.
- **Strict α → β → γ:** inline α is supplied to a Part-owned β; β constructs and returns one reusable γ retaining its context and incorporating α in executable behavior. Conditional/repeated α calls, surrounding work, transformed/ignored α results and independent/no γ return are permitted. This is a role/construction contract, not a requirement to spell variables in Greek or universally return `alpha(...)`. Pure math/calendar helpers remain ordinary functions.
- **Isolation and orchestration:** Parts do not retain app/siblings or discover peers through aliases. ViewportPart reads only constructor viewportConfig and owns one createViewport instance. Body.init constructs ten capabilities once. Creation → insertion → local event observer → Body.refresh and header → viewport navigation → refresh are explicitly wired. Body publishes a shared viewport/layout/header/lists snapshot; React uses useSyncExternalStore. No Context, bus, registry or global scheduling store replaces the wiring. Hover/draft/focus/input and animation adapters remain presentation-local.
- **Temporal semantic calendar:** `src/domain/calendar.js` uses exact `@js-temporal/polyfill` 0.5.1, Europe/Amsterdam, Monday weeks, a local 1970-01-05 fortnight anchor, Gregorian quarters and constrained month ends. The five core operations are cellAt, nextCell, cellPosition, coordinate and instantAt. Cells have integer epoch-ms `[start,end)` boundaries and consecutive indexes. Repeated hours are distinct; missing boundaries are skipped; four-hour cells follow 00/04/08/12/16/20. Event arithmetic uses local wall time, compatible gap/overlap handling and valid anchor-offset preservation. Coordinate fractions use actual elapsed time and remain separate from deferred fractional event amounts.
- **Coordinates and navigation:** `q(t) = index + elapsed fraction`; `x(t) = 320 + offset + (q(t)-q(origin))*120*zoom`. The inverse uses the same cells. Cursor zoom preserves the instant under the cursor; keyboard level changes preserve center; header navigation centers the selected instant. Local interval spans replace fixed month/week ratios, and rendered-column coverage grows at small widths. One cell stays equal-width despite variable real duration.
- **Rendering:** HeaderPart iterates actual calendar cells for up to three available levels and uses Amsterdam labels. StrokesPart owns the in-memory event array, projection and existing assignRowsForUnit. PackingPart is registered/tested but inactive in the lane path. ListsPart receives shared rowCount/listItems/viewport. Views render the existing 640x520 SVG, stationary part-owned textures, native-unit borders, header chips and lists below strokes. Wheel handling targets the SVG ref with passive:false; Safari-specific listeners remain.
- **Events and routing:** Event terms remain `{anchor, definedUnit, amount}`; end is derived, not persisted. Positive integer amounts/intervals are validated before insertion. Finer definedUnit rank than the display means one list entry in its anchor column, regardless of duration; equal/coarser means stroke. Stroke geometry covers all cells intersecting the real interval, with an exact exclusive end excluded. Jan 31 + one month covers January/February; a 31-day event remains a month-view list entry. Amount controls interval, never routing.

See [ARCHITECTURE.md](ARCHITECTURE.md), [CALENDAR.md](CALENDAR.md), [DESIGN.md](DESIGN.md) and [INVARIANTS.md](INVARIANTS.md) for detailed contracts. Historical CURRENT_IMPLEMENTATION/ARCHITECTURAL_UNCERTAINTIES/Cookbook migration records describe earlier baselines and are labeled accordingly; their old singleton, synthetic duration and pending-policy statements are not current implementation rules. No unfinished source changes were discarded.

## Known bugs, limits and incomplete features

- Generated row-cache writes remain on projected copies, so canonical events do not retain resolved lanes and earlier insertions can displace rows. The existing test characterizes this defect. No lane redesign or cache repair was performed.
- Lists cap at six entries per anchor column; 40px item spacing exceeds the 110px section for crowded columns. No overflow indicator/scroll exists. Row growth can also push sections below the fixed frame. Long coarse-stroke labels can remain offscreen.
- Drafts store relative cell/row and resolve against the current viewport on submission. Gestures while typing can change the resulting time/unit.
- At quarter/year, fewer header levels exist; bottom-row styling/click behavior still checks rowOrder 2. Current-period tint refreshes with application updates, with no periodic clock. Keyboard controls are global outside editable targets; header targets lack full keyboard accessibility. Checkboxes are decorative.
- One horizontal CSS scale approximates nonlinear cross-unit geometry; intermediate animation and rapid-input paint need further browser review. Physical Safari/macOS pinch, page/history suppression and physical Chrome trackpads remain unverified in Cloud.
- Futura is referenced but not bundled. Linux font fallback can change measurements/appearance; no visual redesign or font replacement was made.
- Fractional event amounts are deferred/rejected. Persistence, recurrence, event editing/deletion/completion, drag/resize, timezone selection and responsive/mobile layout are absent; these are future features, not migration completion work.
- Historical timezone results depend on host Intl/IANA data. Very distant sub-day indexing can enumerate many Temporal transitions. There is no comprehensive validation of every external event metadata/config shape.
- The Mac iCloud dev-server stall is preserved in CLOUD_HANDOFF.md as historical evidence; this Linux checkout starts and serves successfully. Source-only clone cannot recover uncommitted Mac work or assets kept outside Git.

## Dependency audit and recommended next tasks

`npm audit` reports 9 development-tool dependency findings: 6 high, 2 moderate, 1 low. Packages reported are Vite, esbuild, Rollup, PostCSS, nanoid, source-map-js, Browserslist, baseline-browser-mapping and @babel/core. `npm audit --omit=dev` reports zero findings. Counts describe npm advisories, not proof of exploitability for this application's usage. Vite 5.4.21/esbuild 0.21.5 are the existing locked versions; no audit fix or dependency upgrade was applied during initialization.

Recommended follow-up order, requiring the normal scope for each future task:

1. Review the development-tool advisories and upgrade Vite/esbuild/transitive tooling in a dedicated maintenance change, repeating tests/build/browser checks. Keep development servers behind the Cloud session's controlled access.
2. Configure routine environment setup/CI to honor `.nvmrc`, run npm ci/test/build, and decide whether lint/static analysis and a reproducible browser smoke runner should be added.
3. Perform the documented physical Safari/trackpad checks and examine font fallback, all header levels and rapid keyboard transitions.
4. Agree on focused acceptance criteria for clipping/overflow, draft anchoring, coarse header clicks and lane-cache ownership before fixing those bugs. Preserve current characterization evidence; do not redesign lane packing as part of migration.

No new product features or interface redesign are implemented or authorized by these recommendations.
