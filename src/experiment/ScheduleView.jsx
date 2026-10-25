import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { attachTwoFingerTimeline } from '../hooks/twoFingerTimeline'
import { SIDEBAR } from './model'
import './study.css'

const LEVELS = [{ unit: 'week', label: 'Weeks', zoom: 15 }, { unit: 'day', label: 'Days', zoom: 50 }, { unit: 'hour', label: 'Hours', zoom: 84 }]
export function ScheduleView({ model, navigate }) {
  const sidebar = model.sidebar ?? SIDEBAR
  const scroll = useRef(null)
  const latest = useRef(model)
  latest.current = model
  useLayoutEffect(() => {
    const node = scroll.current
    if (node && Math.abs(node.scrollLeft - model.scrollLeft) > 0.5) node.scrollLeft = model.scrollLeft
  }, [model.scrollLeft, model.worldWidth])
  useEffect(() => {
    const node = scroll.current
    const measure = () => {
      const sidebar = node.clientWidth < 640 ? 190 : SIDEBAR
      navigate('resize', node.clientWidth - sidebar, sidebar)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    const detach = attachTwoFingerTimeline(node, {
      transformGesture: (x, factor, delta) => navigate('gesture', Math.max(0, x - latest.current.sidebar), factor, delta)
    }, { requestFrame: callback => requestAnimationFrame(callback), cancelFrame: cancelAnimationFrame })
    function wheel(event) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const x = Math.max(0, event.clientX - node.getBoundingClientRect().left - latest.current.sidebar)
      navigate('zoom', latest.current.zoom - event.deltaY * 0.06, x)
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => { observer.disconnect(); detach(); node.removeEventListener('wheel', wheel) }
  }, [navigate])
  const collapseUnit = model.unit === 'hour' ? 'day' : 'week'
  return (
    <main className="study-shell" style={{ '--sidebar-width': `${sidebar}px` }}>
      <section className="schedule-card" aria-label="TGO experimental schedule">
        <header className="study-topbar">
          <div>
            <div className="study-eyebrow"><span className="status-dot" /> TGO <span className="study-separator">/</span> TIMELINE STUDY 01</div>
            <h1>{model.from} <span>to</span> {model.to}</h1>
            <p>A different perspective on your time.</p>
          </div>
          <div className="study-location"><span>EUROPE / AMSTERDAM</span><strong>{model.unit === 'hour' ? 'A closer look.' : model.unit === 'day' ? 'One day at a time.' : 'The weeks ahead.'}</strong></div>
        </header>
        <nav className="study-controls" aria-label="Timeline controls">
          <div className="scale-tabs" aria-label="Header detail">
            {LEVELS.map(level => <button key={level.unit} aria-pressed={model.unit === level.unit} onClick={() => navigate('zoom', level.zoom)}>{level.label}</button>)}
          </div>
          <span className="control-divider" />
          <button className="quiet-control" disabled={model.unit === 'week'} onClick={() => navigate('collapse', collapseUnit, model.centerTime)} aria-label={`Collapse visible ${collapseUnit}`}><span>−</span> Fold {collapseUnit}</button>
          <div className="zoom-controls">
            <button aria-label="Zoom out" onClick={() => navigate('zoom', model.zoom - 7)}>−</button>
            <input type="range" min="0" max="100" step="0.5" value={model.zoom} aria-label="Timeline zoom" onChange={e => navigate('zoom', Number(e.target.value))} />
            <button aria-label="Zoom in" onClick={() => navigate('zoom', model.zoom + 7)}>+</button>
          </div>
          <button className="today-control" onClick={() => navigate('today')}>Today <span>↗</span></button>
        </nav>
        <div className="schedule-scroll" ref={scroll} onScroll={e => navigate('scroll', e.currentTarget.scrollLeft)} aria-label="Scrollable schedule" tabIndex={0}>
          <div className="schedule-world" style={{ width: sidebar + model.worldWidth, '--cell-width': `${model.cellWidth}px` }}>
            <div className="schedule-header" role="row">
              <div className="header-track" style={{ left: sidebar, width: model.worldWidth }}>
                {model.cells.map(cell => {
                  const canOpen = cell.unit !== 'hour'
                  const labelLeft = Math.max(8, Math.min(cell.width - 48, model.scrollLeft - cell.x + 8))
                  return <div className={`header-cell ${cell.weekend ? 'is-weekend' : ''} ${cell.current ? 'is-current' : ''}`} key={cell.key} style={{ left: cell.x, width: cell.width }}>
                    <button data-level={cell.unit} title={cell.title} aria-label={canOpen ? `Open ${cell.title} into ${cell.unit === 'week' ? 'days' : 'hours'}` : cell.title} disabled={!canOpen} onClick={() => navigate('open', cell.unit, cell.start)}>
                      <span className="leaf-copy" style={{ left: labelLeft }}><small>{cell.detail}</small><strong>{cell.label}</strong></span>
                      {canOpen && <span className="leaf-chevron">›</span>}
                    </button>
                  </div>
                })}
              </div>
              <div className="name-column header-name"><span>ITEM</span><span>EVENT NAME <small>{String(model.rows.length).padStart(2, '0')}</small></span></div>
            </div>
            <div className="schedule-rows">
              <div className="today-line" style={{ left: sidebar + model.todayX }}><span /></div>
              {model.rows.map((event, index) => <div className="schedule-row" key={event.id} data-event-row={event.id}>
                <div className="row-grid" style={{ left: sidebar }} />
                <div className="event-bar" data-event-bar={event.id} title={`${event.title} · ${event.term.amount} ${event.term.definedUnit}`} style={{ left: sidebar + event.start * model.cellWidth, width: Math.max(5, event.span * model.cellWidth), '--event-color': event.color }}><span className="bar-start" /><span className="bar-text">{event.title}</span><span className="bar-end" /></div>
                <div className="name-column event-name"><span className="event-id">{String(index + 1).padStart(3, '0')}</span><span className="event-title"><i style={{ background: event.color }} />{event.title}</span></div>
              </div>)}
            </div>
          </div>
        </div>
        <footer className="study-footer"><span><i /> {model.rows.length} items <b>·</b> One event, one row</span><span>Drag or scroll to explore <b>·</b> Pinch to change detail <span className="footer-arrow">↔</span></span></footer>
      </section>
      <span className="study-caption">TGO <span>—</span> A STUDY IN TIME</span>
    </main>
  )
}
