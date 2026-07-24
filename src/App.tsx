import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import ParticlesBackground from './components/ParticlesBackground'
import AwakeningOverlay from './components/AwakeningOverlay'
import KandaceExperience from './components/KandaceExperience'
import Navbar from './components/Navbar'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import DashboardPage from './components/DashboardPage'
import ScrollDrivenNavigation from './components/ScrollDrivenNavigation'
import { useLandingScrollAnimations } from './hooks/useLandingScrollAnimations'

type Route = 'landing' | 'login' | 'dashboard'

function getRoute(): Route {
  if (window.location.hash === '#/login') return 'login'
  if (window.location.hash === '#/dashboard') return 'dashboard'
  return 'landing'
}

const BLOCKED_SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Space'])

export default function App() {
  const landingScopeRef = useRef<HTMLDivElement>(null)
  const [route, setRoute] = useState<Route>(getRoute)
  const [landingVisible, setLandingVisible] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [introVisible, setIntroVisible] = useState(true)
  const [cinematicComplete, setCinematicComplete] = useState(false)
  const [email, setEmail] = useState(() => window.sessionStorage.getItem('kandace-demo-email') ?? '')

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (route !== 'landing' || cinematicComplete) return

    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousOverscroll = html.style.overscrollBehavior
    const previousTouchAction = body.style.touchAction
    const preventScroll = (event: Event) => event.preventDefault()
    const preventKeyScroll = (event: KeyboardEvent) => {
      if (BLOCKED_SCROLL_KEYS.has(event.code)) event.preventDefault()
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.touchAction = 'none'
    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('keydown', preventKeyScroll)

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      html.style.overscrollBehavior = previousOverscroll
      body.style.touchAction = previousTouchAction
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('keydown', preventKeyScroll)
    }
  }, [cinematicComplete, route])

  useLandingScrollAnimations(landingScopeRef, route === 'landing' && cinematicComplete)

  const revealLanding = useCallback(() => setLandingVisible(true), [])
  const finishIntro = useCallback(() => {
    setHeroReady(true)
    window.requestAnimationFrame(() => setIntroVisible(false))
    window.setTimeout(() => setCinematicComplete(true), 1450)
  }, [])

  const login = (userEmail: string) => {
    window.sessionStorage.setItem('kandace-demo-email', userEmail)
    setEmail(userEmail)
    window.location.hash = '/dashboard'
  }

  const logout = () => {
    window.sessionStorage.removeItem('kandace-demo-email')
    setEmail('')
    window.location.hash = '/login'
  }

  return (
    <>
      <ParticlesBackground />

      {route === 'login' && <LoginPage onLogin={login} />}
      {route === 'dashboard' && (email ? <DashboardPage email={email} onLogout={logout} /> : <LoginPage onLogin={login} />)}

      {route === 'landing' && (
        <>
          {introVisible && <AwakeningOverlay onTransitionStart={revealLanding} onArrive={finishIntro} />}
          {cinematicComplete && <ScrollDrivenNavigation />}
          <motion.div
            className="relative z-[70]"
            initial={false}
            animate={{ opacity: heroReady ? 1 : 0 }}
            style={{ pointerEvents: heroReady ? 'auto' : 'none' }}
            transition={{ duration: 0.7, delay: heroReady ? 0.12 : 0, ease: [0.16, 1, 0.3, 1] }}
          >
            <Navbar />
          </motion.div>
          <motion.div
            ref={landingScopeRef}
            data-gsap-scope="landing"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: landingVisible ? 1 : 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <main><KandaceExperience heroReady={heroReady} /><Pricing /><FAQ /></main>
            <Footer />
          </motion.div>
        </>
      )}
    </>
  )
}
