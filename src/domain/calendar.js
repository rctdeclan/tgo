import { Temporal } from "@js-temporal/polyfill"

export const TIME_ZONE = "Europe/Amsterdam"
export const UNIT_ORDER = ["minute", "fifteenMinute", "hour", "fourHour", "day", "week", "fortnight", "month", "quarter", "year"]
const DISAMBIGUATION = "compatible" // Earlier overlap; shift gaps forward.
const DATE_ANCHOR = Temporal.PlainDate.from("1970-01-01")
const WEEK_ANCHOR = Temporal.PlainDate.from("1970-01-05")
const DURATIONS = {
  minute: ["minutes", 1], fifteenMinute: ["minutes", 15], hour: ["hours", 1],
  fourHour: ["hours", 4], day: ["days", 1], week: ["days", 7],
  fortnight: ["days", 14], month: ["months", 1], quarter: ["months", 3], year: ["years", 1]
}

function validateUnit(unit) {
  if (!Object.hasOwn(DURATIONS, unit)) throw new RangeError(`Unknown calendar unit: ${unit}`)
}
function integer(value, label) {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} must be a safe integer; fractional event amounts are deferred`)
  return value
}
function milliseconds(value) {
  if (typeof value === "number") return Temporal.Instant.fromEpochMilliseconds(value).epochMilliseconds
  if (typeof value?.epochMilliseconds === "number") return Temporal.Instant.fromEpochMilliseconds(value.epochMilliseconds).epochMilliseconds
  return Temporal.Instant.from(value).epochMilliseconds
}
export function zoned(value) {
  return Temporal.Instant.fromEpochMilliseconds(milliseconds(value)).toZonedDateTimeISO(TIME_ZONE)
}
export function fromLocal(value, { offset } = {}) {
  const local = typeof value === "string" && !offset
    ? value : Temporal.PlainDateTime.from(value, { overflow: "reject" }).toString()
  return Temporal.ZonedDateTime.from(`${local}${offset ?? ""}[${TIME_ZONE}]`, {
    overflow: "reject", offset: "reject", disambiguation: DISAMBIGUATION
  }).epochMilliseconds
}

export function addCalendar(value, unit, amount) {
  validateUnit(unit)
  integer(amount, "Calendar amount")
  const start = zoned(value)
  if (amount === 0) return start.epochMilliseconds
  const [field, multiple] = DURATIONS[unit]
  const local = start.toPlainDateTime().add({ [field]: integer(amount * multiple, "Calendar amount") }, { overflow: "constrain" })
  return Temporal.ZonedDateTime.from(`${local}${start.offset}[${TIME_ZONE}]`, {
    overflow: "constrain", disambiguation: DISAMBIGUATION, offset: "prefer"
  }).epochMilliseconds
}

// Temporal supplies every transition and offset. This adapter only counts/ranks
// civil grid boundaries, including partial cells at historical offset changes.
function subdayGrid(step) {
  const epoch = zoned(fromLocal("1970-01-01T00:00"))
  const records = [{ time: epoch.epochMilliseconds, offset: epoch.offsetNanoseconds / 1e6, index: 0 }]
  let pastComplete = false
  let futureComplete = false
  let pastOffset
  const rank = (time, offset) => (time + offset) / step
  function append() {
    const last = records[records.length - 1]
    const transition = zoned(last.time).getTimeZoneTransition("next")
    if (!transition) { futureComplete = true; return }
    const time = transition.epochMilliseconds
    records.push({ time, offset: transition.offsetNanoseconds / 1e6,
      index: last.index + Math.ceil(rank(time, last.offset)) - Math.floor(rank(last.time, last.offset)) })
  }
  function prepend() {
    const first = records[0]
    const transition = zoned(first.time).getTimeZoneTransition("previous")
    if (!transition) {
      pastComplete = true
      pastOffset = zoned(first.time - 1).offsetNanoseconds / 1e6
      return
    }
    const time = transition.epochMilliseconds
    const offset = transition.offsetNanoseconds / 1e6
    records.unshift({ time, offset, index: first.index - Math.ceil(rank(first.time, offset)) + Math.floor(rank(time, offset)) })
  }
  function segment(value, byIndex) {
    const key = byIndex ? "index" : "time"
    while (value < records[0][key] && !pastComplete) prepend()
    while (value >= records[records.length - 1][key] && !futureComplete) append()
    if (value < records[0][key]) {
      const first = records[0]
      return { start: -Infinity, end: first.time, offset: pastOffset, index: first.index, base: Math.ceil(rank(first.time, pastOffset)) }
    }
    let lo = 0, hi = records.length
    while (lo + 1 < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (records[mid][key] <= value) lo = mid
      else hi = mid
    }
    const record = records[lo]
    return { start: record.time, end: records[lo + 1]?.time ?? Infinity,
      offset: record.offset, index: record.index, base: Math.floor(rank(record.time, record.offset)) }
  }
  function resolve(index, part) {
    const localRank = part.base + index - part.index
    return { index, start: Math.max(part.start, localRank * step - part.offset), end: Math.min(part.end, (localRank + 1) * step - part.offset) }
  }
  return {
    at(time) {
      const part = segment(time, false)
      return resolve(part.index + Math.floor(rank(time, part.offset)) - part.base, part)
    },
    indexed(index) { return resolve(index, segment(index, true)) }
  }
}
const GRIDS = { minute: subdayGrid(60000), fifteenMinute: subdayGrid(900000), hour: subdayGrid(3600000) }

function indexedCell(index, unit) {
  validateUnit(unit)
  integer(index, "Cell index")
  let interval
  if (GRIDS[unit]) interval = GRIDS[unit].indexed(index)
  else {
    let date, end
    if (unit === "fourHour") {
      date = DATE_ANCHOR.add({ days: Math.floor(index / 6) }).toPlainDateTime({ hour: ((index % 6 + 6) % 6) * 4 })
      end = date.add({ hours: 4 })
    } else {
      const [field, multiple] = DURATIONS[unit]
      date = (unit === "week" || unit === "fortnight" ? WEEK_ANCHOR : DATE_ANCHOR).add({ [field]: index * multiple })
      end = date.add({ [field]: multiple })
    }
    interval = { index, start: Temporal.PlainDateTime.from(date).toZonedDateTime(TIME_ZONE, { disambiguation: DISAMBIGUATION }).epochMilliseconds,
      end: Temporal.PlainDateTime.from(end).toZonedDateTime(TIME_ZONE, { disambiguation: DISAMBIGUATION }).epochMilliseconds }
  }
  if (!(interval.end > interval.start)) throw new RangeError("Calendar cell must have positive duration")
  return { unit, ...interval }
}

export function cellAt(value, unit) {
  validateUnit(unit)
  const time = milliseconds(value)
  if (GRIDS[unit]) return { unit, ...GRIDS[unit].at(time) }
  const local = zoned(time)
  const date = local.toPlainDate()
  const days = date.since(DATE_ANCHOR, { largestUnit: "days" }).days
  const months = Temporal.PlainYearMonth.from(local).since("1970-01", { largestUnit: "months" }).months
  const index = unit === "fourHour" ? days * 6 + Math.floor(local.hour / 4)
    : unit === "day" ? days
      : unit === "week" || unit === "fortnight" ? Math.floor(date.since(WEEK_ANCHOR, { largestUnit: "days" }).days / DURATIONS[unit][1])
        : unit === "month" ? months : unit === "quarter" ? Math.floor(months / 3) : local.year - 1970
  return indexedCell(index, unit)
}
export function nextCell(cell, amount = 1) {
  return indexedCell(cell.index + integer(amount, "Cell amount"), cell.unit)
}
export function cellPosition(value, cell) {
  const time = milliseconds(value)
  if (time < cell.start || time > cell.end) throw new RangeError("Instant is outside the cell")
  return (time - cell.start) / (cell.end - cell.start)
}
export function coordinate(value, unit) {
  const cell = cellAt(value, unit)
  return cell.index + cellPosition(value, cell)
}
export function instantAt(position, unit) {
  if (!Number.isFinite(position)) throw new RangeError("Coordinate must be finite")
  const index = Math.floor(position)
  const cell = indexedCell(index, unit)
  return milliseconds(Math.round(cell.start + (position - index) * (cell.end - cell.start)))
}
export function eventInterval(term) {
  if (!(integer(term.amount, "Event amount") > 0)) throw new RangeError("Event amount must be positive")
  const start = milliseconds(term.anchor)
  const end = addCalendar(start, term.definedUnit, term.amount)
  if (!(end > start)) throw new RangeError("Event interval must have positive duration")
  return { start, end }
}
