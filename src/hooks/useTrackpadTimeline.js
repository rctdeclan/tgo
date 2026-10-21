import { useEffect, useRef } from "react"
import { useGesture } from "@use-gesture/react"
import { attachTwoFingerTimeline } from "./twoFingerTimeline"

export function useTrackpadTimeline(viewport, options = {}){
  const {
    width = 640,
    minScale = 0.5,
    maxScale = 10,
    zoomSensitivity = 0.00035
  } = options

  const ref = useRef(null)
  const lastGestureScaleRef = useRef(1)
  const wheelZoomRemainderRef = useRef(0)
  const pinchZoomRemainderRef = useRef(0)
  const touchActiveRef = useRef(false)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  function applyZoomStep(cursorX, direction, viewportWidth){
    const step = 1.025
    const zoomFactor = direction < 0 ? step : 1 / step
    viewport.zoomByScaleFactor(cursorX, zoomFactor, viewportWidth, {
      minScale,
      maxScale
    })
  }

  useGesture(
    {
      onWheel: ({ event, delta: [dx, dy], ctrlKey }) => {
        event.preventDefault()

        const rect = ref.current?.getBoundingClientRect()
        const viewportWidth = rect?.width || width
        const cursorX = rect ? event.clientX - rect.left : viewportWidth / 2

        if(ctrlKey){
          wheelZoomRemainderRef.current += dy

          const threshold = 120
          while(Math.abs(wheelZoomRemainderRef.current) >= threshold){
            const direction = wheelZoomRemainderRef.current < 0 ? -1 : 1
            applyZoomStep(cursorX, direction, viewportWidth)
            wheelZoomRemainderRef.current -= direction * threshold
          }
          return
        }

        wheelZoomRemainderRef.current = 0
        viewport.panBy(dx)
      },
      onPinch: ({ event, origin, offset: [distance], first, memo }) => {
        // Touch owns a continuous, combined pan/zoom path. Avoid double delivery.
        if(event?.type?.startsWith("touch") || event?.pointerType === "touch") return distance
        // The retained Safari adapter below owns native gesture events.
        if(event?.type?.startsWith("gesture")) return distance
        const rect = ref.current?.getBoundingClientRect()
        const viewportWidth = rect?.width || width
        const cursorX = rect ? origin[0] - rect.left : viewportWidth / 2

        if(first){
          pinchZoomRemainderRef.current = 0
          return distance
        }

        const previousDistance = memo ?? distance
        if(previousDistance > 0 && distance > 0){
          const ratio = distance / previousDistance
          pinchZoomRemainderRef.current += Math.log(ratio)
          const threshold = 0.12

          while(Math.abs(pinchZoomRemainderRef.current) >= threshold){
            const direction = pinchZoomRemainderRef.current > 0 ? -1 : 1
            applyZoomStep(cursorX, direction, viewportWidth)
            pinchZoomRemainderRef.current += direction * threshold
          }
        }

        return distance
      }
    },
    {
      target: ref,
      pinch: { pinchOnWheel: false },
      eventOptions: { passive: false }
    }
  )

  useEffect(() => {
    if (!ref.current) return undefined
    return attachTwoFingerTimeline(ref.current, {
      panBy: delta => viewportRef.current.panBy(delta),
      zoomByScaleFactor: (...args) => viewportRef.current.zoomByScaleFactor(...args)
    }, { width, minScale, maxScale, onActiveChange: active => { touchActiveRef.current = active } })
  }, [width, minScale, maxScale])

  useEffect(()=>{
    const node = ref.current
    if(!node) return undefined

    function onGestureStart(event){
      event.preventDefault()
      if(touchActiveRef.current) return
      lastGestureScaleRef.current = event.scale || 1
    }

    function onGestureChange(event){
      event.preventDefault()
      if(touchActiveRef.current) return

      const rect = node.getBoundingClientRect()
      const viewportWidth = rect.width || width
      const cursorX = Number.isFinite(event.clientX)
        ? event.clientX - rect.left
        : viewportWidth / 2

      const previousScale = lastGestureScaleRef.current || 1
      const nextScale = event.scale || previousScale

      if(Number.isFinite(nextScale) && nextScale > 0 && nextScale !== previousScale){
        const ratio = nextScale / previousScale
        pinchZoomRemainderRef.current += Math.log(ratio)
        const threshold = 0.08

        while(Math.abs(pinchZoomRemainderRef.current) >= threshold){
          const direction = pinchZoomRemainderRef.current > 0 ? -1 : 1
          applyZoomStep(cursorX, direction, viewportWidth)
          pinchZoomRemainderRef.current += direction * threshold
        }
      }

      lastGestureScaleRef.current = nextScale
    }

    function onGestureEnd(event){
      event.preventDefault()
      lastGestureScaleRef.current = 1
      pinchZoomRemainderRef.current = 0
    }

    node.addEventListener("gesturestart", onGestureStart, { passive: false })
    node.addEventListener("gesturechange", onGestureChange, { passive: false })
    node.addEventListener("gestureend", onGestureEnd, { passive: false })

    return ()=>{
      node.removeEventListener("gesturestart", onGestureStart)
      node.removeEventListener("gesturechange", onGestureChange)
      node.removeEventListener("gestureend", onGestureEnd)
    }
  },[maxScale, minScale, viewport, width])

  return {
    bind: {
      ref
    }
  }
}
