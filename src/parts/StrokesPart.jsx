
import React, { useRef, useState } from "react"
import { project, isListEvent } from "../domain/projection"
import { UNIT_ORDER, cellAt, nextCell, eventInterval } from "../domain/calendar"
import bg from "../bg.png"

const BASE_WIDTH=120
const ROW_HEIGHT=40
const CELL_HEIGHT=30
const GAP=14
const VISIBLE=40
const MIN_GRID_ROWS=6
const STROKES_Y=81
const LISTS_GAP=8
const FRAME_WIDTH=640

export class StrokesPart {
  constructor(){
    this.events = []
    this.listeners = []
  }

  insert(alpha) {
    const part = this
    const gamma = event => {
      part.addEvent(event)
      const stored = part.events[part.events.length - 1]
      alpha(stored)
      return stored
    }
    return gamma
  }

  observe(alpha) {
    const part = this
    const gamma = () => alpha(part.events)
    // The observer belongs to this Part's lifetime, not to a mounted View.
    part.subscribe(gamma)
    return gamma
  }

  create(alpha) {
    const gamma = (draft, viewport) => {
      const title = draft.title.trim()
      if (!title) return
      const event = {
        id: globalThis.crypto?.randomUUID?.() || `event-${Date.now()}`,
        title,
        positionsByUnit: { [viewport.unit]: draft.row },
        term: {
          anchor: nextCell(cellAt(viewport.worldOriginTime, viewport.unit), draft.start).start,
          definedUnit: viewport.unit,
          amount: 1
        }
      }
      alpha(event)
      return event
    }
    return gamma
  }

  layout(alpha) {
    const part = this
    const gamma = viewport => alpha(part.getLayout(viewport.unit, viewport.worldOriginTime))
    return gamma
  }

  colorForIndex(index){
    const hue = (index * 137.508) % 360
    return `hsl(${hue}, 70%, 45%)`
  }

  addEvent(e){
    eventInterval(e.term)
    this.events.push({
      ...e,
      positionsByUnit: { ...(e.positionsByUnit || {}) },
      color: e.color || this.colorForIndex(this.events.length)
    })
    this.emitChange()
  }

  subscribe(listener){
    this.listeners.push(listener)
    return ()=>{
      this.listeners = this.listeners.filter(item => item !== listener)
    }
  }

  emitChange(){
    this.listeners.forEach(listener => listener())
  }

  assignRowsForUnit(events, unit){
    const rows = []
    const positioned = [...events]
      .sort((a,b)=> a.start - b.start || a.span - b.span || String(a.id).localeCompare(String(b.id)))
      .map(event => {
        const savedRow = Math.max(0, event.positionsByUnit?.[unit] ?? event.preferredRow ?? 0)
        let row = savedRow

        while((rows[row] ?? -Infinity) > event.start){
          row++
        }

        rows[row] = event.start + event.span
        event.positionsByUnit = {
          ...(event.positionsByUnit || {}),
          [unit]: row
        }

        return {
          ...event,
          row
        }
      })

    return positioned
  }

  getLayout(unit, worldOriginTime){
    if(!UNIT_ORDER.includes(unit)){
      return { packed: [], rowCount: MIN_GRID_ROWS, listItems: [] }
    }

    const visible = []
    const listItems = []

    this.events.forEach(e=>{
      const projection = project(e.term, unit, worldOriginTime)
      if(isListEvent(e.term.definedUnit, unit)){
        listItems.push({
          id: e.id,
          title: e.title,
          start: projection.start,
          anchor: e.term.anchor
        })
        return
      }

      visible.push({
        ...e,
        ...projection
      })
    })

    const packed = this.assignRowsForUnit(visible, unit)
    const rowCount = Math.max(
      MIN_GRID_ROWS,
      packed.reduce((max,e)=>Math.max(max,e.row+1),0)
    )

    return { packed, rowCount, listItems }
  }

  Background = ({ viewport: vp, layout: { rowCount } }) => {
    const timelineHeight = STROKES_Y + rowCount*ROW_HEIGHT + LISTS_GAP

    return (
      <image
        href={bg}
        x={-FRAME_WIDTH/2 - vp.worldOffsetPx}
        y={0}
        width={FRAME_WIDTH}
        height={timelineHeight}
        preserveAspectRatio="xMidYMid slice"
      />
    )
  }

