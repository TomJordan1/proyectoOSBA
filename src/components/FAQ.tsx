import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, MessageCircleQuestion } from 'lucide-react'
import SectionParticles from './SectionParticles'

const MODERN_EASE = [0.16, 1, 0.3, 1] as const
const FAQS = [
  { id: 'what-is-kanny', question: '¿Qué es Kanny y cómo funciona?', answer: 'Kanny es un asistente de bienestar digital que interpreta patrones de interacción para adaptar sus sugerencias a tu estado: AFK, Normal, Erratic o Break.' },
  { id: 'privacy', question: '¿Cómo maneja Kanny la privacidad de mis datos?', answer: 'El análisis prioriza la ejecución local. No registramos el contenido que escribes, no tomamos capturas y no vendemos perfiles de productividad.' },
  { id: 'custom-states', question: '¿Puedo personalizar los estados de Kanny?', answer: 'Sí. En Pro puedes ajustar sensibilidad, tiempos de sesión, frecuencia de sugerencias y las transiciones entre los cuatro estados.' },
  { id: 'teams', question: '¿Kanny funciona para equipos?', answer: 'El plan Enterprise incluye un dashboard de RRHH con tendencias agregadas y anónimas, pensado para cuidar el ritmo del equipo sin vigilar a las personas.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" data-scroll-section className="section-black relative isolate overflow-hidden px-6 py-20 md:py-24">
      <SectionParticles density={52} />
      <div data-scroll-layer data-speed="-0.12" className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_45%,rgba(14,165,233,0.10),transparent_34%)]" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr]">
        <div data-scroll-reveal data-axis="x" data-direction="-1">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200"><MessageCircleQuestion className="h-6 w-6" /></div>
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">FAQ</span>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">Preguntas claras. Respuestas honestas.</h2>
          <p className="mt-5 max-w-sm leading-relaxed text-slate-600 dark:text-slate-400">Todo lo importante sobre Kanny, su privacidad y cómo puede acompañarte.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((item, index) => {
            const isOpen = open === index
            const triggerId = `faq-trigger-${item.id}`
            const panelId = `faq-panel-${item.id}`
            return (
              <div key={item.id} data-gsap-faq-item>
                <div className={`interactive-card overflow-hidden rounded-2xl border backdrop-blur-xl ${isOpen ? 'border-cyan-500/30 bg-cyan-500/[0.06] dark:border-cyan-300/30 dark:bg-cyan-300/[0.07]' : 'border-black/[0.07] bg-white/80 dark:border-white/[0.08] dark:bg-slate-900/65'}`}>
                  <button id={triggerId} type="button" onClick={() => setOpen(isOpen ? null : index)} className="flex min-h-14 w-full items-center justify-between gap-5 px-6 py-5 text-left text-sm font-bold text-slate-900 outline-none dark:text-white" aria-expanded={isOpen} aria-controls={panelId}>
                    {item.question}<ChevronDown className={`h-4 w-4 shrink-0 text-cyan-600 transition-transform duration-500 dark:text-cyan-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && <motion.div id={panelId} role="region" aria-labelledby={triggerId} initial={{ height: 0, opacity: 0, filter: 'blur(8px)' }} animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }} exit={{ height: 0, opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.5, ease: MODERN_EASE }}><p className="px-6 pb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</p></motion.div>}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
