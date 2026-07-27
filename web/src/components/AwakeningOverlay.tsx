import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import KannyOrb from './KannyOrb'

interface AwakeningOverlayProps {
  onTransitionStart: () => void
  onArrive: () => void
}

interface Destination {
  x: number
  y: number
  scale: number
}

export default function AwakeningOverlay({
  onTransitionStart,
  onArrive,
}: AwakeningOverlayProps) {
  const [awake, setAwake] = useState(false)
  const [moving, setMoving] = useState(false)
  const [destination, setDestination] = useState<Destination>({ x: 0, y: 0, scale: 1 })
  const orbSlotRef = useRef<HTMLDivElement>(null)
  const wakeTimer = useRef<number>()
  const moveTimer = useRef<number>()
  const didWake = useRef(false)
  const didArrive = useRef(false)

  const moveToHero = useCallback(() => {
    onTransitionStart()

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const source = orbSlotRef.current?.getBoundingClientRect()
        const target = document.getElementById('hero-kanny-target')?.getBoundingClientRect()

        if (!source || !target) {
          onArrive()
          return
        }

        setDestination({
          x: target.left + target.width / 2 - (source.left + source.width / 2),
          y: target.top + target.height / 2 - (source.top + source.height / 2),
          scale: target.width / source.width,
        })
        setMoving(true)
      })
    })
  }, [onArrive, onTransitionStart])

  const wakeUp = useCallback(() => {
    if (didWake.current) return
    didWake.current = true
    setAwake(true)
    moveTimer.current = window.setTimeout(moveToHero, 380)
  }, [moveToHero])

  useEffect(() => {
    wakeTimer.current = window.setTimeout(wakeUp, 2000)
    return () => {
      if (wakeTimer.current) window.clearTimeout(wakeTimer.current)
      if (moveTimer.current) window.clearTimeout(moveTimer.current)
    }
  }, [wakeUp])

  const completeJourney = () => {
    if (!moving || didArrive.current) return
    didArrive.current = true
    onArrive()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[#05070c]"
        animate={{ opacity: moving ? 0 : 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.13),transparent_38%)]"
        animate={{ opacity: moving ? 0 : 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      <motion.div
        ref={orbSlotRef}
        className="relative z-10 flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80"
        animate={
          moving
            ? { x: destination.x, y: destination.y, scale: destination.scale }
            : awake
              ? { scale: [1, 1.07, 1] }
              : { y: [0, -7, 0] }
        }
        transition={
          moving
            ? { duration: 1.15, ease: [0.22, 1, 0.36, 1] }
            : awake
              ? { duration: 0.36 }
              : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
        onAnimationComplete={completeJourney}
      >
        <motion.div
          className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.32),transparent_70%)]"
          animate={awake ? { opacity: 0.85, scale: 1.35 } : { opacity: 0.22, scale: 0.82 }}
          transition={{ duration: 0.7 }}
        />
        <KannyOrb sleeping={!awake} state={awake ? 'normal' : 'afk'} />
      </motion.div>
    </div>
  )
}
