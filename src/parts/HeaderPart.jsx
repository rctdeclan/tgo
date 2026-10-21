import React, { useState } from "react"
import { UNIT_ORDER, cellAt, nextCell, coordinate, instantAt } from "../domain/calendar"
import { headerLabel } from "../domain/labels"

const BASE_WIDTH = 120
const VISIBLE = 40
const FRAME_WIDTH = 640
const HEADER_HEIGHT = 75
const GAP = 14
const ROW_HEIGHT = 21
const ROW_Y = [6, 27, 48]
const CURRENT_FILL_BY_ROW = ["#F6D7DA", "#E7B8BF", "#F6D7DA"]
const CURRENT_LINE = "#B2475A"

export class HeaderPart {
  navigate(alpha) {
    const gamma = (index, time) => {
      if (index >= 0) return alpha(index, time)
    }
    return gamma
  }

  present(alpha) {
    let cached
    const geometry = new Map()
    const gamma = (viewport, now) => {
      const half = Math.floor((viewport.visibleCells ?? VISIBLE) / 2)
      if (cached && cached.origin === viewport.worldOriginTime && cached.unitIndex === viewport.unitIndex && cached.half === half) {
        const rows = cached.rows.map(row => {
          const groups = row.groups.map(group => {
            const isCurrent = now >= group.startTime && now < group.endTime
            return isCurrent === group.isCurrent ? group : { ...group, isCurrent }
          })
          return groups.every((group, i) => group === row.groups[i]) ? row : { ...row, groups }
        })
        cached.rows = rows
        return alpha({ viewport, now, rows })
      }
      const origin = coordinate(viewport.worldOriginTime, viewport.unit)
      const left = instantAt(origin - half, viewport.unit)
      const right = instantAt(origin + half, viewport.unit)
      const rows = [viewport.unitIndex + 2, viewport.unitIndex + 1, viewport.unitIndex]
        .filter(index => index < UNIT_ORDER.length)
        .map((index, rowOrder) => {
          const unit = UNIT_ORDER[index]
          const groups = []
          for (let cell = cellAt(left, unit); cell.start < right; cell = nextCell(cell)) {
            const key = `${viewport.unit}:${unit}:${cell.start}`
            let group = geometry.get(key)
            if (!group) {
              group = { start: coordinate(cell.start, viewport.unit), end: coordinate(cell.end, viewport.unit),
                label: headerLabel(cell.start, unit) }
              geometry.set(key, group)
              if (geometry.size > 512) geometry.delete(geometry.keys().next().value)
            }
            groups.push({
              startI: group.start - origin,
              endI: group.end - origin - 1,
              startTime: cell.start,
              endTime: cell.end,
              label: group.label,
              isCurrent: now >= cell.start && now < cell.end
            })
          }
          return { unitIndex: index, unit, y: ROW_Y[rowOrder], groups,
            clickIndex: rowOrder === 2 ? viewport.unitIndex - 1 : index }
        })
      cached = { origin: viewport.worldOriginTime, unitIndex: viewport.unitIndex, half, rows }
      return alpha({ viewport, now, rows })
    }
    return gamma
  }

