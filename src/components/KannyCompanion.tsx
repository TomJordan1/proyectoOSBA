import { motion } from 'framer-motion'
import KannyOrb from './KannyOrb'

export default function KannyCompanion() {
  return (
    <motion.aside
      id="kanny-companion-shell"
      className="kanny-companion fixed bottom-[12%] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3 pointer-events-none"
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.7, type: 'spring' }}
      aria-label="Kanny, tu asistente de concentración"
    >
      <div className="rounded-full border border-cyan-300/20 bg-slate-950/45 p-3 shadow-[0_0_40px_rgba(34,211,238,0.18)] backdrop-blur-xl">
        <KannyOrb className="companion-orb" />
      </div>
      <div className="hidden rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200 shadow-xl backdrop-blur md:block">
        Kanny está contigo
      </div>
    </motion.aside>
  )
}
