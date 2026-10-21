import { createViewport } from "../state/viewport"

export class ViewportPart {
  constructor(app) {
    this.viewport = createViewport(app.viewportConfig)
  }

  read(alpha) {
    const viewport = this.viewport
    const gamma = () => alpha(viewport.getSnapshot())
    return gamma
  }

  navigate(alpha) {
    const viewport = this.viewport
    const commands = {
      panBy: (...args) => viewport.panBy(...args),
      panUnits: (...args) => viewport.panUnits(...args),
      zoomByScaleFactor: (...args) => viewport.zoomByScaleFactor(...args),
      jumpTo: (...args) => viewport.jumpTo(...args),
      stepUnit: (...args) => viewport.stepUnit(...args)
    }
    const gamma = (command, ...args) => {
      if (!Object.hasOwn(commands, command)) throw new Error('Unknown viewport command: ' + command)
      commands[command](...args)
      const snapshot = viewport.getSnapshot()
      alpha(snapshot)
      return snapshot
    }
    return gamma
  }

  stepScale(alpha) {
    const viewport = this.viewport
    const gamma = delta => alpha(viewport.stepScale(delta))
    return gamma
  }
}
