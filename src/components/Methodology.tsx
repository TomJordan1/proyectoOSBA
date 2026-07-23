import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import KannyOrb from './KannyOrb'

const FEATURES = [
  {
    title: 'Monitoreo de Fricción Local',
    desc: 'Analiza los patrones de tecleo sin guardar ni transmitir tu texto.',
  },
  {
    title: 'Pausas Cognitivas de 10 Segundos',
    desc: 'Congela temporalmente el entorno para reiniciar los niveles de dopamina.',
  },
]

export default function Methodology() {
  return (
    <section
      id="metodologia"
      className="min-h-screen flex items-center px-6 py-24 relative"
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
        <motion.div
          className="glass-panel p-8 md:p-10 rounded-3xl space-y-6 border border-slate-700/50 relative z-10"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="text-xs font-bold text-lindy-cyan uppercase tracking-widest">
            Metodología de regeneración
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Elimina el ciclo de frustración y borrados impulsivos
          </h2>
          <p className="text-slate-400 leading-relaxed font-light">
            Cuando un error bloquea tu código, la tasa de borrado con{' '}
            <code className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300 text-xs">
              Backspace
            </code>{' '}
            aumenta drásticamente. Kanny lo detecta silenciosamente e interviene.
          </p>

          <div className="space-y-4 pt-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{f.title}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="w-full flex items-center justify-center min-h-[300px]"
          data-kanny-orb="methodology"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <KannyOrb className="scale-110" />
        </motion.div>
      </div>
    </section>
  )
}