  Content = ({ viewport: vp, layout: { packed, rowCount }, onCreate }) => {
    const [hoveredCellKey, setHoveredCellKey] = useState(null)
    const [draft, setDraft] = useState(null)
    const handledDraftKeyRef = useRef(null)


    const cellWidth = BASE_WIDTH * vp.zoom
    const half = Math.floor((vp.visibleCells ?? VISIBLE)/2)
    const worldWidth = cellWidth * (vp.visibleCells ?? VISIBLE)
    const worldLeft = -half * cellWidth

    const cellBodyWidth = Math.max(1, cellWidth - GAP)
    const inputWidth = Math.max(120, cellBodyWidth)

    const buildDraftKey = (row, start) => {
      return `${row}:${start}`
    }

    const openDraft = (row, start) => {
      handledDraftKeyRef.current = null
      setDraft({
        key: buildDraftKey(row, start),
        row,
        start,
        title: ""
      })
    }

    const closeDraft = () => {
      handledDraftKeyRef.current = draft?.key || null
      setDraft(null)
    }

    const submitDraft = (nextTitle) => {
      if(!draft) return
      if(handledDraftKeyRef.current === draft.key) return

      handledDraftKeyRef.current = draft.key

      const title = nextTitle.trim()
      if(!title){
        setDraft(null)
        return
      }

      onCreate({ title, row: draft.row, start: draft.start })

      setDraft(null)
    }

    return (
      <g transform={`translate(0,${STROKES_Y})`}>
        {Array.from({length:rowCount}).map((_,row)=>(
          <svg
            key={`grid-row-${row}`}
            x={worldLeft}
            y={row*ROW_HEIGHT}
            width={worldWidth}
            height={CELL_HEIGHT}
          >
            {Array.from({length:vp.visibleCells ?? VISIBLE}).map((__,idx)=>{
              const x = idx*cellWidth
              const cellKey = `${row}-${idx}`
              const isHovered = hoveredCellKey === cellKey
              return (
                <g
                  key={`grid-${row}-${idx}`}
                  onMouseEnter={() => setHoveredCellKey(cellKey)}
                  onMouseLeave={() => setHoveredCellKey(null)}
                  onClick={() => openDraft(row, idx - half)}
                  style={{ cursor: "text" }}
                >
                  <rect
                    x={x + GAP/2}
                    y={0}
                    width={cellBodyWidth}
                    height={CELL_HEIGHT}
                    fill={isHovered ? "#6A7075" : "#575C61"}
                    fillOpacity={1}
                  />
                  <rect
                    x={x + cellWidth - GAP/2}
                    y={0}
                    width={GAP}
                    height={CELL_HEIGHT}
                    fill={isHovered ? "#6A7075" : "#4F4F4F"}
                    fillOpacity={isHovered ? 0.65 : 0.4}
                  />
                </g>
              )
            })}
          </svg>
        ))}

        {draft && (
          <foreignObject
            x={draft.start * cellWidth + GAP/2}
            y={draft.row * ROW_HEIGHT}
            width={inputWidth}
            height={CELL_HEIGHT}
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "stretch"
              }}
            >
              <input
                autoFocus
                value={draft.title}
                onChange={event => {
                  handledDraftKeyRef.current = null
                  setDraft(current => current ? { ...current, title: event.target.value } : current)
                }}
                onBlur={event => submitDraft(event.target.value)}
                onClick={event => event.stopPropagation()}
                onKeyDown={event => {
                  if(event.key === "Enter"){
                    event.preventDefault()
                    submitDraft(event.currentTarget.value)
                  }

                  if(event.key === "Escape"){
                    event.preventDefault()
                    closeDraft()
                  }
                }}
                placeholder="New event"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "2px solid #D66A7A",
                  borderRadius: "0px",
                  padding: "0 8px",
                  outline: "none",
                  fontFamily: "Futura",
                  fontSize: "14px",
                  color: "#58595B",
                  background: "#F7F7F7",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </foreignObject>
        )}

        {packed.map(e=>(
          (() => {
            const eventWidth = Math.max(1, e.span*cellWidth - GAP)
            const isNativeUnit = e.term.definedUnit === vp.unit
            const outerInset = 3
            const frameInset = isNativeUnit ? outerInset : 0

            return (
              <svg
                key={e.id}
                x={e.start*cellWidth + GAP/2 - frameInset}
                y={e.row*ROW_HEIGHT - frameInset}
                width={Math.max(1, e.span*cellWidth) + frameInset * 2}
                height={CELL_HEIGHT + frameInset * 2}
                style={{ overflow: "visible" }}
              >
                {isNativeUnit && (
                  <rect
                    x={0}
                    y={0}
                    width={eventWidth + outerInset * 2}
                    height={CELL_HEIGHT + outerInset * 2}
                    fill="none"
                    stroke={e.color}
                    strokeWidth="6"
                    opacity="0.9"
                  />
                )}
                <rect
                  x={frameInset}
                  y={frameInset}
                  width={eventWidth}
                  height={CELL_HEIGHT}
                  fill="#dcdcdc"
                  stroke={e.color}
                  strokeWidth="4"
                />

                {/* checkbox */}
                <path d="M18 0L0 0L0 18L18 18L18 0ZM15 15L3 15L3 3L15 3L15 15Z" fill={e.color} fillRule="nonzero" opacity="1" stroke="none" transform={`translate(${frameInset + 5},${frameInset + 6})`}/>




                <text
                  x={frameInset + 28}
                  y={frameInset + 21}
                  fontSize="18"
                  fill={e.color}
                  fontFamily="Futura"
                >
                  {e.title}
                </text>
              </svg>
            )
          })()
        ))}
      </g>
    )
  }

  View = props => (
    <>
      <this.Background {...props} />
      <this.Content {...props} />
    </>
  )
}
