
import React, { useEffect, useRef, useState } from "react"
import { useTrackpadTimeline } from "../hooks/useTrackpadTimeline"

const WIDTH=640
const HEIGHT=520
const DISSOLVE_MS = 180
const KEYBOARD_MOTION_MS = 180
const BASE_CELL_WIDTH = 120

export function ViewportSVG({children, stationaryChildren, config, viewport: vp, getStepZoomScale}){
  const [isDissolving,setIsDissolving] = useState(false)
  const [keyboardPanOffsetPx,setKeyboardPanOffsetPx] = useState(0)
  const [keyboardZoomScale,setKeyboardZoomScale] = useState(1)
  const [isKeyboardTransformTransitioning,setIsKeyboardTransformTransitioning] = useState(false)
  const previousUnitIndexRef = useRef(vp.unitIndex)
  const keyboardTransformFrameRef = useRef(null)
  const keyboardTransformTimeoutRef = useRef(null)
  const { bind } = useTrackpadTimeline(vp, {
    width: WIDTH,
    minScale: config?.zoomLower ?? 0.5,
    maxScale: config?.zoomUpper ?? 2
  })

  function clearKeyboardTransformAnimation(){
    if(keyboardTransformFrameRef.current){
      window.cancelAnimationFrame(keyboardTransformFrameRef.current)
      keyboardTransformFrameRef.current = null
    }

    if(keyboardTransformTimeoutRef.current){
      window.clearTimeout(keyboardTransformTimeoutRef.current)
      keyboardTransformTimeoutRef.current = null
    }
  }

  function finishKeyboardTransformAnimation(){
    setIsKeyboardTransformTransitioning(true)
    setKeyboardPanOffsetPx(0)
    setKeyboardZoomScale(1)
    keyboardTransformTimeoutRef.current = window.setTimeout(()=>{
      setIsKeyboardTransformTransitioning(false)
      keyboardTransformTimeoutRef.current = null
    }, KEYBOARD_MOTION_MS)
  }

  function startKeyboardPanAnimation(deltaUnits){
    const cellWidth = BASE_CELL_WIDTH * vp.zoom
    if(!Number.isFinite(cellWidth) || cellWidth <= 0) {
      vp.panUnits(deltaUnits)
      return
    }

    clearKeyboardTransformAnimation()
    setIsKeyboardTransformTransitioning(false)
    setKeyboardPanOffsetPx(deltaUnits * cellWidth)
    setKeyboardZoomScale(1)
    vp.panUnits(deltaUnits)

    keyboardTransformFrameRef.current = window.requestAnimationFrame(finishKeyboardTransformAnimation)
  }

  function startKeyboardZoomAnimation(delta){
    const startScale = getStepZoomScale(delta)
    if(startScale === null){
      vp.stepUnit(delta, { readable: true })
      return
    }

    clearKeyboardTransformAnimation()
    setIsKeyboardTransformTransitioning(false)
    setKeyboardPanOffsetPx(0)
    setKeyboardZoomScale(startScale)
    vp.stepUnit(delta, { readable: true })

    keyboardTransformFrameRef.current = window.requestAnimationFrame(finishKeyboardTransformAnimation)
  }

  useEffect(()=>{
    if(previousUnitIndexRef.current === vp.unitIndex) return undefined

    previousUnitIndexRef.current = vp.unitIndex
    setIsDissolving(true)

    const timeoutId = window.setTimeout(()=>{
      setIsDissolving(false)
    }, DISSOLVE_MS)

    return ()=> window.clearTimeout(timeoutId)
  },[vp.unitIndex])

  useEffect(()=>{
    return ()=>{
      clearKeyboardTransformAnimation()
    }
  },[])

  useEffect(()=>{
    function isTypingTarget(target){
      if(!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      )
    }

    function onKeyDown(event){
      if(isTypingTarget(event.target)) return

      if(event.key === "ArrowUp"){
        event.preventDefault()
        startKeyboardZoomAnimation(1)
      }

      if(event.key === "ArrowDown"){
        event.preventDefault()
        startKeyboardZoomAnimation(-1)
      }

      if(event.key === "ArrowLeft"){
        event.preventDefault()
        startKeyboardPanAnimation(-1)
      }

      if(event.key === "ArrowRight"){
        event.preventDefault()
        startKeyboardPanAnimation(1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return ()=> window.removeEventListener("keydown", onKeyDown)
  },[vp])

  return (
    <svg {...bind}
         width={WIDTH}
         height={HEIGHT}
         style={{
           touchAction: "none",
           overscrollBehavior: "none",
           WebkitUserSelect: "none",
           userSelect: "none"
         }}>
      <g
        transform={`translate(${WIDTH/2+vp.worldOffsetPx},0)`}
        style={{
          opacity: isDissolving ? 0.72 : 1,
          filter: isDissolving ? "blur(1.5px)" : "blur(0px)",
          transition: `opacity ${DISSOLVE_MS}ms ease, filter ${DISSOLVE_MS}ms ease`
        }}
      >
        {stationaryChildren}
        <g
          style={{
            transform: `translate(${keyboardPanOffsetPx}px, 0px) scaleX(${keyboardZoomScale})`,
            transformOrigin: "0px 0px",
            willChange: isKeyboardTransformTransitioning ? "transform" : "auto",
            transition: isKeyboardTransformTransitioning
              ? `transform ${KEYBOARD_MOTION_MS}ms ease`
              : "none"
          }}
        >
          {children}
        </g>
      </g>
    </svg>
  )
}
