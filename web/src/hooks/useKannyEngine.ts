import { RefObject, useEffect, useRef } from 'react'
import { KannyEngine, KannyStateName } from '../lib/kannyEngine'

interface UseKannyEngineOptions {
  /** Estado inicial/actual del personaje. */
  state?: KannyStateName
  /** Ojos entrecerrados (modo dormido), sin cambiar el estado del cuerpo. */
  sleeping?: boolean
  /** Si es false, detiene el loop de animación (por defecto true). */
  active?: boolean
}

/**
 * Monta y anima un `KannyEngine` sobre un <canvas>, manejando resize con
 * ResizeObserver (alta densidad de píxeles incluida) y el ciclo de
 * requestAnimationFrame. Además, si el canvas expone `data-eye-tracking`,
 * las pupilas siguen al cursor dentro del propio bloque.
 */
export function useKannyEngine(
  canvasRef: RefObject<HTMLCanvasElement>,
  { state = 'normal', sleeping = false, active = true }: UseKannyEngineOptions = {},
) {
  const engineRef = useRef<KannyEngine | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)

  // Mount: create engine + observers once per canvas element.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const engine = new KannyEngine(canvas)
    engineRef.current = engine

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let lastWidth = 0
    let lastHeight = 0

    const resize = () => {
      // Measure the container (.kanny-orb), never the canvas itself: the
      // canvas' own box must not feed back into the value we observe,
      // otherwise mutating canvas.width/height below could retrigger the
      // observer and grow the canvas without bound.
      const rect = container.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      if (width === lastWidth && height === lastHeight) return
      lastWidth = width
      lastHeight = height

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      engine.resize(width, height)
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerRef.current = {
        x: event.clientX - (rect.left + rect.width / 2),
        y: event.clientY - (rect.top + rect.height / 2),
      }
    }
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      engineRef.current = null
    }
  }, [canvasRef])

  // Keep state/sleeping in sync without recreating the engine.
  useEffect(() => {
    engineRef.current?.setState(state)
  }, [state])

  useEffect(() => {
    engineRef.current?.setSleeping(sleeping)
  }, [sleeping])

  // Animation loop.
  useEffect(() => {
    if (!active) return

    let frame = 0
    const loop = () => {
      const engine = engineRef.current
      if (engine) {
        engine.update(pointerRef.current)
        engine.render()
      }
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)

    return () => window.cancelAnimationFrame(frame)
  }, [active])
}
