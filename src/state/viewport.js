import { UNIT_ORDER, cellAt, coordinate, instantAt } from "../domain/calendar"

const WIDTH = 640
const BASE_WIDTH = 120
const DEFAULT_UPPER = WIDTH / (3 * BASE_WIDTH)
const clampIndex = index => Math.max(0, Math.min(Math.trunc(index), UNIT_ORDER.length - 1))

// A local scale estimate for level changes, not a fixed calendar-unit ratio.
export function unitRatio(finer, coarser, instant) {
  const cell = cellAt(instant, coarser)
  return coordinate(cell.end, finer) - coordinate(cell.start, finer)
}

export function createViewport(config = {}) {
  let state = { unitIndex: 2, zoom: 1, worldOffsetPx: 0, worldOriginTime: cellAt(Date.now(), UNIT_ORDER[2]).start }
  const unit = () => UNIT_ORDER[state.unitIndex]
  const upper = bounds => Math.min(bounds?.maxScale ?? config.zoomUpper ?? DEFAULT_UPPER, DEFAULT_UPPER)
  const clampZoom = (zoom, index, bounds) => index === UNIT_ORDER.length - 1
    ? Math.max(bounds?.minScale ?? config.zoomLower ?? 0.5, Math.min(upper(bounds), zoom))
    : Math.min(upper(bounds), zoom)

  function setState(next) {
    state = { ...state, ...next }
    const cellWidth = BASE_WIDTH * state.zoom
    const shift = Math.trunc(state.worldOffsetPx / cellWidth)
    if (shift) {
      state.worldOriginTime = instantAt(coordinate(state.worldOriginTime, unit()) - shift, unit())
      state.worldOffsetPx -= shift * cellWidth
    }
  }
  function timeAt(x = WIDTH / 2, width = WIDTH) {
    return instantAt(coordinate(state.worldOriginTime, unit()) + (x - width / 2 - state.worldOffsetPx) / (BASE_WIDTH * state.zoom), unit())
  }
  function anchorAt(instant, x, zoom, index, width = WIDTH) {
    const target = UNIT_ORDER[index]
    const origin = cellAt(state.worldOriginTime, target).start
    const offset = x - width / 2 - (coordinate(instant, target) - coordinate(origin, target)) * BASE_WIDTH * zoom
    setState({ unitIndex: index, zoom, worldOriginTime: origin, worldOffsetPx: offset })
  }
  function zoomByScaleFactor(x, factor, width = WIDTH, bounds = {}) {
    if (!Number.isFinite(factor) || factor <= 0) return
    const instant = timeAt(x, width)
    let zoom = state.zoom * factor
    let index = state.unitIndex
    if (factor > 1) {
      while (zoom > upper(bounds) && index > 0) {
        zoom /= unitRatio(UNIT_ORDER[index - 1], UNIT_ORDER[index], instant)
        index--
      }
    } else {
      while (index < UNIT_ORDER.length - 1) {
        const ratio = unitRatio(UNIT_ORDER[index], UNIT_ORDER[index + 1], instant)
        if (zoom >= upper(bounds) / ratio) break
        zoom *= ratio
        index++
      }
    }
    anchorAt(instant, x, clampZoom(zoom, index, bounds), index, width)
  }
  function panBy(delta) {
    if (Number.isFinite(delta)) setState({ worldOffsetPx: state.worldOffsetPx - delta })
  }
  function panUnits(amount) { panBy(amount * BASE_WIDTH * state.zoom) }
  function jumpTo(index, instant) {
    if (!Number.isFinite(index)) return
    index = clampIndex(index)
    let zoom = state.zoom
    for (let i = state.unitIndex; i > index; i--) zoom /= unitRatio(UNIT_ORDER[i - 1], UNIT_ORDER[i], instant)
    for (let i = state.unitIndex; i < index; i++) zoom *= unitRatio(UNIT_ORDER[i], UNIT_ORDER[i + 1], instant)
    anchorAt(instant, WIDTH / 2, clampZoom(zoom, index), index)
  }
  function stepUnit(delta, { readable = false } = {}) {
    if (!Number.isFinite(delta)) return
    const index = clampIndex(state.unitIndex + delta)
    if (index === state.unitIndex) return
    const instant = timeAt()
    if (readable) anchorAt(instant, WIDTH / 2, clampZoom(upper(), index), index)
    else jumpTo(index, instant)
  }
  function stepScale(delta) {
    const index = clampIndex(state.unitIndex + delta)
    if (index === state.unitIndex) return null
    return delta < 0
      ? 1 / unitRatio(UNIT_ORDER[index], unit(), timeAt())
      : unitRatio(unit(), UNIT_ORDER[index], timeAt())
  }
  return {
    getSnapshot() {
      const visibleHalf = Math.max(20, Math.ceil((WIDTH / 2 + Math.abs(state.worldOffsetPx)) / (BASE_WIDTH * state.zoom)) + 2)
      return { ...state, unit: unit(), visibleCells: 2 * visibleHalf }
    },
    panBy, panUnits, zoomByScaleFactor, jumpTo, stepUnit, stepScale
  }
}
