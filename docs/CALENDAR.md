# Temporal Calendar and Coordinates

Implemented: 2026-10-21. The corrected Temporal task and subsequent user replies supersede the earlier pending-policy proposals. Calendar calculations are pure helpers in src/domain/calendar.js, shared by navigation, headers, projection and lists. @js-temporal/polyfill 0.5.1 is the authority; there is no custom Gregorian or timezone-rule engine.

## Representation and small API

Existing events remain { anchor, definedUnit, amount }. Anchor/start/end values are integer epoch milliseconds identifying absolute instants. Cells are plain { unit, index, start, end } records with half-open [start,end) ownership. No Temporal objects are persisted and no event end field is stored.

| Operation | Contract |
| --- | --- |
| cellAt(instant, unit) | Containing semantic cell, including an integer index and real boundaries |
| nextCell(cell, amount = 1) | Advance/retreat an integer number of cells, not an event-duration addition |
| cellPosition(instant, cell) | Elapsed fraction (instant-start)/(end-start); boundary endpoint end returns 1, without making end a member of the cell |
| coordinate(instant, unit) | cell.index + elapsed fraction |
| instantAt(coordinate, unit) | Inverse using the same indexed cell; nearest integer epoch millisecond |

Supporting helpers: eventInterval(term) resolves an event without changing storage; addCalendar(instant,unit,integerAmount) performs wall-clock addition; fromLocal(localDateTime,{offset?}) explicitly resolves local input; zoned(instant) supplies the configured Temporal.ZonedDateTime for formatting. Core operations accept epoch milliseconds, absolute ISO instant strings or Temporal values with epochMilliseconds. fromLocal is for zoneless local input; supply an offset through its explicit option when selecting an overlap occurrence.

Supported units: minute, fifteenMinute, hour, fourHour, day, week, fortnight, month, quarter, year. Invalid units/non-finite coordinates fail clearly. Fractional event amounts are deferred by user decision; positive integer event amounts are validated before insertion. nextCell/addCalendar integer amounts can be negative; addCalendar(instant,unit,0) preserves the original instant.

## Approved calendar policies

- Europe/Amsterdam, consistently independent of the OS timezone. Temporal uses the host's IANA/Intl data; historical rules may depend on the installed database version.
- Gregorian month/year arithmetic, explicit overflow: constrain. January 31 +1 month ends February 28/29; +2 months is calculated directly from the original anchor and ends March 31. Quarters add three calendar months, years account for leap days.
- Monday weeks. Fortnights are consecutive two-week periods anchored at local Monday 1970-01-05 midnight; pairing does not restart at New Year.
- Quarters begin January/April/July/October. Day/month/year index zero starts at local 1970-01-01; week/fortnight index zero at 1970-01-05. Four-hour cells use six civil blocks per local date, at 00/04/08/12/16/20. Negative indices are supported.
- Explicit disambiguation: compatible. Nonexistent local 2026-03-29 02:30 resolves to 03:30; ambiguous 2026-10-25 02:30 defaults to the earlier +02:00 occurrence. fromLocal(...,{offset:'+01:00'}) selects the later occurrence and rejects an invalid offset.
- Calendar addition uses PlainDateTime.add followed by ZonedDateTime.from with offset: prefer and disambiguation: compatible. A valid anchor offset is retained, as approved. The second autumn 02:30 + one minute is the second 02:31, not a backward jump.
- ALL event units use local wall-clock addition. One hour from the first autumn 02:30 ends at 03:30 (two elapsed hours). One fourHour from spring 01:30 ends 05:30 (three elapsed hours). This intentionally differs from exact elapsed-time arithmetic.

Calendar addition is not generally invertible: clamping January 31 to February 28 and then independently subtracting one month gives January 28. A backward wall-clock addition into a spring gap can resolve forward to the starting instant. These facts do not compromise the forward/inverse coordinate mapping. Positive event intervals are required.

## Cells versus arithmetic

