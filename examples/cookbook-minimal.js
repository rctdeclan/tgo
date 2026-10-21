import { compose } from '../src/core/compose.js'

// Illustrative capability signatures, not a universal Cookbook argument protocol.
export class ExamplePart {
  beta(alpha) {
    const context = { runs: 0, processed: 0 }
    const gamma = values => {
      context.runs += 1
      const output = []
      for (const value of values) {
        const result = alpha(value, context.runs)
        context.processed += 1
        output.push(String(result).toUpperCase())
      }
      return {
        run: context.runs,
        processed: context.processed,
        output: output.join(',')
      }
    }
    return gamma
  }

  effect(alpha) {
    const context = { calls: 0, completed: 0 }
    const gamma = (value, { enabled = true } = {}) => {
      context.calls += 1
      if (enabled) alpha(value, context.calls)
      context.completed += 1
    }
    return gamma
  }
}

export function runExample() {
  const part = new ExamplePart()
  const gamma = part.beta((value, run) => `${value}:${run}`)
  return [gamma(['a', 'b']), gamma(['c'])]
}

export const ExampleApp = compose(class {})
  .part('source', ExamplePart)
  .part('destination', ExamplePart)
  .body(class {
    constructor() {
      this.received = []
    }

    init() {
      const receive = this.parts.destination.effect(value => {
        this.received.push(value)
      })
      this.forward = this.parts.source.beta(value => {
        receive(value)
        return value
      })
    }

    run(values) {
      return this.forward(values)
    }
  })
  .view((parts, app) => ({ parts, app }))
  .build()
