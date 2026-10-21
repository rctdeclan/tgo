// Presentation input adapter: geometry stays in viewport capabilities.
export function attachTwoFingerTimeline(node, viewport, {
  width = 640, minScale = 0.5, maxScale = 10, onActiveChange = () => {},
  requestFrame, cancelFrame = () => {}
} = {}) {
  let previous = null
  let suppressClickUntil = 0
  let pending = null
  let frame = null

  function flush() {
    if (frame !== null) cancelFrame(frame)
    frame = null
    if (!pending || !previous) return
    const current = pending
    pending = null
    const factor = previous.distance > 0 && current.distance > 0
      ? current.distance / previous.distance : 1
    const delta = previous.x - current.x
    if (factor !== 1 || delta !== 0) {
      if (viewport.transformGesture) {
        viewport.transformGesture(previous.x, factor, delta, current.width, { minScale, maxScale })
      } else {
        if (factor !== 1) viewport.zoomByScaleFactor(previous.x, factor, current.width, { minScale, maxScale })
        if (delta !== 0) viewport.panBy(delta)
      }
    }
    previous = current
  }

  function sample(touches) {
    const [a, b] = touches
    const rect = node.getBoundingClientRect()
    return {
      x: (a.clientX + b.clientX) / 2 - rect.left,
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      width: rect.width || width,
      ids: [a.identifier, b.identifier].sort().join(':')
    }
  }

  function update(event) {
    if (event.touches.length !== 2) {
      flush()
      if (previous) suppressClickUntil = Date.now() + 500
      previous = null
      onActiveChange(false)
      return
    }
    event.preventDefault()
    const current = sample(event.touches)
    // Never interpret a replacement finger as a large pan or zoom.
    if (event.type === 'touchmove' && previous && previous.ids === current.ids) {
      pending = current
      if (!requestFrame) flush()
      else if (frame === null) frame = requestFrame(flush)
    } else {
      flush()
      previous = current
    }
    suppressClickUntil = Date.now() + 500
    onActiveChange(true)
  }

  function cancel() {
    if (frame !== null) cancelFrame(frame)
    frame = null
    pending = null
    if (previous) suppressClickUntil = Date.now() + 500
    previous = null
    onActiveChange(false)
  }

  function click(event) {
    if (Date.now() <= suppressClickUntil) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  for (const type of ['touchstart', 'touchmove', 'touchend']) {
    node.addEventListener(type, update, { passive: false })
  }
  node.addEventListener('touchcancel', cancel)
  node.addEventListener('click', click, true)
  return () => {
    for (const type of ['touchstart', 'touchmove', 'touchend']) node.removeEventListener(type, update)
    node.removeEventListener('touchcancel', cancel)
    node.removeEventListener('click', click, true)
    cancel()
  }
}
