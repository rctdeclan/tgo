import React from "react"
import { listLabel as labelWithIndicator } from "../domain/labels"
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

export class ListsPart {
  present(alpha) {
    const gamma = (viewport, layout) => alpha({
      viewport,
      rowCount: layout.rowCount,
      listItems: layout.listItems
    })
    return gamma
  }

  Background = ({ viewport: vp, rowCount }) => {
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

  Content = ({ viewport: vp, rowCount, listItems }) => {
    const cellWidth = BASE_WIDTH * vp.zoom
    const half = Math.floor((vp.visibleCells ?? VISIBLE) / 2)
    const worldWidth = cellWidth * (vp.visibleCells ?? VISIBLE)
    const worldLeft = -half * cellWidth

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
        {Array.from({ length: vp.visibleCells ?? VISIBLE }).map((_, idx) => {
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

  View = props => (
    <>
      <this.Background {...props} />
      <this.Content {...props} />
    </>
  )
}
