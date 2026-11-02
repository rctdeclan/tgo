
import React, { useSyncExternalStore } from "react"
import { addCalendar } from "./domain/calendar"
import { compose } from "./core/compose"
import { ViewportPart } from "./parts/ViewportPart"
import { PackingPart } from "./parts/PackingPart"
import { HeaderPart } from "./parts/HeaderPart"
import { StrokesPart } from "./parts/StrokesPart"
import { ListsPart } from "./parts/ListsPart"
import { ViewportSVG } from "./ui/ViewportSVG"
import { TimelineFrame } from "./ui/TimelineFrame"

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
        { subject: "Product", title: "Roadmap workshop", subtitle: "Align the next releases with customer priorities.", offsetDays: -8, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Quarter planning", subtitle: "Set outcomes, milestones and ownership for the quarter.", offsetDays: -20, offsetHours: 0, unit: "quarter", amount: 1 },
        { subject: "Product", title: "Feature prioritization", subtitle: "Compare proposed improvements and agree on the next steps.", offsetDays: -5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Product", title: "Launch checklist", subtitle: "Review release readiness across the team.", offsetDays: 1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Backlog grooming", subtitle: "Clarify stories and estimate upcoming work.", offsetDays: 2, offsetHours: 2, unit: "hour", amount: 2 },

        { subject: "Engineering", title: "Core refactor", subtitle: "Simplify shared modules and reduce maintenance overhead.", offsetDays: -7, offsetHours: 0, unit: "day", amount: 4 },
        { subject: "Engineering", title: "API integration", subtitle: "Connect the service endpoints and verify their contracts.", offsetDays: -2, offsetHours: 0, unit: "day", amount: 3 },
        { subject: "Engineering", title: "Hotfix review", subtitle: "Review urgent fixes before approving a release.", offsetDays: 0, offsetHours: 6, unit: "dayPart", amount: 1 },
        { subject: "Engineering", title: "Deploy window", subtitle: "Ship the release and monitor service health.", offsetDays: 4, offsetHours: 4, unit: "fifteenMinute", amount: 8 },
        { subject: "Engineering", title: "Pair debugging", subtitle: "Investigate a difficult issue together.", offsetDays: 3, offsetHours: 1, unit: "hour", amount: 1 },

        { subject: "Marketing", title: "Campaign planning", subtitle: "Agree on the message, channels and delivery dates.", offsetDays: -10, offsetHours: 0, unit: "fortnight", amount: 1 },
        { subject: "Marketing", title: "Ad creative sprint", subtitle: "Develop and review the next campaign assets.", offsetDays: -1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Marketing", title: "Launch announcement", subtitle: "Publish the release message across our channels.", offsetDays: 4, offsetHours: 0, unit: "day", amount: 1 },

        { subject: "Research", title: "Interview block", subtitle: "Collect customer stories and unmet needs.", offsetDays: -3, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Research", title: "Usability session", subtitle: "Observe how people complete key product tasks.", offsetDays: 1, offsetHours: 3, unit: "hour", amount: 1 },
        { subject: "Research", title: "Insights synthesis", subtitle: "Turn research findings into actionable recommendations.", offsetDays: 6, offsetHours: 0, unit: "day", amount: 2 },

        { subject: "Ops", title: "Security patching", subtitle: "Apply updates and verify the affected systems.", offsetDays: -4, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Infra maintenance", subtitle: "Check infrastructure health and scheduled upgrades.", offsetDays: 0, offsetHours: 1, unit: "hour", amount: 4 },
        { subject: "Ops", title: "Cost review", subtitle: "Review usage and identify practical savings.", offsetDays: 5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Incident drill", subtitle: "Practice response roles and recovery procedures.", offsetDays: 7, offsetHours: 2, unit: "hour", amount: 2 }
      ]

      events.forEach((e, i) => {
        this.insertEvent({
          id: String(i),
          title: e.title,
          subtitle: e.subtitle,
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
    transformGesture: (...args) => app.navigate("transformGesture", ...args),
    stepUnit: (...args) => app.navigate("stepUnit", ...args)
  }
  return (
    <TimelineFrame viewport={model.viewport} rowCount={model.layout.rowCount} onNavigate={app.navigate}>
      {frame => (
        <ViewportSVG
          frameWidth={frame.width}
          frameHeight={frame.height}
          mobile={frame.mobile}
          config={app.viewportConfig}
          viewport={viewport}
          getStepZoomScale={app.getStepZoomScale}
          stationaryChildren={
            <>
              <parts.strokes.Background viewport={model.viewport} layout={model.layout} />
            </>
          }
        >
          <parts.strokes.Content frameWidth={frame.width} viewport={model.viewport} layout={model.layout} onCreate={draft => app.createEvent(draft)} />
          <parts.header.View {...model.header} frameWidth={frame.width} onNavigate={app.navigateHeader} />
        </ViewportSVG>
      )}
    </TimelineFrame>
  )
}
