import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
]

export default function ScrollDrivenNavigation() {
  const [active, setActive] = useState('home')
  const clickLockRef = useRef<number | null>(null)
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.22,
  })
  const glowX = useTransform(smoothProgress, [0, 0.35, 0.7, 1], ['-12vw', '72vw', '12vw', '78vw'])
  const glowY = useTransform(smoothProgress, [0, 1], ['8vh', '78vh'])
  const glowScale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1.15, 0.8])

  const handleNavClick = useCallback((sectionId: string) => {
    // Lock the active state to the clicked section and ignore observer
    // updates while the smooth scroll is in progress.
    if (clickLockRef.current) window.clearTimeout(clickLockRef.current)
    setActive(sectionId)
    clickLockRef.current = window.setTimeout(() => {
      clickLockRef.current = null
    }, 1200)
  }, [])

  useEffect(() => {
    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => Boolean(element),
    )

    const computeActive = () => {
      // Skip if a click-lock is active (smooth scroll in progress)
      if (clickLockRef.current) return

      const scrollBottom = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (window.scrollY < window.innerHeight * 0.3) {
        setActive('home')
        return
      }

      if (docHeight - scrollBottom < window.innerHeight * 0.25) {
        setActive(SECTIONS[SECTIONS.length - 1].id)
        return
      }

      // Find the section whose top is closest to (but above) the viewport center
      const viewportCenter = window.scrollY + window.innerHeight * 0.35
      let closest: string | null = null
      let closestDist = Infinity

      for (const el of elements) {
        const top = el.offsetTop
        const dist = Math.abs(top - viewportCenter)
        if (top <= viewportCenter + window.innerHeight * 0.3 && dist < closestDist) {
          closestDist = dist
          closest = el.id
        }
      }

      if (closest) setActive(closest)
    }

    const onScroll = () => {
      computeActive()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    computeActive()

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.07),transparent_70%)] md:block"
        style={{ x: glowX, y: glowY, scale: glowScale }}
        aria-hidden="true"
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-white/[0.04]" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_14px_rgba(34,211,238,0.75)]"
          style={{ scaleX: smoothProgress }}
        />
      </div>

      <nav
        className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2 xl:flex"
        aria-label="Navegación por las cuatro secciones"
      >
        {SECTIONS.map((section) => {
          const isActive = active === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => handleNavClick(section.id)}
              className="group flex min-h-8 items-center justify-end gap-3 rounded-full px-2 outline-none"
              aria-current={isActive ? 'location' : undefined}
              aria-label={`Ir a ${section.label}`}
            >
              <motion.span
                className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200"
                animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {section.label}
              </motion.span>
              <motion.span
                className="block rounded-full border border-cyan-200/30 bg-slate-950/80"
                animate={{
                  width: isActive ? 20 : 8,
                  height: 8,
                  backgroundColor: isActive ? '#22d3ee' : 'rgba(15,23,42,.8)',
                  boxShadow: isActive ? '0 0 16px rgba(34,211,238,.8)' : '0 0 0 rgba(0,0,0,0)',
                }}
                whileHover={{ scale: 1.25, borderColor: 'rgba(103,232,249,.8)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </a>
          )
        })}
      </nav>
    </>
  )
}
