# TGO: Mac to Cloud Handoff

## Current Cloud status (2026-10-21)

The repository is published at https://github.com/rctdeclan/tgo.git. A fresh Linux clone is on main tracking origin/main; git pull --ff-only reports already up to date at b765f608285ef913f94ede1da0f977a502d169ae. Dependency installation, 49 tests, production build and Vite HTTP serving pass in Codex Cloud. Read [CLOUD_BASELINE.md](CLOUD_BASELINE.md) for current runtime/browser evidence, dependency audit findings and next tasks. AGENTS.md and ARCHITECTURE.md describe current invariants. No application source or dependency versions are changed by initialization.

The original handoff record below is historical Mac evidence. Its missing-remote and unverified-Linux statements describe the pre-publication state and are superseded by the Cloud baseline. Its limitations remain unless explicitly reverified there.

## Historical Mac handoff record

Prepared 2026-10-21. Scope: this repository only, not sibling archives. The user authorized verification, documentation, a commit and a push if an intended remote exists. Branch: main. At inspection, no Git remote or upstream was configured; no GitHub repository URL is known. No repository was created and no remote was guessed.

## Reproduce on another machine

Clone the repository after it is published to GitHub and run commands from the root containing package.json. Reference runtime: Node 22.14.0, npm 10.9.2; .nvmrc records Node. Node needs working Intl/IANA Europe/Amsterdam data. No credentials, environment variables, backend or database are required.

```sh
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
# Alternatively, after building:
npm run preview -- --host 0.0.0.0
```

Use npm ci with devDependencies: the JSX test loader needs esbuild and the build needs Vite. Do not transfer node_modules from macOS; the lockfile includes platform-specific optional native packages for installation on the destination. Dependency installation needs npm registry access or a populated cache; application runtime does not require external APIs. No lint or type-check command exists.

The .code-workspace file now opens only this root; its old sibling-archive reference was removed. All imports, assets and tests are repository-relative. Dependencies and package-lock.json belong in Git. node_modules, dist, coverage, logs and common local credential files are ignored. Ignore rules do not remove already tracked secrets; inspect staged files before each push. A scoped pattern scan found no obvious credential/private-key tokens; it is not a security certification.

## Verified implementation

- P2-P3 Cookbook: mandatory compose(Base).part(...).body(...).view(...).build() returns a class. Body config data is copied before declaration-ordered Parts; ordinary prototype methods use the app receiver; init runs automatically once after Parts and wires capabilities; View receives (parts, app). Own function-valued Body fields are rejected rather than implicitly rebound.
- Inline alpha / Part-owned beta / reusable gamma: beta creates gamma in its closure, gamma incorporates alpha in executable behavior, retains context and may do other work or return a different value. Ten capabilities are explicitly wired in Body.init. Parts neither discover nor retain siblings; React presentation uses supplied state/actions. No Context, event bus or service registry.
- P4-P5 Temporal: @js-temporal/polyfill 0.5.1 supplies calendar arithmetic, timezone conversion and transitions. Core operations are cellAt, nextCell, cellPosition, coordinate and instantAt. Cells have stable indexes and real half-open epoch-ms boundaries; coordinates are index plus elapsed fraction, giving equal-width cells and a shared inverse.
- Europe/Amsterdam, Monday weeks, fortnight anchor local 1970-01-05, Gregorian quarters, month-end constrain. All event addition uses local wall time, preserving valid anchor offsets. Gaps shift forward and ambiguous input defaults earlier unless an offset selects otherwise. Repeated sub-day cells remain distinct; four-hour cells use the local 00/04/08/12/16/20 grid.
- Routing uses semantic definedUnit rank only: finer events go to lists; equal/coarser events are strokes. Amount determines interval, not routing. Stroke projection includes every intersected cell of [start,end), excluding an exact end boundary's following cell. Jan 31 +1 month intersects January/February; 28-day and 31-day events stay lists in month view.
- 640x520 SVG, original styling/textures, three header rows where levels exist, session-only memory state and provisional assignRowsForUnit are preserved. PackingPart is not the active lane algorithm.

Detailed contracts: ARCHITECTURE.md, CALENDAR.md, DESIGN.md and INVARIANTS.md. Historical audits and migration records remain for context; they do not override current approved rules.

## Verification record

The full 49-test suite passes in the actual project. Production build passes. Tests cover builder order/receiver/init, reusable closures and isolation; calendar lengths/leaps/DST/negative indexes; inverse mapping, cursor anchoring, half-open projection, semantic routing, creation, memory state and 640px presentation. Additional host-timezone checks and real Chrome smoke checks are recorded in TEMPORAL_MIGRATION.md. Fresh-install and current browser results are recorded below after execution.

