> Current Temporal update (2026-10-21): P4/P5 are now implemented and verified with 49 tests/build and real Chrome interaction/alignment checks. CALENDAR.md and TEMPORAL_MIGRATION.md supersede pending calendar statuses below. Routing uses definedUnit rank, NOT the earlier duration comparison. Fractional event amounts are explicitly deferred. The following record is historical.

> P2-P3 verification update: builder lifecycle and production Cookbook wiring/isolation now have executable tests. See COOKBOOK_PROGRESS.md and tests/README.md for actual results and limits. Calendar cases below remain conditional future-phase examples, not implemented behavior.

# Focused Migration Verification Examples

Updated: 2026-10-21. These are specification/characterization examples; not all have been executed. Application source is unchanged. A Node built-in P1 suite now exercises the proposed Cookbook example and current-source characterization (see COOKBOOK_PROGRESS.md for current counts); see COOKBOOK_PROGRESS.md and tests/README.md for its limits. Approved assertions can guide further P1 work. Exact calendar and Cookbook example results marked conditional require contract approval before implementation tests encode them.

| Area | Example and expected observation | Authority / status |
| --- | --- | --- |
| Strict construction | Call Part beta once with inline alpha, reuse gamma, and exercise its intended alpha-bearing branches with retained context | Approved; not every gamma invocation must call alpha unconditionally or exactly once |
| Corrected function example (user's C2) | Batch gamma calls alpha per item, transforms results, updates closure state and returns its own summary; effect gamma ignores results and returns undefined; empty/disabled branches skip alpha | Executable tests cover approved freedoms; example payloads are not universal signatures |
| Fluent class construction | Build and instantiate real App through compose/part/body/view/build; confirm config, Parts, Body orchestration and View mounting under remaining BODY/WIRING class contract | Builder mandatory; exact lifecycle assertions wait for confirmation |
| Part isolation | Exercise list updates without Lists reading app.parts.strokes or holding a sibling alias; verify Compound-wired capabilities and Body orchestration | Approved; current source is known to violate this |
| Local versus domain state | Hover/focus/draft text and visual zoom progress can update locally; event submission dispatches supplied capability; View does not write event array | Approved; do not assert zero React hooks |
| Equal month cells | February and March boundaries are separated by one cellWidth each in month view | Approved, independent of their actual day count |
| February/leap year | Feb 1 -> Mar 1 contains 28 dates in 2023, 29 in 2024; March contains 31 | Approved calendar requirement; exact instants use approved zone |
| Quarter | One quarter contains three actual months, including leap February where applicable | Approved; Jan 1 -> Apr 1 example conditional on T4 calendar-quarter anchor |
| Fortnight | Two adjacent configured weeks form one fortnight; no year reset or DST millisecond assumption | Two weeks approved; Jan 5 -> Jan 19 2026 fixture conditional on T1/T3 |
| Forward/inverse | For interior t and exact boundaries, inverse(forward(t)) agrees within 1ms using integer timestamp inputs; floating intermediate coordinates may differ by rounding | Approved round-trip requirement; 1ms is proposed verification tolerance |
| Concrete month fraction | In a month frame with Jan=0, Feb=1, Mar=2, Feb 15 2024 noon maps to q=1.5 and inverses to the same instant | Conditional T2/T5 elapsed-fraction example; no offset transition occurs in this February |
| Boundary continuity | Just before Mar 1 approaches the March boundary q from below; exact Mar 1 equals it; no date jump | Approved continuity; exact ownership conditional T8 |
| DST day | Amsterdam Mar 29 2026 spans 23h, Oct 25 spans 25h, both one day cell; spring noon fraction is 11/23 | Conditional T2/T5; equal day-cell widths approved |
| Repeated/missing hours | Autumn 02:00+02 and 02:00+01 are distinct cells; spring nonexistent 02:00 is skipped | Conditional T2a |
| Month end | Jan 31 2023 +1 month -> Feb 28; leap 2024 -> Feb 29; original Jan 31 +2 -> Mar 31 | Conditional T6; distinguish from repeated independent +1 additions |
| Sub-unit routing | 28 days from Feb 1 2023 -> stroke in month view; 28 days from Mar 1 -> list; one semantic month from Jan 31 -> stroke | Conditional T6/T7, illustrates semantic rather than average-duration comparison |
| Exclusive end | Interval ending exactly Mar 1 excludes March; projected stroke envelope covers only intersected cells | Conditional T8/T9 |
| Cursor anchor | With cursor x=477 in 640px frame, capture t, change unit/scale, recompute offset; new inverse at477 recovers t; repeat in/out over Feb/Mar | Approved anchor/round-trip rule; tolerance 1ms proposed |
| No constant scale assumption | Compare different cursor dates near Feb/Mar; solve anchor using active maps instead of a single month/day ratio | Approved equal-cell architecture |
| Shared layers | For one selected timestamp boundary, header edge, list column and underlying grid use identical active q/x; event endpoints use same map before optional approved snapping | Approved alignment; T9 governs snapped envelope |
| Keyboard/header | One Up/Down changes one semantic level, Left/Right shifts one cell; header click keeps target-level concept and selected date | Existing concepts preserved; exact landing/cap conditional N1/N2 |
| Animation | A visual-only horizontal animation does not change canonical anchor or event time; rapid input retains intended target | Approved ownership/anchor requirements; visual style detail can stay local |
| In-memory | Create event, navigate away/back, verify record remains; reload creates fresh seed session and does not recover additions | Approved; no storage integration needed |
| 640px | SVG/layout remains640; default pointer/anchor paths do not assume1280 | Approved; current fallback discrepancy remains |
| Temporary positioning | Preserve sorted overlap behavior for fixture events using current assignRowsForUnit; keep known cache-loss/displacement defects explicit | Characterization only; no new placement guarantee or replacement algorithm |

P1 can execute current-source construction, projection/routing, temporary placement, memory and width characterization without choosing calendar defaults or inventing Cookbook. A known defect reproduction documents a gap; it is not a passing target-conformance test. Proposed tests should use current toolchain where practical and avoid installing a large test framework merely for these fixtures.
