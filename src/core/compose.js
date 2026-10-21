export function compose(Base) {
  const partDefs = []
  let BodyClass = null
  let viewFn = () => null

  return {
    part(name, PartClass) {
      partDefs.push([name, PartClass])
      return this
    },
    body(Cls) {
      BodyClass = Cls
      return this
    },
    view(fn) {
      viewFn = fn
      return this
    },
    build() {
      const definitions = [...partDefs]
      const Body = BodyClass
      const render = viewFn
      return class Composed extends Base {
        constructor(...args) {
          super(...args)
          if (Body) {
            const body = new Body(this)
            for (const key of Reflect.ownKeys(body)) {
              const descriptor = Object.getOwnPropertyDescriptor(body, key)
              if (!('value' in descriptor) || typeof descriptor.value === 'function') {
                throw new TypeError(`Body own field ${String(key)} must be data; use an ordinary prototype method for orchestration`)
              }
              Object.defineProperty(this, key, descriptor)
            }
            for (const key of Reflect.ownKeys(Body.prototype)) {
              if (key === 'constructor') continue
              Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(Body.prototype, key))
            }
          }
          this.parts = {}
          for (const [name, Part] of definitions) {
            this.parts[name] = new Part(this)
          }
          if (Body && typeof Body.prototype.init === 'function') {
            Body.prototype.init.call(this)
          }
        }
        View = () => render(this.parts, this)
      }
    }
  }
}
