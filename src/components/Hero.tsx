import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import KannyOrb from './KannyOrb'
import { useMorphingText } from '../hooks/useMorphingText'

const MORPH_WORDS = [
  'salud mental y flujo',
  'calma cognitiva local',
  'enfoque libre de burnout',
  'Kanny.AI',
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: 'easeOut' },
  }),
}

export default function Hero() {
  const { text, fading } = useMorphingText(MORPH_WORDS)

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center relative"
    >
      {/* Orbe Kanny en Hero */}
      <motion.div
        className="w-32 h-32 flex items-center justify-center mb-6 relative"
        data-kanny-orb="hero"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <KannyOrb />
      </motion.div>

      <motion.div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium mb-8"
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        <Sparkles className="w-3.5 h-3.5" />
        Conoce a Kanny 2.0: Tu nuevo copiloto de calma y rendimiento
      </motion.div>

      <motion.h1
        className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6"
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        Conoce a tu agente de{' '}
        <span className="lindy-gradient-text">
          <span
            className="transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {text}
          </span>
        </span>
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed mb-10"
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        Kanny analiza la entropía de tu tecleo en tiempo real, detecta la
        sobrecarga cognitiva y despliega micro-pausas que previenen el burnout.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16"
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <a
          href="#download"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm glow-button transition-all transform hover:scale-105"
        >
          Crear tu primer respiro gratis <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="#metodologia"
          className="px-8 py-4 rounded-full border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
        >
          Ver demo interactiva (2 min)
        </a>
      </motion.div>

      <HeroMockup />
    </section>
  )
}

function HeroMockup() {
  const stats = [
    {
      label: 'NIVEL DE ENTROPÍA',
      value: '12% (Calma)',
      valueClass: 'text-cyan-400',
      bar: 12,
    },
    {
      label: 'PULSACIONES / MIN',
      value: '120 BPM',
      valueClass: 'text-white',
      note: '✓ Ritmo constante',
      noteClass: 'text-emerald-400',
    },
    {
      label: 'TIEMPO DE FLUJO',
      value: '45 min',
      valueClass: 'text-white',
      note: 'Próxima pausa en 15m',
      noteClass: 'text-slate-400',
    },
  ]

  return (
    <motion.div
      className="w-full max-w-4xl glass-panel rounded-2xl p-4 shadow-2xl border border-slate-700/50 relative overflow-hidden mt-8"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          kanny-desktop-agent v2.4 — Active Monitoring
        </span>
        <div className="w-12" />
      </div>

      <div className="py-12 px-6 grid md:grid-cols-3 gap-6 text-left">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-slate-900/60 p-4 rounded-xl border border-slate-800"
          >
            <span className="text-xs text-slate-500 block mb-1">{s.label}</span>
            <span className={`text-2xl font-bold ${s.valueClass}`}>
              {s.value}
            </span>
            {s.bar !== undefined && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full"
                  style={{ width: `${s.bar}%` }}
                />
              </div>
            )}
            {s.note && (
              <span className={`text-xs block mt-1 ${s.noteClass}`}>
                {s.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