## Known limitations / unfinished work

- Linux/Codex Cloud execution has not been performed locally; do not equate a Mac clean install with Linux verification.
- iCloud-backed npm run dev previously stalled on requests, including a 120-second browser timeout. Identical-source development outside iCloud and actual production preview worked. Do not silently move/link dependencies as a workaround. Cloud checkout avoids this local path, but Cloud execution must still be verified.
- Physical Safari/macOS pinch, history/page-zoom prevention and exhaustive cross-browser motion remain manual checks. Simulated ctrl-wheel is not physical gesture certification.
- Existing derived lane-cache writes are lost, crowded list content can clip, and coarse long-event labels can be offscreen. Drafts resolve against the current viewport when submitted. Lane redesign is deferred, not implemented here.
- A single horizontal animation scale only approximates nonlinear cross-unit geometry during transitions; settled anchors and positions are tested.
- Fractional event amounts are deferred and rejected; coordinate fractions remain supported. No persistence, backend, recurrence or timezone selector is implemented.
- Historical zone results depend on host IANA data; distant sub-day indexes enumerate Temporal transitions. Temporal increases bundled JS to approximately 353 kB / 109 kB gzip.
- Generated visual design concepts from the conversation are not implemented. Their files live outside this repository and will not transfer with Git; no redesign has been approved.

## Connect GitHub (not executed: no destination supplied)

Create an empty GitHub repository under the intended account/organization (choose visibility deliberately; do not initialize it with README/license if importing this history). Authenticate Git over SSH or HTTPS, then run from this repository, replacing the placeholder:

```sh
git remote add origin <GITHUB_REPOSITORY_URL>
git remote -v
git push -u origin main
```

If the destination already has commits, inspect/fetch its history and reconcile explicitly; do not force-push or overwrite it. No remote means the handoff commit exists locally only and is not yet a backup on GitHub.

Connect/authorize the GitHub repository in Codex Cloud, create an environment for this repository, specify Node 22 and npm ci for installation, then verify npm test and npm run build there. Start Vite with --host 0.0.0.0 when browser access is needed, using the environment's actual preview URL rather than assuming Mac localhost access. Review and publish the tested environment. See [official Cloud environment setup](https://learn.chatgpt.com/docs/environments/cloud-environments).

AGENTS.md is the repository-contained context for a new Cloud task; chat history, temporary local test drivers and generated concept images are not Git dependencies. Start the first Cloud task by reading AGENTS.md and this document and repeating installation/tests/build before feature changes.

## Final handoff verification (2026-10-21)

- Actual main project: npm test, 49/49 pass; npm run build passes (54 modules; JS 352.80 kB / 108.72 kB gzip); git diff --check passes.
- Fresh source-only checkout at a temporary non-iCloud path: npm ci --offline --no-audit --no-fund installs 67 packages without reusing node_modules; lockfile stays byte-identical. TZ=UTC npm test passes 49/49; build passes; calendar/header tests pass 10/10 with TZ=Pacific/Honolulu. This is a clean Mac install, not a claim of Linux execution.
- Installed Google Chrome, headless through an external temporary playwright-core driver: clean-install development-server smoke passes rendering, 640px/two backgrounds, keyboard level bounds/pan, native horizontal wheel, ctrl-wheel dispatch, inline creation, list transition, header navigation and DOM column alignment without runtime/console errors. Actual production preview also responds HTTP 200. Detailed actual-preview interaction result is recorded in IMPLEMENTATION_STATUS.md. The browser driver is not a dependency committed to this repository.
- Common secret/build/dependency paths are ignored; no such paths are already tracked. Scoped obvious-token/private-key scan found no matches in source/docs/config. This is not an exhaustive credential/security audit.
- No Docker/Linux runtime was available for this check; Cloud must repeat npm ci/test/build. Futura is referenced but not bundled, so Linux font fallback may alter label measurements/appearance. No font or visual redesign is made here.
- No application runtime source changed during handoff preparation; only documentation, ignore rules, Node version and editor workspace portability were adjusted. Existing Cookbook/Temporal source/tests/dependencies are included in the handoff commit.
- No Git remote/upstream is configured; therefore no push can be attempted safely. Retrieve the resulting commit hash with git log -1 --format=%H. It is intentionally not embedded in this commit's own files.

The actual-project production-preview Chrome check subsequently passed the same full interaction/alignment smoke sequence with no runtime or console errors, not only the HTTP readiness probe.
