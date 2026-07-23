import { useEffect, useRef, useState } from 'react'

/**
 * Alterna entre una lista de textos con un fade suave (morphing text del Hero).
 * Devuelve el texto actual y si está en transición (para animar la opacidad).
 */
export function useMorphingText(
  words: string[],
  { interval = 3000, fade = 300, enabled = true } = {},
) {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!enabled || words.length <= 1) return

    const id = window.setInterval(() => {
      setFading(true)
      const t = window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setFading(false)
      }, fade)
      timers.current.push(t)
    }, interval)

    return () => {
      window.clearInterval(id)
      timers.current.forEach(window.clearTimeout)
      timers.current = []
    }
  }, [words, interval, fade, enabled])

  return { text: words[index], fading }
}
