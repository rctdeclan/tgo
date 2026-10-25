import { cellAt, nextCell } from '../domain/calendar'
import { rangeFor, position, timeAt, zoomAt, maxScroll, clamp, scaleFor, buildHeader, periodKey, projectRows, dateText } from './model'

export class TimelinePart {
  constructor() {
    const now = Date.now()
    this.state = { now, range: rangeFor(now), zoom: 50, scrollLeft: 0, width: 800, sidebar: 270 }
    this.state.scrollLeft = position(nextCell(cellAt(now, 'week'), -1).start, this.state)
    this.collapsed = new Map()
    this.headerRevision = 0
  }
  navigate(alpha) {
    const part = this
    const gamma = (command, ...args) => {
      const state = part.state
      if (command === 'scroll') {
        const left = clamp(args[0], 0, maxScroll(state))
        if (Math.abs(left - state.scrollLeft) < 0.25) return
        part.state = { ...state, scrollLeft: left }
        const start = timeAt(0, part.state), end = timeAt(part.state.width, part.state)
        // A manually folded period unfolds automatically when revisited by scrolling.
        for (const [key, cell] of part.collapsed) {
          if (cell.end <= start || cell.start >= end) { part.collapsed.delete(key); part.headerRevision++ }
        }
      } else if (command === 'resize') {
        const width = Math.max(180, args[0])
        const sidebar = args[1] ?? state.sidebar
        if (Math.abs(width - state.width) < 1 && sidebar === state.sidebar) return
        const center = timeAt(state.width / 2, state)
        part.state = { ...state, width, sidebar }
        part.state.scrollLeft = clamp(position(center, part.state) - width / 2, 0, maxScroll(part.state))
      } else if (command === 'zoom' || command === 'gesture') {
        if (command === 'zoom') part.state = zoomAt(state, args[0], args[1])
        else {
          part.state = zoomAt(state, state.zoom + Math.log(args[1]) * 45, args[0])
          part.state.scrollLeft = clamp(part.state.scrollLeft + args[2], 0, maxScroll(part.state))
        }
        if (scaleFor(state.zoom).unit !== scaleFor(part.state.zoom).unit) { part.collapsed.clear(); part.headerRevision++ }
      } else if (command === 'open') {
        const [unit, instant] = args
        const key = periodKey(unit, instant)
        if (part.collapsed.has(key)) { part.collapsed.delete(key); part.headerRevision++ }
        else {
          const zoom = unit === 'week' ? 50 : 84
          part.state = { ...state, zoom }
          part.state.scrollLeft = clamp(position(instant, part.state), 0, maxScroll(part.state))
          part.collapsed.clear()
          part.headerRevision++
        }
      } else if (command === 'collapse') {
        const [unit, instant] = args
        const cell = cellAt(instant, unit)
        part.collapsed.set(periodKey(unit, instant), cell)
        part.headerRevision++
      } else if (command === 'today') {
        part.state = { ...state, scrollLeft: clamp(position(state.now, state) - state.width / 2, 0, maxScroll(state)) }
      } else throw new RangeError(`Unknown study navigation: ${command}`)
      alpha(part.state)
      return part.state
    }
    return gamma
  }
  present(alpha) {
    const part = this
    let cache
    let headerCache
    const gamma = events => {
      const state = part.state
      const scale = scaleFor(state.zoom)
      if (!cache || cache.events !== events || cache.unit !== scale.unit) {
        cache = { events, unit: scale.unit, rows: projectRows(events, scale.unit, state.range.start) }
      }
      const headerKey = `${scale.unit}:${scale.cellWidth}:${Math.floor(state.scrollLeft / scale.cellWidth)}:${Math.ceil((state.scrollLeft + state.width) / scale.cellWidth)}:${part.headerRevision}`
      if (!headerCache || headerCache.key !== headerKey) headerCache = { key: headerKey, cells: buildHeader(state, part.collapsed) }
      return alpha({ ...state, ...scale, rows: cache.rows, cells: headerCache.cells,
        worldWidth: position(state.range.end, state), todayX: position(state.now, state),
        centerTime: timeAt(state.width / 2, state),
        from: dateText(timeAt(0, state)), to: dateText(timeAt(state.width, state)) })
    }
    return gamma
  }
}
