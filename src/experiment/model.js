import { cellAt, nextCell, coordinate, instantAt, zoned, eventInterval } from '../domain/calendar'

export const SIDEBAR = 270
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
export function scaleFor(value) {
  const zoom = clamp(value, 0, 100)
  if (zoom < 30) return { unit: 'week', cellWidth: 100 + zoom * 3 }
  if (zoom < 70) return { unit: 'day', cellWidth: 30 + (zoom - 30) * 1.4 }
  return { unit: 'hour', cellWidth: 28 + (zoom - 70) * 1.7 }
}
export function rangeFor(now) {
  const week = cellAt(now, 'week')
  return { start: nextCell(week, -8).start, end: nextCell(week, 16).start }
}
export function position(instant, state) {
  const { unit, cellWidth } = scaleFor(state.zoom)
  return (coordinate(instant, unit) - coordinate(state.range.start, unit)) * cellWidth
}
export function timeAt(x, state) {
  const { unit, cellWidth } = scaleFor(state.zoom)
  return instantAt(coordinate(state.range.start, unit) + (state.scrollLeft + x) / cellWidth, unit)
}
export function maxScroll(state) {
  return Math.max(0, position(state.range.end, state) - state.width)
}
export function zoomAt(state, value, x = state.width / 2) {
  const anchor = timeAt(x, state)
  const next = { ...state, zoom: clamp(value, 0, 100) }
  next.scrollLeft = clamp(position(anchor, next) - x, 0, maxScroll(next))
  return next
}
const shortDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short' })
const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short' })
export const dateText = instant => zoned(instant).toPlainDate().toString()
export const periodKey = (unit, instant) => `${unit}:${cellAt(instant, unit).index}`

// Only leaves are rendered. Parents are disclosures, rather than stacked scales.
export function buildHeader(state, collapsed = new Map()) {
  const { unit, cellWidth } = scaleFor(state.zoom)
  const start = timeAt(-cellWidth, state)
  const end = timeAt(state.width + cellWidth, state)
  const cells = []
  function add(cell) {
    if (cell.end <= start || cell.start >= end) return
    const date = zoned(cell.start)
    cells.push({ ...cell, key: `${cell.unit}:${cell.index}`,
      x: position(cell.start, state), width: position(cell.end, state) - position(cell.start, state),
      label: cell.unit === 'week' ? `W${date.weekOfYear}` : cell.unit === 'day' ? String(date.day).padStart(2, '0') : `${String(date.hour).padStart(2, '0')}:00`,
      detail: cell.unit === 'week' ? shortDate.format(cell.start) : cell.unit === 'day' ? weekday.format(cell.start) : shortDate.format(cell.start),
      title: `${cell.unit} · ${date.toString()}`,
      weekend: date.dayOfWeek >= 6,
      current: state.now >= cell.start && state.now < cell.end
    })
  }
  for (let week = cellAt(start, 'week'); week.start < end; week = nextCell(week)) {
    if (unit === 'week' || collapsed.has(periodKey('week', week.start))) { add(week); continue }
    for (let day = cellAt(week.start, 'day'); day.start < week.end; day = nextCell(day)) {
      if (day.end <= start || day.start >= end) continue
      if (unit === 'day' || collapsed.has(periodKey('day', day.start))) { add(day); continue }
      for (let hour = cellAt(day.start, 'hour'); hour.start < day.end; hour = nextCell(hour)) add(hour)
    }
  }
  return cells
}
export function projectRows(events, unit, rangeStart) {
  const origin = coordinate(rangeStart, unit)
  return events.map(event => {
    const interval = eventInterval(event.term)
    return { ...event, start: coordinate(interval.start, unit) - origin,
      span: coordinate(interval.end, unit) - coordinate(interval.start, unit) }
  })
}
