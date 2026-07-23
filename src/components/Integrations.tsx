import { motion } from 'framer-motion'
import { Code2, TerminalSquare, Globe, MessagesSquare } from 'lucide-react'
import KannyOrb from './KannyOrb'

const INTEGRATIONS = [
  {
    icon: Code2,
    title: 'VS Code & JetBrains',
    desc: 'Detecta errores de sintaxis y paros prolongados.',
  },
  {
    icon: TerminalSquare,
    title: 'Terminal & CLI',
    desc: 'Interviene cuando se repiten comandos fallidos.',
  },
  {
    icon: Globe,
    title: 'Navegadores Web',
    desc: 'Frena el cambio caótico de pestañas.',
  },
  {
    icon: MessagesSquare,
    title: 'Slack & Teams',
    desc: 'Silencia notificaciones durante la pausa.',
  },
]

export default function Integrations() {
  return (
    <section
      id="integraciones"
      className="min-h-screen flex items-center px-6 py-24 relative"
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
        <motion.div
          className="w-full flex items-center justify-center min-h-[300px] order-2 md:order-1"
          data-kanny-orb="integrations"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <KannyOrb className="scale-110" />
        </motion.div>

        <motion.div
          className="space-y-6 order-1 md:order-2"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="text-xs font-bold text-lindy-cyan uppercase tracking-widest">
            Conectividad sin fricción
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Funciona encima de todas tus herramientas de trabajo
          </h2>
          <p className="text-slate-400 text-sm font-light">
            Kanny no reemplaza tu IDE ni tu navegador; vive como un agente ligero
            sobre cualquier sistema operativo.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {INTEGRATIONS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass-panel p-4 rounded-xl border border-slate-800 transition-all hover:border-cyan-500/40 hover:-translate-y-1"
              >
                <Icon className="w-5 h-5 text-cyan-400 mb-2" />
                <h4 className="text-white font-semibold text-sm">{title}</h4>
                <p className="text-slate-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
