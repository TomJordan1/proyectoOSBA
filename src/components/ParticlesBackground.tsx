import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const SETTINGS = {
  quantity: 156,
  interactionRadius: 150,
  dprCap: 1.5,
}

type PointerState = {
  x: number
  y: number
  active: number
}

class Particle {
  x = 0
  y = 0
  depth = 1
  size = 1
  velocityX = 0
  velocityY = 0

  constructor(width: number, height: number) {
    this.reset(width, height)
  }

  reset(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.depth = Math.random() * 0.75 + 0.25
    this.size = Math.random() * 1.55 + 0.4
    this.velocityX = (Math.random() - 0.5) * (0.12 + this.depth * 0.24)
    this.velocityY = (Math.random() - 0.5) * (0.12 + this.depth * 0.24)
  }

  update(pointer: PointerState, width: number, height: number, delta: number) {
    const dx = pointer.x - this.x
    const dy = pointer.y - this.y
    const distance = Math.hypot(dx, dy)
    const radius = SETTINGS.interactionRadius * (0.75 + this.depth * 0.35)

    if (pointer.active > 0.01 && distance > 0 && distance < radius) {
      const force = (1 - distance / radius) * this.depth * pointer.active
      this.velocityX -= (dx / distance) * force * 0.055 * delta
      this.velocityY -= (dy / distance) * force * 0.055 * delta
    }

    this.velocityX *= Math.pow(0.992, delta)
    this.velocityY *= Math.pow(0.992, delta)
    this.x += this.velocityX * delta
    this.y += this.velocityY * delta

    if (this.x < -10) this.x = width + 10
    if (this.x > width + 10) this.x = -10
    if (this.y < -10) this.y = height + 10
    if (this.y > height + 10) this.y = -10
  }

  draw(context: CanvasRenderingContext2D, isDark: boolean) {
    context.beginPath()
    context.arc(this.x, this.y, this.size * this.depth, 0, Math.PI * 2)
    const alpha = this.depth * (isDark ? 0.42 : 0.32) + (isDark ? 0.12 : 0.08)
    context.fillStyle = isDark ? `rgba(103, 232, 249, ${alpha})` : `rgba(14, 116, 144, ${alpha})`
    context.fill()
  }
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const primaryGlowRef = useRef<HTMLDivElement>(null)
  const secondaryGlowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const primaryGlow = primaryGlowRef.current
    const secondaryGlow = secondaryGlowRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !primaryGlow || !secondaryGlow) return

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const pointer: PointerState = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: 0 }
    let reducedMotion = reducedMotionQuery.matches
    let coarsePointer = coarsePointerQuery.matches
    let visible = !document.hidden
    let width = window.innerWidth
    let height = window.innerHeight
    let particles: Particle[] = []
    let needsStaticDraw = true
    let isDark = document.documentElement.classList.contains('dark')

    gsap.set([primaryGlow, secondaryGlow], { xPercent: -50, yPercent: -50 })
    gsap.set(primaryGlow, { x: pointer.x, y: pointer.y })
    gsap.set(secondaryGlow, { x: pointer.x, y: pointer.y })

    const pointerX = gsap.quickTo(pointer, 'x', { duration: 0.5, ease: 'power3.out' })
    const pointerY = gsap.quickTo(pointer, 'y', { duration: 0.5, ease: 'power3.out' })
    const pointerActive = gsap.quickTo(pointer, 'active', { duration: 0.35, ease: 'power2.out' })
    const primaryX = gsap.quickTo(primaryGlow, 'x', { duration: 0.45, ease: 'power3.out' })
    const primaryY = gsap.quickTo(primaryGlow, 'y', { duration: 0.45, ease: 'power3.out' })
    const secondaryX = gsap.quickTo(secondaryGlow, 'x', { duration: 1.1, ease: 'power3.out' })
    const secondaryY = gsap.quickTo(secondaryGlow, 'y', { duration: 1.1, ease: 'power3.out' })

    const draw = () => {
      context.clearRect(0, 0, width, height)
      for (const particle of particles) particle.draw(context, isDark)
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, SETTINGS.dprCap)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const quantity = reducedMotion ? 52 : Math.min(SETTINGS.quantity, Math.max(68, Math.round(width / 9)))
      particles = Array.from({ length: quantity }, () => new Particle(width, height))
      needsStaticDraw = true
    }

    const tick = (_time: number, deltaTime: number) => {
      if (!visible) return
      if (reducedMotion) {
        if (needsStaticDraw) {
          draw()
          needsStaticDraw = false
        }
        return
      }

      const delta = Math.min(deltaTime / 16.667, 2)
      context.clearRect(0, 0, width, height)
      for (const particle of particles) {
        particle.update(pointer, width, height, delta)
        particle.draw(context, isDark)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion || coarsePointer) return
      pointerX(event.clientX)
      pointerY(event.clientY)
      pointerActive(1)
      primaryX(event.clientX)
      primaryY(event.clientY)
      secondaryX(event.clientX)
      secondaryY(event.clientY)
    }

    const onPointerLeave = () => pointerActive(0)
    const onVisibilityChange = () => {
      visible = !document.hidden
      if (visible) needsStaticDraw = true
    }
    const onMotionPreference = () => {
      reducedMotion = reducedMotionQuery.matches
      needsStaticDraw = true
      resize()
    }
    const onPointerPreference = () => {
      coarsePointer = coarsePointerQuery.matches
      pointerActive(0)
    }

    // El color de las partículas depende del tema activo (clase `dark` en <html>).
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
      needsStaticDraw = true
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    resize()
    gsap.ticker.add(tick)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    reducedMotionQuery.addEventListener('change', onMotionPreference)
    coarsePointerQuery.addEventListener('change', onPointerPreference)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reducedMotionQuery.removeEventListener('change', onMotionPreference)
      coarsePointerQuery.removeEventListener('change', onPointerPreference)
      themeObserver.disconnect()
      gsap.killTweensOf([pointer, primaryGlow, secondaryGlow])
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div ref={secondaryGlowRef} className="absolute left-0 top-0 h-[42rem] w-[42rem] rounded-full bg-blue-600/[0.04] blur-[130px] will-change-transform motion-reduce:left-1/2 motion-reduce:top-1/2 dark:bg-blue-600/[0.07]" />
      <div ref={primaryGlowRef} className="absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.06] blur-[95px] will-change-transform motion-reduce:left-1/2 motion-reduce:top-1/2 dark:bg-cyan-400/[0.10]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
