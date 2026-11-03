import { zoned, TIME_ZONE, cellAt, nextCell, dayPartWindow } from "./calendar"

// Reuse Intl formatters; constructing one per visible label stalls touch frames.
const formatters = new Map()
function format(date, options) {
  const key = JSON.stringify(options)
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.DateTimeFormat(undefined, { ...options, timeZone: TIME_ZONE }))
  }
  return formatters.get(key).format(date.epochMilliseconds)
}

export function headerLabel(instant, unit) {
  const date = zoned(instant)
  switch (unit) {
    case "year": return String(date.year)
    case "quarter": return `Q${Math.ceil(date.month / 3)} ${date.year}`
    case "month": return format(date, { month: "long" })
    case "fortnight": return `Fortnight ${fortnightNumber(instant)}`
    case "week": return `Week ${date.weekOfYear}`
    case "day": return format(date, { weekday: "short", day: "numeric" })
    case "dayPart": return dayPartWindow(instant).label
    default: {
      const label = format(date, { hour: "numeric", ...(unit === "minute" || unit === "fifteenMinute" ? { minute: "2-digit" } : {}), hour12: true })
      const local = date.toPlainDateTime()
      const repeated = local.toZonedDateTime(date.timeZoneId, { disambiguation: "earlier" }).epochMilliseconds !== local.toZonedDateTime(date.timeZoneId, { disambiguation: "later" }).epochMilliseconds
      return repeated && unit !== "fourHour" ? `${label} ${date.offset}` : label
    }
  }
}

// Only the active unit is named inside a stroke; parent terms use spacing alone.
export function unitLabel(instant, unit) {
  const date = zoned(instant)
  switch (unit) {
    case 'year': return String(date.year)
    case 'quarter': return `Q${Math.ceil(date.month / 3)}`
    case 'month': return format(date, { month: 'short' })
    case 'fortnight': return `F${fortnightNumber(instant)}`
    case 'week': return `W${date.weekOfYear}`
    case 'day': return format(date, { weekday: 'short', day: 'numeric' })
    case 'dayPart': return { Morning: 'Morn', Noon: 'Noon', Afternoon: 'Aft', Evening: 'Eve', Night: 'Night' }[dayPartWindow(instant).label]
    default: {
      const time = `${String(date.hour).padStart(2, '0')}:${String(date.minute).padStart(2, '0')}`
      const local = date.toPlainDateTime()
      const repeated = local.toZonedDateTime(date.timeZoneId, { disambiguation: 'earlier' }).epochMilliseconds !== local.toZonedDateTime(date.timeZoneId, { disambiguation: 'later' }).epochMilliseconds
      return repeated ? `${time} ${date.offset}` : time
    }
  }
}

// Keep the stable fortnight grid; reset labels at the first start in each year.
export function fortnightNumber(instant) {
  const cell = cellAt(instant, 'fortnight')
  const yearStart = zoned(cell.start).toPlainDate().with({ month: 1, day: 1 }).toZonedDateTime(TIME_ZONE).epochMilliseconds
  let first = cellAt(yearStart, 'fortnight')
  if (first.start < yearStart) first = nextCell(first)
  return cell.index - first.index + 1
}

export function listLabel(item, unit) {
  const date = zoned(item.anchor)
  let indicator
  switch (unit) {
    case "quarter": case "year": indicator = format(date, { month: "short" }); break
    case "fortnight": indicator = format(date, { month: "short", day: "numeric" }); break
    case "week": indicator = format(date, { weekday: "long" }); break
    case "month": indicator = `Week ${Math.floor((date.day - 1) / 7) + 1}`; break
    case "dayPart": case "fourHour": indicator = format(date, { hour: "numeric", hour12: true }); break
    case "hour": indicator = format(date, { minute: "2-digit" }); break
    default: indicator = format(date, { hour: "numeric", minute: "2-digit" })
  }
  return `${indicator} · ${item.title}`
}
