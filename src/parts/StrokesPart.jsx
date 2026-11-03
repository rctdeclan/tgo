
import React, { useRef, useState } from "react"
import { project } from "../domain/projection"
import { UNIT_ORDER, cellAt, nextCell, eventInterval } from "../domain/calendar"
import { unitLabel } from "../domain/labels"
import { ROW_PITCH, STROKE_HEIGHT, STROKES_TOP, boundaryGap, cellBox, eventBox, strokeContentHeight } from "../ui/strokeGeometry"
import bg from "../assets/strokes-background.jpg"

const BASE_WIDTH=120
const ROW_HEIGHT=ROW_PITCH
const CELL_HEIGHT=STROKE_HEIGHT
const VISIBLE=40
const MIN_GRID_ROWS=6
const STROKES_Y=STROKES_TOP
const FRAME_WIDTH=640

export class StrokesPart {
  constructor(){
    this.events = []
    this.listeners = []
    this.layoutRevision = 0
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
        subtitle: draft.subtitle?.trim() || '',
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
    let cached
    const gamma = viewport => {
      if (!cached || cached.revision !== part.layoutRevision || cached.unit !== viewport.unit || cached.origin !== viewport.worldOriginTime) {
        cached = { revision: part.layoutRevision, unit: viewport.unit, origin: viewport.worldOriginTime,
          layout: part.getLayout(viewport.unit, viewport.worldOriginTime) }
      }
      return alpha(cached.layout)
    }
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
    this.layoutRevision++
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
    const timelineHeight = strokeContentHeight(rowCount)

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

  Content = ({ viewport: vp, layout: { packed, rowCount }, onCreate, frameWidth = FRAME_WIDTH }) => {
    const [hoveredCellKey, setHoveredCellKey] = useState(null)
    const [draft, setDraft] = useState(null)
    const handledDraftKeyRef = useRef(null)


    const cellWidth = BASE_WIDTH * vp.zoom
    const half = Math.floor((vp.visibleCells ?? VISIBLE)/2)
    const worldWidth = cellWidth * (vp.visibleCells ?? VISIBLE)
    const worldLeft = -half * cellWidth

    // Keep the model's coverage, but mount only visible grid cells plus a buffer.
    const firstColumn = Math.max(-half, Math.floor((-frameWidth / 2 - vp.worldOffsetPx) / cellWidth) - 1)
    const lastColumn = Math.min(half - 1, Math.ceil((frameWidth / 2 - vp.worldOffsetPx) / cellWidth) + 1)
    const origin = cellAt(vp.worldOriginTime, vp.unit)
    const gridColumns = Array.from({ length: lastColumn - firstColumn + 1 }, (_, i) => {
      const idx = firstColumn + i + half
      const cell = nextCell(origin, idx - half)
      return { idx, box: cellBox(origin, idx - half, 1, cellWidth),
        label: unitLabel(cell.start, vp.unit), gap: boundaryGap(nextCell(cell), cellWidth) }
    })
    const eventsByRow = new Map()
    for (const event of packed) {
      if (!eventsByRow.has(event.row)) eventsByRow.set(event.row, [])
      eventsByRow.get(event.row).push(event)
    }
    const cellBodyWidth = Math.max(1, cellWidth - 4)
    const inputWidth = Math.min(frameWidth - 16, Math.max(120, cellBodyWidth))
    const inputX = draft && frameWidth < FRAME_WIDTH
      ? Math.max(-frameWidth / 2 - vp.worldOffsetPx + 8,
        Math.min(cellBox(origin, draft.start, 1, cellWidth).x, frameWidth / 2 - vp.worldOffsetPx - inputWidth - 8))
      : draft ? cellBox(origin, draft.start, 1, cellWidth).x : 0

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
            data-grid-row={row}
            x={worldLeft}
            y={row*ROW_HEIGHT}
            width={worldWidth}
            height={CELL_HEIGHT}
          >
            {gridColumns.map(({ idx, box, label, gap })=>{
              const x = box.x + half * cellWidth
              const cellKey = `${row}-${idx}`
              const isHovered = hoveredCellKey === cellKey
              const column = idx - half
              const occupied = eventsByRow.get(row)?.some(event => column >= event.start && column < event.start + event.span)
              return (
                <g
                  key={`grid-${row}-${idx}`}
                  onMouseEnter={() => setHoveredCellKey(cellKey)}
                  onMouseLeave={() => setHoveredCellKey(null)}
                  onClick={() => openDraft(row, idx - half)}
                  style={{ cursor: "text" }}
                >
                  <rect x={idx * cellWidth} y={0} width={cellWidth} height={CELL_HEIGHT} fill="transparent" />
                  <rect
                    data-unit-cell={idx - half}
                    data-term-start={box.termStart ? 'true' : undefined}
                    x={x}
                    y={0}
                    width={box.width}
                    height={CELL_HEIGHT}
                    fill={isHovered ? "#6A7075" : "#575C61"}
                    fillOpacity={1}
                  />
                  <rect data-glass-divider={column}
                    x={(idx + 1) * cellWidth - gap / 2} y={0} width={gap} height={CELL_HEIGHT}
                    fill={isHovered ? '#6A7075' : '#4F4F4F'} fillOpacity={isHovered ? 0.65 : 0.4}
                    pointerEvents="none" />
                  {!occupied && <svg data-cell-unit={column} x={x} y={0} width={box.width} height={CELL_HEIGHT}
                    style={{ overflow: 'hidden', pointerEvents: 'none' }}>
                    <text x={8} y={23} fontSize="11" fill="#fff" fillOpacity={0.38} fontFamily="Futura">{label}</text>
                  </svg>}
                </g>
              )
            })}
          </svg>
        ))}

        {draft && (
          <foreignObject
            x={inputX}
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
                enterKeyHint="done"
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

        {packed.map(e => {
          const box = eventBox(origin, e, vp.unit, cellWidth)
          return (
            <svg key={e.id} data-event-line={e.id} data-native-inset={box.native ? 'true' : undefined}
              x={box.x} y={e.row * ROW_HEIGHT + box.y} width={box.width} height={box.height}
              style={{ overflow: 'hidden' }}>
              <title>{[e.title, e.subtitle].filter(Boolean).join(' — ')}</title>
              <rect data-event-body={e.id} x={0} y={0} width={box.width} height={box.height} fill="#dcdcdc" />
              <svg data-event-label={e.id} x={8} y={0}
                width={Math.max(0, box.width - 16)} height={box.height}
                style={{ overflow: 'hidden', pointerEvents: 'none' }}>
                <text data-event-title={e.id} x={0} y={box.native ? 14 : 16} fontSize="15" fontWeight="500" fill={e.color} fontFamily="Futura">{e.title}</text>
                <text data-event-subtitle={e.id} x={0} y={box.native ? 28 : 31} fontSize="11" fill="#53575c" fontFamily="Futura">{e.subtitle || ''}</text>
              </svg>
            </svg>
          )
        })}
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
