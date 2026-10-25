import React, { useSyncExternalStore } from 'react'
import { compose } from '../core/compose'
import { StrokesPart } from '../parts/StrokesPart'
import { TimelinePart } from './TimelinePart'
import { ScheduleView } from './ScheduleView'
import { createStudyEvents } from './seeds'

export const ExperimentApp = compose(class {})
  .part('events', StrokesPart)
  .part('timeline', TimelinePart)
  .body(class {
    constructor() { this.events = []; this.listeners = new Set(); this.snapshot = null }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
    refresh() { this.snapshot = this.present(this.events); this.listeners.forEach(listener => listener()) }
    init() {
      this.present = this.parts.timeline.present(model => model)
      this.navigate = this.parts.timeline.navigate(() => this.refresh())
      this.insert = this.parts.events.insert(event => event)
      this.observe = this.parts.events.observe(events => { this.events = [...events]; this.refresh() })
      this.refresh()
      createStudyEvents().forEach(event => this.insert(event))
    }
  })
  .view((parts, app) => <Presentation app={app} />)
  .build()
function Presentation({ app }) {
  const model = useSyncExternalStore(listener => app.subscribe(listener), () => app.snapshot, () => app.snapshot)
  return <ScheduleView model={model} navigate={app.navigate} />
}
