
import { useEffect, useState } from "react"
import { UNIT_ORDER, UNIT_MS, UNIT_TERM_SPAN } from "../domain/time"

const DEFAULT_WIDTH = 1280
const BASE_WIDTH = 120

let state = {
  unitIndex: 2,
  zoom: 1,
  worldOffsetPx: 0,
  worldOriginTime: Date.now()
}

let listeners = []

function normalizePan(nextState){
  const unit = UNIT_ORDER[nextState.unitIndex]
  const unitMs = UNIT_MS[unit]
  if(!unitMs) return nextState

  const cellWidth = BASE_WIDTH * nextState.zoom
  if(!Number.isFinite(cellWidth) || cellWidth <= 0) return nextState

  const shiftedCells = Math.trunc(nextState.worldOffsetPx / cellWidth)
  if(shiftedCells === 0) return nextState

  return {
    ...nextState,
    worldOffsetPx: nextState.worldOffsetPx - shiftedCells * cellWidth,
    worldOriginTime: nextState.worldOriginTime - shiftedCells * unitMs
  }
}

function setState(p){
  state = normalizePan({...state, ...p})
  listeners.forEach(l => l(state))
}

function zoomForUnitTransition(startUnitIndex, targetUnitIndex, startZoom){
  let zoom = startZoom
  let unitIndex = startUnitIndex

  while(unitIndex > targetUnitIndex){
    const finerUnit = UNIT_ORDER[unitIndex - 1]
    const finerSpan = UNIT_TERM_SPAN[finerUnit] || 1
    zoom = zoom / finerSpan
    unitIndex--
  }

  while(unitIndex < targetUnitIndex){
    const currentUnit = UNIT_ORDER[unitIndex]
    const currentTermSpan = UNIT_TERM_SPAN[currentUnit] || 1
    zoom = zoom * currentTermSpan
    unitIndex++
  }

  return zoom
}

function getCenterTime(snapshot){
  const unit = UNIT_ORDER[snapshot.unitIndex]
  const unitMs = UNIT_MS[unit]
  const cellWidth = BASE_WIDTH * snapshot.zoom

  if(!unitMs || !Number.isFinite(cellWidth) || cellWidth <= 0){
    return snapshot.worldOriginTime
  }

  return snapshot.worldOriginTime - (snapshot.worldOffsetPx / cellWidth) * unitMs
}

function getCellWidth(snapshot){
  const cellWidth = BASE_WIDTH * snapshot.zoom
  if(!Number.isFinite(cellWidth) || cellWidth <= 0) return BASE_WIDTH
  return cellWidth
}

function snapTimeToUnit(time, unitMs){
  if(!Number.isFinite(time) || !Number.isFinite(unitMs) || unitMs <= 0){
    return time
  }

  return Math.floor(time / unitMs) * unitMs
}

function getZoomUpper(config, bounds = {}){
  return bounds.maxScale ?? config?.zoomUpper ?? 2
}

function getAbsoluteZoomLower(config, bounds = {}){
  return bounds.minScale ?? config?.zoomLower ?? 0.5
}

function getZoomOutThreshold(unitIndex, config, bounds = {}){
  const currentUnit = UNIT_ORDER[unitIndex]
  const currentTermSpan = UNIT_TERM_SPAN[currentUnit] || 1
  const upper = getZoomUpper(config, bounds)
  return upper / currentTermSpan
}

function clampZoomForUnit(zoom, unitIndex, config, bounds = {}){
  const upper = getZoomUpper(config, bounds)
  const cappedUpper = Math.min(upper, zoom)

  if(unitIndex === UNIT_ORDER.length - 1){
    return Math.max(getAbsoluteZoomLower(config, bounds), cappedUpper)
  }

  return cappedUpper
}

function getReadableStepZoom(unitIndex, config, bounds = {}){
  return clampZoomForUnit(getZoomUpper(config, bounds), unitIndex, config, bounds)
}

