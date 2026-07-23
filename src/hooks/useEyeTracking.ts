import { useEffect } from 'react'

/**
 * Mueve las pupilas (.kanny-pupil) de TODOS los orbes Kanny presentes en el DOM
 * en dirección al cursor, replicando el comportamiento del landing original.
 */
export function useEyeTracking(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onMove = (e: MouseEvent) => {
      const pupils = document.querySelectorAll<HTMLElement>('.kanny-pupil')
      pupils.forEach((pupil) => {
        const rect = pupil.getBoundingClientRect()
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
        const angle = Math.atan2(e.y - center.y, e.x - center.x)
        const distance = Math.min(
          4,
          Math.hypot(e.x - center.x, e.y - center.y) / 50,
        )
        const moveX = Math.cos(angle) * distance
        const moveY = Math.sin(angle) * distance
        pupil.style.transform = `translate(${moveX}px, ${moveY}px)`
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [enabled])
}
