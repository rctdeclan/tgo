// Presentation input adapter: geometry stays in viewport capabilities.
export function attachTwoFingerTimeline(node, viewport, {
  width = 640, minScale = 0.5, maxScale = 10, onActiveChange = () => {}
} = {}) {
  let previous = null
  let suppressClickUntil = 0

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
      if (previous) suppressClickUntil = Date.now() + 500
      previous = null
      onActiveChange(false)
      return
    }
    event.preventDefault()
    const current = sample(event.touches)
    // Never interpret a replacement finger as a large pan or zoom.
    if (event.type === 'touchmove' && previous && previous.ids === current.ids) {
      if (previous.distance > 0 && current.distance > 0) {
        viewport.zoomByScaleFactor(previous.x, current.distance / previous.distance,
          current.width, { minScale, maxScale })
      }
      viewport.panBy(previous.x - current.x)
    }
    previous = current
    suppressClickUntil = Date.now() + 500
    onActiveChange(true)
  }

  function cancel() {
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
