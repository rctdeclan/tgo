import { zoned, TIME_ZONE } from "./calendar"

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
    case "fortnight": return format(date, { month: "short", day: "numeric" })
    case "week": return `Week ${date.weekOfYear}`
    case "day": return format(date, { weekday: "short", day: "numeric" })
    default: {
      const label = format(date, { hour: "numeric", ...(unit === "minute" || unit === "fifteenMinute" ? { minute: "2-digit" } : {}), hour12: true })
      const local = date.toPlainDateTime()
      const repeated = local.toZonedDateTime(date.timeZoneId, { disambiguation: "earlier" }).epochMilliseconds !== local.toZonedDateTime(date.timeZoneId, { disambiguation: "later" }).epochMilliseconds
      return repeated && unit !== "fourHour" ? `${label} ${date.offset}` : label
    }
  }
}

export function listLabel(item, unit) {
  const date = zoned(item.anchor)
  let indicator
  switch (unit) {
    case "quarter": case "year": indicator = format(date, { month: "short" }); break
    case "fortnight": indicator = format(date, { month: "short", day: "numeric" }); break
    case "week": indicator = format(date, { weekday: "long" }); break
    case "month": indicator = `Week ${Math.floor((date.day - 1) / 7) + 1}`; break
    case "fourHour": indicator = format(date, { hour: "numeric", hour12: true }); break
    case "hour": indicator = format(date, { minute: "2-digit" }); break
    default: indicator = format(date, { hour: "numeric", minute: "2-digit" })
  }
  const label = `${indicator} · ${item.title}`
  return label.length <= 28 ? label : `${label.slice(0, 25)}...`
}
