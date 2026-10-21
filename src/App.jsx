
import React, { useSyncExternalStore } from "react"
import { addCalendar } from "./domain/calendar"
import { compose } from "./core/compose"
import { ViewportPart } from "./parts/ViewportPart"
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
  .part("viewport", ViewportPart)
  .part("packing", PackingPart)
  .part("header", HeaderPart)
  .part("strokes", StrokesPart)
  .part("lists", ListsPart)
  .body(class {
    constructor(app){
      this.viewportConfig = { zoomUpper: ZOOM_UPPER, zoomLower: 0.5 }
      this.listeners = new Set()
      this.snapshot = null
    }
    subscribe(listener) {
      this.listeners.add(listener)
      return () => this.listeners.delete(listener)
    }

    refresh() {
      const viewport = this.readViewport()
      const layout = this.readLayout(viewport)
      this.snapshot = {
        viewport,
        layout,
        header: this.presentHeader(viewport, Date.now()),
        lists: this.presentLists(viewport, layout)
      }
      this.listeners.forEach(listener => listener())
    }

    createEvent(draft) {
      return this.createStroke(draft, this.readViewport())
    }

    init() {
      this.readViewport = this.parts.viewport.read(viewport => viewport)
      this.readLayout = this.parts.strokes.layout(layout => layout)
      this.presentHeader = this.parts.header.present(model => model)
      this.presentLists = this.parts.lists.present(model => model)
      this.navigate = this.parts.viewport.navigate(() => this.refresh())
      this.getStepZoomScale = this.parts.viewport.stepScale(scale => scale)
      this.insertEvent = this.parts.strokes.insert(event => event)
      this.createStroke = this.parts.strokes.create(event => this.insertEvent(event))
      this.navigateHeader = this.parts.header.navigate((index, time) => this.navigate("jumpTo", index, time))
      this.eventsChanged = this.parts.strokes.observe(() => this.refresh())
      this.refresh()
      this.seedEvents()
    }

    seedEvents() {
      const now = Date.now()

      const subjectColors = {
        Product: "#E88FA0",
        Engineering: "#7FB3F6",
        Marketing: "#F2AD6B",
        Research: "#8ECFAE",
        Ops: "#B7A0EA"
      }

      const events = [
        { subject: "Product", title: "Roadmap workshop", offsetDays: -8, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Quarter planning", offsetDays: -20, offsetHours: 0, unit: "quarter", amount: 1 },
        { subject: "Product", title: "Feature prioritization", offsetDays: -5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Product", title: "Launch checklist", offsetDays: 1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Backlog grooming", offsetDays: 2, offsetHours: 2, unit: "hour", amount: 2 },

        { subject: "Engineering", title: "Core refactor", offsetDays: -7, offsetHours: 0, unit: "day", amount: 4 },
        { subject: "Engineering", title: "API integration", offsetDays: -2, offsetHours: 0, unit: "day", amount: 3 },
        { subject: "Engineering", title: "Hotfix review", offsetDays: 0, offsetHours: 6, unit: "fourHour", amount: 1 },
        { subject: "Engineering", title: "Deploy window", offsetDays: 4, offsetHours: 4, unit: "fifteenMinute", amount: 8 },
        { subject: "Engineering", title: "Pair debugging", offsetDays: 3, offsetHours: 1, unit: "hour", amount: 1 },

        { subject: "Marketing", title: "Campaign planning", offsetDays: -10, offsetHours: 0, unit: "fortnight", amount: 1 },
        { subject: "Marketing", title: "Ad creative sprint", offsetDays: -1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Marketing", title: "Launch announcement", offsetDays: 4, offsetHours: 0, unit: "day", amount: 1 },

        { subject: "Research", title: "Interview block", offsetDays: -3, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Research", title: "Usability session", offsetDays: 1, offsetHours: 3, unit: "hour", amount: 1 },
        { subject: "Research", title: "Insights synthesis", offsetDays: 6, offsetHours: 0, unit: "day", amount: 2 },

        { subject: "Ops", title: "Security patching", offsetDays: -4, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Infra maintenance", offsetDays: 0, offsetHours: 1, unit: "hour", amount: 4 },
        { subject: "Ops", title: "Cost review", offsetDays: 5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Incident drill", offsetDays: 7, offsetHours: 2, unit: "hour", amount: 2 }
      ]

      events.forEach((e, i) => {
        this.insertEvent({
          id: String(i),
          title: e.title,
          color: subjectColors[e.subject],
          term: {
            anchor: addCalendar(addCalendar(now, "day", e.offsetDays), "hour", e.offsetHours),
            definedUnit: e.unit,
            amount: e.amount
          }
        })
      })
    }
  })
  .view((parts, app) => <AppPresentation parts={parts} app={app} />)
  .build()

function AppPresentation({ parts, app }) {
  const model = useSyncExternalStore(
    listener => app.subscribe(listener),
    () => app.snapshot,
    () => app.snapshot
  )
  const viewport = {
    ...model.viewport,
    panBy: (...args) => app.navigate("panBy", ...args),
    panUnits: (...args) => app.navigate("panUnits", ...args),
    zoomByScaleFactor: (...args) => app.navigate("zoomByScaleFactor", ...args),
    stepUnit: (...args) => app.navigate("stepUnit", ...args)
  }
  return (
    <ViewportSVG
      config={app.viewportConfig}
      viewport={viewport}
      getStepZoomScale={app.getStepZoomScale}
      stationaryChildren={
        <>
          <parts.strokes.Background viewport={model.viewport} layout={model.layout} />
          <parts.lists.Background {...model.lists} />
        </>
      }
    >
      <parts.strokes.Content viewport={model.viewport} layout={model.layout} onCreate={draft => app.createEvent(draft)} />
      <parts.lists.Content {...model.lists} />
      <parts.header.View {...model.header} onNavigate={app.navigateHeader} />
    </ViewportSVG>
  )
}
