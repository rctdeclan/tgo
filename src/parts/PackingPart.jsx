
export class PackingPart {
  constructor(app){ this.app = app }

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
