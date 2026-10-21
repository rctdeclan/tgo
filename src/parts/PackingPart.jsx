
export class PackingPart {

  layout(alpha){
    const part = this
    const gamma = events => alpha(part.pack(events))
    return gamma
  }

  pack(events){
    const rows=[]
    return events.map(e=>{
      let row = Math.max(0, e.preferredRow ?? 0)
      while(rows[row] > e.start) row++
      rows[row] = e.start + e.span
      return {...e,row}
    })
  }
}