export function useViewport(config){
  const [local,setLocal] = useState(state)

  useEffect(()=>{
    listeners.push(setLocal)
    return ()=> listeners = listeners.filter(l=>l!==setLocal)
  },[])

  function applySnap(mouseX,newZoom,newUnitIndex,viewportWidth){
    const unit = UNIT_ORDER[state.unitIndex]
    if(!unit) return

    const unitMs = UNIT_MS[unit]
    const cellWidth = BASE_WIDTH * state.zoom
    const width = viewportWidth || DEFAULT_WIDTH

    const worldX = (mouseX - width/2 - state.worldOffsetPx) / cellWidth
    const worldTime = state.worldOriginTime + worldX * unitMs

    const newUnit = UNIT_ORDER[newUnitIndex]
    if(!newUnit) return

    const newUnitMs = UNIT_MS[newUnit]
    const newCellWidth = BASE_WIDTH * newZoom
    const newOriginTime = newUnitIndex === state.unitIndex
      ? state.worldOriginTime
      : snapTimeToUnit(state.worldOriginTime, newUnitMs)
    const newWorldX = (worldTime - newOriginTime) / newUnitMs
    const newOffset = mouseX - width/2 - newWorldX * newCellWidth

    setState({
      zoom:newZoom,
      unitIndex:newUnitIndex,
      worldOriginTime:newOriginTime,
      worldOffsetPx:newOffset
    })
  }

  function zoomByScaleFactor(mouseX,scaleFactor,viewportWidth,bounds = {}){
    if(!Number.isFinite(scaleFactor) || scaleFactor <= 0) return

    let newZoom = state.zoom * scaleFactor
    let newUnitIndex = state.unitIndex
    const upper = getZoomUpper(config, bounds)
    const isZoomingIn = scaleFactor > 1

    if(isZoomingIn){
      while(newZoom > upper && newUnitIndex > 0){
        newZoom = zoomForUnitTransition(newUnitIndex, newUnitIndex - 1, newZoom)
        newUnitIndex--
      }
    } else {
      while(
        newUnitIndex < UNIT_ORDER.length-1 &&
        newZoom < getZoomOutThreshold(newUnitIndex, config, bounds)
      ){
        newZoom = zoomForUnitTransition(newUnitIndex, newUnitIndex + 1, newZoom)
        newUnitIndex++
      }
    }

    newZoom = clampZoomForUnit(newZoom, newUnitIndex, config, bounds)

    applySnap(mouseX,newZoom,newUnitIndex,viewportWidth)
  }

  function panBy(deltaX){
    setState({ worldOffsetPx: state.worldOffsetPx - deltaX })
  }

  function panUnits(deltaUnits){
    if(!Number.isFinite(deltaUnits) || deltaUnits === 0) return
    panBy(deltaUnits * getCellWidth(state))
  }

  function jumpTo(unitIndex,time){
    const clamped = Math.max(0, Math.min(unitIndex, UNIT_ORDER.length-1))
    setState({
      unitIndex: clamped,
      worldOriginTime: time,
      zoom: clampZoomForUnit(
        zoomForUnitTransition(state.unitIndex, clamped, state.zoom),
        clamped,
        config
      ),
      worldOffsetPx:0
    })
  }

  function stepUnit(delta, options = {}){
    if(!Number.isFinite(delta) || delta === 0) return

    const targetUnitIndex = Math.max(
      0,
      Math.min(state.unitIndex + delta, UNIT_ORDER.length - 1)
    )

    if(targetUnitIndex === state.unitIndex) return

    const centerTime = getCenterTime(state)

    if(options.readable){
      setState({
        unitIndex: targetUnitIndex,
        worldOriginTime: centerTime,
        zoom: getReadableStepZoom(targetUnitIndex, config),
        worldOffsetPx:0
      })
      return
    }

    jumpTo(targetUnitIndex, centerTime)
  }

  const unit = UNIT_ORDER[local.unitIndex]

return {
  ...local,
  unit,
  panBy,
  panUnits,
  zoomByScaleFactor,
  jumpTo,
  stepUnit
}
}
