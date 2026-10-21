import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))

// Load application JSX/extensionless imports for focused Node tests.
export function createSourceLoader({ modules = {}, globals = {} } = {}) {
  const cache = new Map()

  function load(file) {
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }
    cache.set(file, module)
    const code = transformSync(fs.readFileSync(file, 'utf8'), {
      loader: file.endsWith('.jsx') ? 'jsx' : 'js',
      format: 'cjs'
    }).code
    const resolve = name => {
      if (Object.hasOwn(modules, name)) return modules[name]
      if (!name.startsWith('.')) return require(name)
      if (name.endsWith('.png')) return name
      const candidate = path.resolve(path.dirname(file), name)
      const target = [candidate, `${candidate}.js`, `${candidate}.jsx`]
        .find(value => fs.existsSync(value) && fs.statSync(value).isFile())
      if (!target) throw new Error(`Cannot resolve ${name} from ${file}`)
      return load(target)
    }
    const factory = vm.runInNewContext(
      `(function(require, module, exports) { ${code}\n})`,
      { console, Date, Math, Number, String, globalThis, ...globals },
      { filename: file }
    )
    factory(resolve, module, module.exports)
    return module.exports
  }

  return relative => load(path.join(root, relative))
}
