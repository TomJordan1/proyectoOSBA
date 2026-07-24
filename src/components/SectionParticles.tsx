import { useEffect, useRef } from 'react'

interface SectionParticlesProps {
  className?: string
  density?: number
}

interface Dot {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
}

export default function SectionParticles({
  className = '',
  density = 44,
}: SectionParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !host || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let dots: Dot[] = []
    let width = 0
    let height = 0
    let frame = 0
    let intersecting = false
    let isDark = document.documentElement.classList.contains('dark')

    const createDots = () => {
      const amount = window.innerWidth < 768 ? Math.round(density * 0.65) : density
      dots = Array.from({ length: amount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.45,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        alpha: Math.random() * 0.45 + 0.18,
      }))
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      createDots()
      draw(true)
    }

    const draw = (staticFrame = false) => {
      context.clearRect(0, 0, width, height)
      for (const dot of dots) {
        if (!staticFrame) {
          dot.x += dot.vx
          dot.y += dot.vy
          if (dot.x < 0 || dot.x > width) dot.vx *= -1
          if (dot.y < 0 || dot.y > height) dot.vy *= -1
        }
        context.beginPath()
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
        context.fillStyle = isDark ? `rgba(103, 232, 249, ${dot.alpha})` : `rgba(14, 116, 144, ${dot.alpha})`
        context.fill()
      }
    }

    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const animate = () => {
      draw()
      frame = requestAnimationFrame(animate)
    }

    const syncAnimation = () => {
      stop()
      if (reducedMotion.matches) {
        draw(true)
      } else if (intersecting && !document.hidden) {
        animate()
      }
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting
        syncAnimation()
      },
      { threshold: 0.01 },
    )
    const resizeObserver = new ResizeObserver(resize)
    const onVisibilityChange = () => syncAnimation()
    const onMotionChange = () => syncAnimation()
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
      draw(true)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    resize()
    intersectionObserver.observe(host)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', onVisibilityChange)
    reducedMotion.addEventListener('change', onMotionChange)

    return () => {
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reducedMotion.removeEventListener('change', onMotionChange)
      themeObserver.disconnect()
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
    />
  )
}
