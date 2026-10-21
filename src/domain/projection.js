
import { UNIT_MS } from "./time"

export function project(term, unit, origin){
  const unitMs = UNIT_MS[unit]
  const baseMs = UNIT_MS[term.definedUnit]
  const rel = term.anchor - origin
  const start = Math.floor(rel / unitMs)
  const span = Math.max(1, Math.ceil((baseMs * term.amount)/unitMs))
  return { start, span }
}
