import React, { useId, useState } from 'react'

const PATHS = {
  clipboard: 'M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3M9 3h6v4H9zM8 12h8M8 16h5',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  paste: 'M9 5H6a2 2 0 0 0-2 2v13h11M9 3h6v4H9zM19 10v10m-4-4 4 4 4-4',
  clear: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  left: 'm14 5-7 7 7 7',
  right: 'm10 5 7 7-7 7',
  close: 'm6 6 12 12M6 18 18 6'
}
function Icon({ name }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
}
function Tool({ label, icon, ...props }) {
  return <button type="button" aria-label={label} title={label} {...props}><Icon name={icon} /></button>
}

export function LandscapeTools({ viewport, onNavigate, children }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const id = useId()
  async function paste() {
    setOpen(true)
    try {
      const value = await navigator.clipboard.readText()
      setText(value); setMessage(value ? 'Pasted into buffer.' : 'Clipboard is empty.')
    } catch { setMessage('Paste into the field using your device’s paste command.') }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Copied to clipboard.') }
    catch { setOpen(true); setMessage('Select the text in the field and copy it manually.') }
  }
  return <div className="tgo-workspace">
    <aside className="tgo-rail tgo-clipboard-rail" aria-label="Clipboard bar">
      <div role="toolbar" aria-label="Clipboard controls" aria-orientation="vertical">
        <Tool label="Open clipboard buffer" icon="clipboard" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} />
        <span className="tgo-rail-divider" />
        <Tool label="Paste into clipboard buffer" icon="paste" onClick={paste} />
        <Tool label="Copy clipboard buffer" icon="copy" disabled={!text} onClick={copy} />
        <Tool label="Clear clipboard buffer" icon="clear" disabled={!text} onClick={() => { setText(''); setMessage('Buffer cleared.') }} />
      </div>
    </aside>
    <div className="tgo-stage">{children}</div>
    <aside className="tgo-rail tgo-command-rail" aria-label="Command bar">
      <div role="toolbar" aria-label="Timeline commands" aria-orientation="vertical">
        <Tool label="Zoom in" icon="plus" disabled={viewport.unitIndex === 0} onClick={() => onNavigate('stepUnit', -1, { readable: true })} />
        <Tool label="Zoom out" icon="minus" disabled={viewport.unitIndex === 9} onClick={() => onNavigate('stepUnit', 1, { readable: true })} />
        <span className="tgo-rail-divider" />
        <Tool label="Earlier" icon="left" onClick={() => onNavigate('panUnits', -1)} />
        <Tool label="Later" icon="right" onClick={() => onNavigate('panUnits', 1)} />
      </div>
    </aside>
    {open && <section className="tgo-clipboard-panel" id={id} aria-label="Clipboard buffer" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) } }}>
      <header><strong>Clipboard</strong><Tool label="Close clipboard buffer" icon="close" onClick={() => setOpen(false)} /></header>
      <label htmlFor={`${id}-text`}>Text buffer</label>
      <textarea id={`${id}-text`} value={text} onChange={e => { setText(e.target.value); setMessage('') }} placeholder="Paste or type text here…" rows="4" />
      <p role="status">{message || 'Kept here until you reload.'}</p>
    </section>}
  </div>
}
