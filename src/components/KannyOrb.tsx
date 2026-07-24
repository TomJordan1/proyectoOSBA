import { memo, useRef } from 'react'
import type { KannyStateName } from '../lib/kannyEngine'
import { useKannyEngine } from '../hooks/useKannyEngine'

interface KannyOrbProps {
  /** Ojos entrecerrados (modo dormido), sin cambiar el estado del cuerpo */
  sleeping?: boolean
  /** Estado de comportamiento de Kanny: afk | normal | erratic | break */
  state?: KannyStateName
  /** Clases extra para el contenedor .kanny-orb (controla el tamaño vía Tailwind) */
  className?: string
}

/**
 * Orbe animado "Kanny" renderizado en <canvas>: cuerpo de cristal con
 * wobble orgánico, partículas internas físicas y ojos que siguen el cursor.
 */
function KannyOrb({ sleeping = false, state = 'normal', className = '' }: KannyOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useKannyEngine(canvasRef, { state, sleeping })

  return (
    <div className={`kanny-orb ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} style={{ filter: 'drop-shadow(0 0 60px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 120px rgba(0, 0, 0, 0.5))' }} />
    </div>
  )
}

export default memo(KannyOrb)
