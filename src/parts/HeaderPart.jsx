import React, { useState } from "react"
import { useViewport } from "../state/viewport"
import { UNIT_MS, UNIT_ORDER, UNIT_TERM_SPAN } from "../domain/time"

const BASE_WIDTH = 120
const VISIBLE = 40
const FRAME_WIDTH = 640
const HEADER_HEIGHT = 75
const GAP = 14
const ROW_HEIGHT = 21
const ROW_Y = [6, 27, 48]
const CURRENT_FILL_BY_ROW = ["#F6D7DA", "#E7B8BF", "#F6D7DA"]
const CURRENT_LINE = "#B2475A"

function format(date, unit) {
  switch (unit) {
    case "year":
      return String(date.getFullYear())
    case "quarter":
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
    case "month":
      return date.toLocaleDateString([], { month: "long" })
    case "fortnight":
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    case "week": {
      const oneJan = new Date(date.getFullYear(), 0, 1)
      const week = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7)
      return `Week ${week}`
    }
    case "day":
      return date.toLocaleDateString([], { weekday: "short", day: "numeric" })
    case "fourHour":
      return date.toLocaleTimeString([], { hour: "numeric", hour12: true })
    case "hour":
      return date.toLocaleTimeString([], { hour: "numeric", hour12: true })
    case "fifteenMinute":
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    case "minute":
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    default:
      return ""
  }
}

function spanBetweenUnits(startIndex, targetIndex){
  if(targetIndex <= startIndex) return 1

  let span = 1
  for(let index = startIndex; index < targetIndex; index++){
    const unit = UNIT_ORDER[index]
    span *= UNIT_TERM_SPAN[unit] || 1
  }
  return span
}

function buildGroups(half, unitMs, worldOriginTime, span){
  const groups = []
  const originCellIndex = Math.floor(worldOriginTime / unitMs)
  const visibleStartIndex = originCellIndex - half
  const visibleEndIndex = originCellIndex + half - 1
  const firstGroupStart = Math.floor(visibleStartIndex / span) * span

  for(let groupStartIndex = firstGroupStart; groupStartIndex <= visibleEndIndex; groupStartIndex += span){
    const groupEndIndex = groupStartIndex + span - 1
    const startI = groupStartIndex - originCellIndex
    const endI = groupEndIndex - originCellIndex
    const startDate = new Date(groupStartIndex * unitMs)
    if(isNaN(startDate.getTime())) continue

    groups.push({
      startI,
      endI,
      startDate
    })
  }

  return groups
}

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value))
}

export class HeaderPart {
  constructor(app) { this.app = app }

  View = () => {
    const vp = useViewport(this.app.viewportConfig)
    const [hoveredGroupKey, setHoveredGroupKey] = useState(null)
    if (!vp.unit) return null

    const cellWidth = BASE_WIDTH * vp.zoom
    const unitMs = UNIT_MS[vp.unit]
    if (!unitMs) return null

    const half = Math.floor(VISIBLE / 2)
    const now = Date.now()
    const worldWidth = cellWidth * VISIBLE
    const worldLeft = -half * cellWidth
    const visibleMinX = -FRAME_WIDTH / 2 - vp.worldOffsetPx - worldLeft
    const visibleMaxX = FRAME_WIDTH / 2 - vp.worldOffsetPx - worldLeft
    const visibleRowConfigs = [vp.unitIndex + 2, vp.unitIndex + 1, vp.unitIndex]
      .filter(index => index >= 0 && index < UNIT_ORDER.length)
      .map((index, rowOrder) => ({
        unitIndex: index,
        unit: UNIT_ORDER[index],
        span: spanBetweenUnits(vp.unitIndex, index),
        y: ROW_Y[rowOrder]
      }))

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
          const groups = buildGroups(half, unitMs, vp.worldOriginTime, row.span)
          const isBottomRow = rowOrder === 2
          const fill = rowOrder === 1 ? "#C7C7C7" : "#F7F7F7"
          const fontSize = isBottomRow ? "11" : "12"
          const clickIndex = isBottomRow ? vp.unitIndex - 1 : row.unitIndex

          return (
            <svg
              key={row.unit}
              x={worldLeft}
              y={row.y}
              width={worldWidth}
              height={ROW_HEIGHT}
            >
              {groups.map(group => {
                const groupKey = `${row.unit}-${group.startI}`
                const startX = (group.startI + half) * cellWidth
                const spanWidth = (group.endI - group.startI + 1) * cellWidth
                const endX = startX + spanWidth
                const groupStartTime = group.startDate.getTime()
                const groupEndTime = groupStartTime + spanWidth / cellWidth * unitMs
                const intersectsViewport =
                  endX > visibleMinX && startX < visibleMaxX
                const label = format(group.startDate, row.unit)
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
                  ? () => vp.jumpTo(clickIndex, group.startDate.getTime())
                  : undefined
                const isHovered = hoveredGroupKey === groupKey
                const isCurrent = now >= groupStartTime && now < groupEndTime
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