Hours/minutes/15-minute cells follow chronological actual civil-grid boundaries. Missing boundaries are skipped; repeated autumn hours are distinct cells/instants. The two 02:30 occurrences have hour coordinates one cell apart. Four-hour cells remain 00-04 etc.; spring/autumn first blocks have three/five elapsed hours. Days have 23/25 elapsed hours at DST changes but each has width one in day coordinates.

nextCell(firstRepeatedHour) reaches the second repeated hour. addCalendar(first02:30,'hour',1) instead reaches 03:30 because the approved event policy is wall-clock arithmetic. Do not replace either operation with the other.

Temporal supplies offset transitions via getTimeZoneTransition and offsetNanoseconds. The sub-day index adapter counts grid boundaries in constant-offset segments, preserving consecutive integer indexes and partial cells at historical non-whole-hour transitions. It does not predict DST dates or implement timezone rules. Segment memoization is deterministic mathematical caching, not shared scheduling state; lookup order does not change results. Very distant sub-day lookups may enumerate many Temporal transitions.

For civil date units, Temporal PlainDate/PlainYearMonth addition/difference supplies boundaries and indexes. Remaining integer divisions only group 15 minutes, four hours, seven/fourteen days and three months; they are not elapsed-duration approximations.

## Equal-width, continuous coordinates

For a cell i with actual instants start/end:

```text
q(t) = i + (t-start)/(end-start)
t(q) = start(floor(q)) + fraction(q) * (end-start)
x(t) = 320 + offsetPx + (q(t)-q(origin)) * cellWidth
```

The inverse rounds to the existing millisecond precision. Adjacent boundaries meet at the same integer coordinate. February and March are each one month cell; their lengths differ. March headers span 31 day cells in day view. Coordinate fractions use ELAPSED time; they do not define fractional event amounts.

The viewport inverts its old mapping at the cursor, then solves the new offset for that exact instant. Local coarse/fine interval spans determine level-change scale estimates, not a fixed month/week ratio. Keyboard zoom keeps the center instant. Horizontal pan advances semantic coordinates; it need not retain a day-of-month in a differently sized month. Header, grid, lists and events share the same origin cell. Dynamic rendered-cell coverage prevents blank edges at small cell widths.

## Projection and routing: separately approved rules

src/domain/projection.js separates these concerns:

- Routing compares UNIT_ORDER ranks only. A finer definedUnit always goes to lists, regardless of amount; equal/coarser units are strokes. Source granularity is never inferred from duration.
- A stroke covers every displayed cell intersected by its actual event interval. The first cell contains start; the last contains end-1 millisecond, preserving exact exclusive-end behavior without floating-point epsilon guesses.
- January 31 +1 month spans January and February month cells. March 1 +1 month occupies March only. March 1 +28 days and March 15 +31 days both go to month-view lists.
- List entries occur once in their anchor's displayed-unit column, preserving source insertion order. A long finer-unit event is still a single list entry, not duplicated across its duration.
- Canonical records are unchanged. Projected interval geometry feeds the existing assignRowsForUnit algorithm; no lane redesign or derived row-cache fix was introduced.

Header grouping iterates actual calendar cells, projects their boundaries and uses the same Amsterdam labels/ISO week data. Existing three-row styling, current-period colors, hover, chips and clicks remain; coarse zooms still have fewer available levels. List indicators use the same timezone. Week-of-month indicator text retains the existing day-1..7 bucket convention rather than silently introducing another list-label design.

## Evidence and remaining limits

See TEMPORAL_MIGRATION.md for tests, build, real Chrome smoke results and file inventory. No fractional-event policy, timezone selector, persistence, lane replacement or unrelated scheduling feature was added. Existing list clipping/overflow, row-cache loss and draft interpretation against the current viewport at submission remain. Cross-level mappings are not globally affine, so the existing short horizontal keyboard scale animation is a local approximation; settled coordinates/anchors are authoritative. Physical Safari/macOS pinch/history gestures require manual verification.

Primary references: [Temporal.ZonedDateTime](https://tc39.es/proposal-temporal/docs/zoneddatetime.html), [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill).
