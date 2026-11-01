import React, { useEffect, useRef, useState } from 'react'
import { SCENE_WIDTH, SCENE_HEIGHT, phoneContentHeight } from './frameGeometry'

const PHONE_QUERY = '(max-width: 639px), (max-width: 960px) and (max-height: 500px) and (pointer: coarse)'
const UNIT_LABELS = { minute: 'Minutes', fifteenMinute: '15 minutes', hour: 'Hours', fourHour: '4 hours', day: 'Days', week: 'Weeks', fortnight: 'Fortnights', month: 'Months', quarter: 'Quarters', year: 'Years' }

export function TimelineFrame({ viewport, rowCount, onNavigate, children }) {
  const host = useRef(null)
  const [frame, setFrame] = useState({ width: SCENE_WIDTH, mobile: false })
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY)
    let lastWidth
    function measure() {
      const width = Math.max(1, Math.min(SCENE_WIDTH, host.current.getBoundingClientRect().width))
      setFrame(current => current.width === width && current.mobile === query.matches
        ? current : { width, mobile: query.matches })
      if (width !== lastWidth) { lastWidth = width; onNavigate('resizeFrame', width) }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host.current)
    query.addEventListener('change', measure)
    return () => { observer.disconnect(); query.removeEventListener('change', measure) }
  }, [onNavigate])
  return (
    <section className="tgo-shell" aria-label="TGO timeline">
      <header className="tgo-phone-heading"><strong>TGO</strong><span>Europe / Amsterdam</span></header>
      <div className="tgo-canvas" ref={host}>
        {children({ ...frame, height: frame.mobile ? phoneContentHeight(rowCount) : SCENE_HEIGHT })}
      </div>
      <nav className="tgo-phone-controls" aria-label="Timeline navigation">
        <button aria-label="Earlier" title="Earlier" onClick={() => onNavigate('panUnits', -1)}>‹</button>
        <button aria-label="Later" title="Later" onClick={() => onNavigate('panUnits', 1)}>›</button>
        <span className="tgo-phone-unit" aria-live="polite">{UNIT_LABELS[viewport.unit]}</span>
        <button aria-label="Zoom out" title="Zoom out" disabled={viewport.unitIndex === 9} onClick={() => onNavigate('stepUnit', 1, { readable: true })}>−</button>
        <button aria-label="Zoom in" title="Zoom in" disabled={viewport.unitIndex === 0} onClick={() => onNavigate('stepUnit', -1, { readable: true })}>+</button>
      </nav>
    </section>
  )
}
