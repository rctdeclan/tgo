
import React from "react"
import { compose } from "./core/compose"
import { PackingPart } from "./parts/PackingPart"
import { HeaderPart } from "./parts/HeaderPart"
import { StrokesPart } from "./parts/StrokesPart"
import { ListsPart } from "./parts/ListsPart"
import { ViewportSVG } from "./ui/ViewportSVG"

class BaseApp {}

const MIN_VISIBLE_UNITS = 3
const VIEWPORT_WIDTH = 640
const BASE_CELL_WIDTH = 120
const ZOOM_UPPER = VIEWPORT_WIDTH / (MIN_VISIBLE_UNITS * BASE_CELL_WIDTH)

export const App = compose(BaseApp)
  .part("packing", PackingPart)
  .part("header", HeaderPart)
  .part("strokes", StrokesPart)
  .part("lists", ListsPart)
  .body(class {
    constructor(app){
      this.viewportConfig = { zoomUpper: ZOOM_UPPER, zoomLower: 0.5 }
    }
init() {
  const now = Date.now()
  const day = 86400000
  const hour = 3600000

  const subjectColors = {
    Product: "#E88FA0",
    Engineering: "#7FB3F6",
    Marketing: "#F2AD6B",
    Research: "#8ECFAE",
    Ops: "#B7A0EA"
  }

  const events = [
    { subject: "Product", title: "Roadmap workshop", offset: -8*day, unit: "day", amount: 2 },
    { subject: "Product", title: "Quarter planning", offset: -20*day, unit: "quarter", amount: 1 },
    { subject: "Product", title: "Feature prioritization", offset: -5*day, unit: "day", amount: 1 },
    { subject: "Product", title: "Launch checklist", offset: 1*day, unit: "day", amount: 2 },
    { subject: "Product", title: "Backlog grooming", offset: 2*day + 2*hour, unit: "hour", amount: 2 },

    { subject: "Engineering", title: "Core refactor", offset: -7*day, unit: "day", amount: 4 },
    { subject: "Engineering", title: "API integration", offset: -2*day, unit: "day", amount: 3 },
    { subject: "Engineering", title: "Hotfix review", offset: 0*day + 6*hour, unit: "fourHour", amount: 1 },
    { subject: "Engineering", title: "Deploy window", offset: 4*day + 4*hour, unit: "fifteenMinute", amount: 8 },
    { subject: "Engineering", title: "Pair debugging", offset: 3*day + 1*hour, unit: "hour", amount: 1 },

    { subject: "Marketing", title: "Campaign planning", offset: -10*day, unit: "fortnight", amount: 1 },
    { subject: "Marketing", title: "Ad creative sprint", offset: -1*day, unit: "day", amount: 2 },
    { subject: "Marketing", title: "Launch announcement", offset: 4*day, unit: "day", amount: 1 },

    { subject: "Research", title: "Interview block", offset: -3*day, unit: "day", amount: 1 },
    { subject: "Research", title: "Usability session", offset: 1*day + 3*hour, unit: "hour", amount: 1 },
    { subject: "Research", title: "Insights synthesis", offset: 6*day, unit: "day", amount: 2 },

    { subject: "Ops", title: "Security patching", offset: -4*day, unit: "day", amount: 1 },
    { subject: "Ops", title: "Infra maintenance", offset: 0*day + 1*hour, unit: "hour", amount: 4 },
    { subject: "Ops", title: "Cost review", offset: 5*day, unit: "day", amount: 1 },
    { subject: "Ops", title: "Incident drill", offset: 7*day + 2*hour, unit: "hour", amount: 2 }
  ]

  events.forEach((e, i) => {
    this.parts.strokes.addEvent({
      id: String(i),
      title: e.title,
      color: subjectColors[e.subject],
      term: {
        anchor: now + e.offset,
        definedUnit: e.unit,
        amount: e.amount
      }
    })
  })
}
  })
  .view((parts, app) => (
    <ViewportSVG
      config={app.viewportConfig}
      stationaryChildren={
        <>
          <parts.strokes.Background />
          <parts.lists.Background />
        </>
      }
    >
      <parts.strokes.Content />
      <parts.lists.Content />
      <parts.header.View />
    </ViewportSVG>
  ))
  .build()
