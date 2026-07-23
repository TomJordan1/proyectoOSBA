import { memo } from 'react'

interface KannyOrbProps {
  /** Ojos cerrados (modo dormido) o abiertos con pupilas que siguen el cursor */
  sleeping?: boolean
  /** Clases extra para el contenedor .loader (ej. escala) */
  className?: string
}

/**
 * Orbe de fluidos "Kanny" (liquid loader) con ojos.
 * El clipping SVG se declara una sola vez de forma global (ver <ClippingDefs />).
 * Las pupilas se mueven mediante el hook global de eye-tracking en App.
 */
function KannyOrb({ sleeping = false, className = '' }: KannyOrbProps) {
  return (
    <div className={`loader ${className}`}>
      <div className="box" />
      <div className="kanny-eyes">
        {sleeping ? (
          <>
            <span className="kanny-eye--sleep" />
            <span className="kanny-eye--sleep" />
          </>
        ) : (
          <>
            <div className="kanny-eye">
              <span className="kanny-pupil" />
            </div>
            <div className="kanny-eye">
              <span className="kanny-pupil" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default memo(KannyOrb)

/**
 * Definición del mask SVG usado por todos los orbes (url(#clipping)).
 * Debe renderizarse una única vez en el árbol.
 */
export const ClippingDefs = memo(function ClippingDefs() {
  const points = '50,13 18,80 82,80'
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <mask id="clipping">
          {Array.from({ length: 7 }).map((_, i) => (
            <polygon key={i} points={points} />
          ))}
        </mask>
      </defs>
    </svg>
  )
})
