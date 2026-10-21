
export function compose(Base){
  const partDefs = {}
  let BodyClass = null
  let viewFn = () => null

  return {
    part(name, PartClass){
      partDefs[name] = PartClass
      return this
    },

    body(Cls){
      BodyClass = Cls
      return this
    },

    view(fn){
      viewFn = fn
      return this
    },

    build(){
      return class Composed extends Base {
        constructor(...args){
          super(...args)

          // 1️⃣ instantiate body (pre-parts config)
          let bodyInstance = null
          if(BodyClass){
            bodyInstance = new BodyClass(this)
            Object.assign(this, bodyInstance)
          }

          // 2️⃣ instantiate parts
          this.parts = {}
          for(const key in partDefs){
            this.parts[key] = new partDefs[key](this)
          }

          // 3️⃣ optional init phase
          if(bodyInstance && typeof bodyInstance.init === "function"){
            bodyInstance.init.call(this)
          }
        }

        View = () => viewFn(this.parts, this)
      }
    }
  }
}
