import React, { useEffect, useState } from "react"
import { useViewport } from "../state/viewport"
import bg2 from "../bg2.png"

const BASE_WIDTH = 120
const ROW_HEIGHT = 40
const CELL_HEIGHT = 30
const GAP = 14
const VISIBLE = 40
const STROKES_Y = 81
const LISTS_GAP = 8
const LISTS_HEIGHT = 110
const MAX_ITEMS_PER_COLUMN = 6
const FRAME_WIDTH = 640

function trimLabel(value) {
  if (value.length <= 28) return value
  return `${value.slice(0, 25)}...`
}

function indicatorForUnit(anchor, unit) {
  const date = new Date(anchor)
  if (Number.isNaN(date.getTime())) return ""

  switch (unit) {
    case "quarter":
      return date.toLocaleDateString([], { month: "short" })
    case "fortnight":
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    case "week":
      return date.toLocaleDateString([], { weekday: "long" })
    case "month":
      return `Week ${Math.floor((date.getDate() - 1) / 7) + 1}`
    case "year":
      return date.toLocaleDateString([], { month: "short" })
    case "fourHour":
      return date.toLocaleTimeString([], { hour: "numeric", hour12: true })
    case "day":
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    case "hour":
      return date.toLocaleTimeString([], { minute: "2-digit" })
    case "fifteenMinute":
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    default:
      return date.toLocaleDateString([], { day: "numeric" })
  }
}

function labelWithIndicator(item, unit) {
  const indicator = indicatorForUnit(item.anchor, unit)
  if (!indicator) return trimLabel(item.title)
  return trimLabel(`${indicator} · ${item.title}`)
}

export class ListsPart {
  constructor(app) {
    this.app = app
  }

  Background = () => {
    const vp = useViewport(this.app.viewportConfig)
    const [, setRevision] = useState(0)

    useEffect(() => this.app.parts.strokes.subscribe(() => {
      setRevision(value => value + 1)
    }), [])

    const { rowCount } =
      this.app.parts.strokes.getLayout(vp.unit, vp.worldOriginTime)

    const listTop = STROKES_Y + rowCount * ROW_HEIGHT + LISTS_GAP

    return (
      <image
        href={bg2}
        x={-FRAME_WIDTH / 2 - vp.worldOffsetPx}
        y={listTop}
        width={FRAME_WIDTH}
        height={LISTS_HEIGHT}
        preserveAspectRatio="xMidYMid slice"
      />
    )
  }

  Content = () => {
    const vp = useViewport(this.app.viewportConfig)
    const [, setRevision] = useState(0)

    useEffect(() => this.app.parts.strokes.subscribe(() => {
      setRevision(value => value + 1)
    }), [])

    const cellWidth = BASE_WIDTH * vp.zoom
    const half = Math.floor(VISIBLE / 2)
    const worldWidth = cellWidth * VISIBLE
    const worldLeft = -half * cellWidth

    const { rowCount, listItems } =
      this.app.parts.strokes.getLayout(vp.unit, vp.worldOriginTime)

    const listTop = STROKES_Y + rowCount * ROW_HEIGHT + LISTS_GAP
    const columns = new Map()

    listItems.forEach(item => {
      if (item.start < -half || item.start >= half) return
      const key = item.start
      const prev = columns.get(key) || []
      prev.push(item)
      columns.set(key, prev)
    })

    return (
      <svg x={worldLeft} y={listTop} width={worldWidth} height={LISTS_HEIGHT}>
        {Array.from({ length: VISIBLE }).map((_, idx) => {
          const i = idx - half
          const x = idx * cellWidth
          const items = columns.get(i) || []
          const shown = items.slice(0, MAX_ITEMS_PER_COLUMN)
          return (
            <g key={`list-col-${i}`}>
              {shown.map((item, itemIdx) => (
                <svg key={item.id}
                  x={x + GAP / 2}
                  y={18 + itemIdx * 40}>
                  <rect
                    width={Math.max(1, cellWidth - GAP)}
                    height={30}
                    fill="#E9E9E9"
                    fillOpacity={1}
                  />
                  <text
                    x={8}
                    y={20}
                    fontSize="11"
                    fill="#58595B"
                    fontFamily="Futura"
                  >
                    {labelWithIndicator(item, vp.unit)}
                  </text>
                </svg>
              ))}
            </g>
          )
        })}
      </svg>
    )
  }

  View = () => (
    <>
      <this.Background />
      <this.Content />
    </>
  )
}
