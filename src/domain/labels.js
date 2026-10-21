import { zoned } from "./calendar"

export function headerLabel(instant, unit) {
  const date = zoned(instant)
  switch (unit) {
    case "year": return String(date.year)
    case "quarter": return `Q${Math.ceil(date.month / 3)} ${date.year}`
    case "month": return date.toLocaleString([], { month: "long" })
    case "fortnight": return date.toLocaleString([], { month: "short", day: "numeric" })
    case "week": return `Week ${date.weekOfYear}`
    case "day": return date.toLocaleString([], { weekday: "short", day: "numeric" })
    default: {
      const label = date.toLocaleString([], { hour: "numeric", ...(unit === "minute" || unit === "fifteenMinute" ? { minute: "2-digit" } : {}), hour12: true })
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
    case "quarter": case "year": indicator = date.toLocaleString([], { month: "short" }); break
    case "fortnight": indicator = date.toLocaleString([], { month: "short", day: "numeric" }); break
    case "week": indicator = date.toLocaleString([], { weekday: "long" }); break
    case "month": indicator = `Week ${Math.floor((date.day - 1) / 7) + 1}`; break
    case "fourHour": indicator = date.toLocaleString([], { hour: "numeric", hour12: true }); break
    case "hour": indicator = date.toLocaleString([], { minute: "2-digit" }); break
    default: indicator = date.toLocaleString([], { hour: "numeric", minute: "2-digit" })
  }
  const label = `${indicator} · ${item.title}`
  return label.length <= 28 ? label : `${label.slice(0, 25)}...`
}