  View = ({ viewport: vp, rows: visibleRowConfigs, onNavigate }) => {
    const [hoveredGroupKey, setHoveredGroupKey] = useState(null)
    if (!vp.unit) return null
    const cellWidth = BASE_WIDTH * vp.zoom
    const half = Math.floor((vp.visibleCells ?? VISIBLE) / 2)
    const worldWidth = cellWidth * (vp.visibleCells ?? VISIBLE)
    const worldLeft = -half * cellWidth
    const visibleMinX = -FRAME_WIDTH / 2 - vp.worldOffsetPx - worldLeft
    const visibleMaxX = FRAME_WIDTH / 2 - vp.worldOffsetPx - worldLeft

    return (
      <g>

        {/* background */}


        <svg
          x={-FRAME_WIDTH / 2 - vp.worldOffsetPx}
          y={0}
          width={FRAME_WIDTH}
          height={HEADER_HEIGHT}
        >
          <rect
            x={0}
            y={0}
            width={FRAME_WIDTH}
            height={HEADER_HEIGHT}
            fill="#D0D2D3"
            fillOpacity={0.6}

          />

          {/* <foreignObject x="0" y="0" width={FRAME_WIDTH} height={HEADER_HEIGHT}>
            <div xmlns="http://www.w3.org/1999/xhtml"
              style={{
           backdropFilter: "blur(200px)",
           background: "#D0D2D3",
           padding: "10px",
           opacity: 0.6
              }}>
            </div>
          </foreignObject> */}
        </svg>

        {visibleRowConfigs.map((row, rowOrder) => {
          const groups = row.groups
          const isBottomRow = rowOrder === 2
          const fill = rowOrder === 1 ? "#C7C7C7" : "#F7F7F7"
          const fontSize = isBottomRow ? "11" : "12"
          const clickIndex = row.clickIndex

          return (
            <svg
              key={row.unit}
              x={worldLeft}
              y={row.y}
              width={worldWidth}
              height={ROW_HEIGHT}
            >
              {groups.map(group => {
                const groupKey = `${row.unit}-${group.startTime}`
                const startX = (group.startI + half) * cellWidth
                const spanWidth = (group.endI - group.startI + 1) * cellWidth
                const endX = startX + spanWidth
                if (endX < visibleMinX - cellWidth || startX > visibleMaxX + cellWidth) return null
                const intersectsViewport =
                  endX > visibleMinX && startX < visibleMaxX
                const label = group.label
                const labelWidth = Math.max(20, String(label).length * (isBottomRow ? 6.2 : 6.4))
                const chipWidth = labelWidth + 8
                const idealLabelCenterX = startX + spanWidth / 2
                const clampMode =
                  intersectsViewport && idealLabelCenterX < visibleMinX
                    ? "left"
                    : intersectsViewport && idealLabelCenterX > visibleMaxX
                      ? "right"
                      : "center"
                const chipX =
                  clampMode === "left"
                    ? visibleMinX
                    : clampMode === "right"
                      ? visibleMaxX - chipWidth
                      : idealLabelCenterX - chipWidth / 2
                const textX =
                  clampMode === "left"
                    ? chipX + 4
                    : clampMode === "right"
                      ? chipX + chipWidth - 4
                      : idealLabelCenterX
                const textAnchor =
                  clampMode === "left"
                    ? "start"
                    : clampMode === "right"
                      ? "end"
                      : "middle"
                const onClick = clickIndex >= 0
                  ? () => onNavigate(clickIndex, group.startTime)
                  : undefined
                const isHovered = hoveredGroupKey === groupKey
                const isCurrent = group.isCurrent
                const baseCellFill = isCurrent ? CURRENT_FILL_BY_ROW[rowOrder] : fill
                const cellFill = isHovered
                  ? rowOrder === 1 ? "#D6D7D9" : "#FFFFFF"
                  : baseCellFill
                const gapFillOpacity = isHovered ? 0.7 : 0.4
                const lineFill = isHovered
                  ? "#3D3E40"
                  : isCurrent
                    ? CURRENT_LINE
                    : "#58595B"

                return (
                  <g
                    key={groupKey}
                    onClick={onClick}
                    onMouseEnter={() => setHoveredGroupKey(groupKey)}
                    onMouseLeave={() => setHoveredGroupKey(null)}
                    style={{ cursor: onClick ? "pointer" : "default" }}
                  >
                    <rect
                      x={startX + GAP / 2}
                      y={0}
                      width={spanWidth - GAP}
                      height={ROW_HEIGHT}
                      fill={cellFill}
                    />
                    <rect
                      x={startX + spanWidth - GAP / 2}
                      y={0}
                      width={GAP}
                      height={ROW_HEIGHT}
                      fill={cellFill}
                      fillOpacity={gapFillOpacity}
                    />
                    <rect
                      x={startX + GAP / 2 + 4}
                      y={9}
                      width={spanWidth - GAP - 8}
                      height={2}
                      fill={lineFill}
                    />
                    {intersectsViewport && (
                      <rect
                        x={chipX}
                        y={isBottomRow ? 3 : 2}
                        width={chipWidth}
                        height={isBottomRow ? 12 : 14}
                        fill={cellFill}
                      />
                    )}
                    <path
                      d="M0 7L7 14L8 13L2.4 7L8 1L7 0"
                      transform={`translate(${startX + GAP / 2 + 4},3)`}
                      fill={lineFill}
                      fillRule="nonzero"
                    />
                    <path
                      d="M0 7L7 14L8 13L2.4 7L8 1L7 0"
                      transform={`translate(${startX + spanWidth - GAP / 2 - 4},3) scale(-1,1)`}
                      fill={lineFill}
                      fillRule="nonzero"
                    />
                    {intersectsViewport && (
                      <text
                        x={textX}
                        y={15}
                        textAnchor={textAnchor}
                        fill={lineFill}
                        fontSize={fontSize}
                        fontFamily="Futura"
                      >
                        {label}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )
        })}
      </g>
    )
  }
}
