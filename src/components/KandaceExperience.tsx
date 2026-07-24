import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDown,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Coffee,
  Database,
  EyeOff,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import KannyOrb from './KannyOrb'
import SectionParticles from './SectionParticles'

const STATES = [
  { name: 'AFK', detail: 'Detecta inactividad sin interrumpirte.', icon: EyeOff, tone: 'text-slate-300' },
  { name: 'Normal', detail: 'Tu ritmo es estable y saludable.', icon: CheckCircle2, tone: 'text-cyan-300' },
  { name: 'Erratic', detail: 'Reconoce fricción y cambios bruscos.', icon: Activity, tone: 'text-amber-300' },
  { name: 'Break', detail: 'Sugiere una pausa en el momento justo.', icon: Coffee, tone: 'text-violet-300' },
]

const TRUST_SIGNALS = [
  { title: 'Local-first', detail: 'El análisis se diseña para ejecutarse en tu dispositivo.', icon: HardDrive },
  { title: 'Privacy by Design', detail: 'La privacidad forma parte de la arquitectura desde el inicio.', icon: Fingerprint },
  { title: 'Datos mínimos', detail: 'Solo se consideran las señales necesarias para acompañarte.', icon: Database },
  { title: 'Marco responsable', detail: 'Diseñado tomando como referencia principios de protección de datos.', icon: ShieldCheck },
]

const MODERN_EASE = [0.16, 1, 0.3, 1] as const

const reveal = {
  initial: { opacity: 0, y: 38, scale: 0.985 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: false, amount: 0.2 },
  transition: { duration: 0.95, ease: MODERN_EASE },
}

function InlineKanny({ from }: { from: 'left' | 'right' }) {
  return (
    <motion.div
      className="relative flex min-h-[15rem] items-center justify-center"
      initial={{
        opacity: 0,
        x: from === 'right' ? 150 : -150,
        scale: 0.94,
      }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1.05, ease: MODERN_EASE }}
      aria-hidden="true"
    >
      <div className="absolute h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative flex h-52 w-52 items-center justify-center">
        <KannyOrb state="normal" />
      </div>
    </motion.div>
  )
}

interface KandaceExperienceProps {
  heroReady: boolean
}

export default function KandaceExperience({ heroReady }: KandaceExperienceProps) {
  return (
    <>
      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-12 pt-24 text-center">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl flex-col items-center justify-center">
          <motion.div
            className="relative"
            initial={false}
            animate={{
              opacity: heroReady ? 1 : 0,
              clipPath: heroReady ? 'circle(160% at 50% 105%)' : 'circle(0% at 50% 105%)',
            }}
            transition={{ duration: 1.15, ease: MODERN_EASE }}
          >
            <motion.div
              animate={{ opacity: heroReady ? 1 : 0, y: heroReady ? 0 : 16, filter: heroReady ? 'blur(0px)' : 'blur(12px)' }}
              transition={{ duration: 0.75, delay: heroReady ? 0.06 : 0, ease: MODERN_EASE }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" /> Powered by Kandace
            </motion.div>
            <motion.h1
              animate={{ opacity: heroReady ? 1 : 0, y: heroReady ? 0 : 20, scale: heroReady ? 1 : 0.96, filter: heroReady ? 'blur(0px)' : 'blur(14px)' }}
              transition={{ duration: 0.85, delay: heroReady ? 0.18 : 0, ease: MODERN_EASE }}
              className="text-balance text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl md:text-7xl"
            >
              Conoce a <span className="lindy-gradient-text">Kanny</span>
            </motion.h1>
            <motion.p
              animate={{ opacity: heroReady ? 1 : 0, y: heroReady ? 0 : 18, filter: heroReady ? 'blur(0px)' : 'blur(10px)' }}
              transition={{ duration: 0.8, delay: heroReady ? 0.32 : 0, ease: MODERN_EASE }}
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg"
            >
              Tu asistente inteligente que protege tu atención, entiende tu ritmo y te acompaña paso a paso.
            </motion.p>
          </motion.div>

          <div id="hero-kanny-target" className="relative my-5 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
            <motion.div
              className="pointer-events-none absolute inset-3 rounded-full border border-cyan-200/30"
              initial={false}
              animate={heroReady ? { opacity: [0, 0.55, 0], scale: [0.35, 1.45, 1.7] } : { opacity: 0, scale: 0.35 }}
              transition={{ duration: 1.25, ease: MODERN_EASE }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{ opacity: heroReady ? 1 : 0 }}
              transition={{ duration: 0.08 }}
            >
              <div className="absolute inset-7 rounded-full bg-cyan-400/20 blur-[60px]" />
              <KannyOrb state="afk" />
            </motion.div>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: heroReady ? 1 : 0,
              clipPath: heroReady ? 'circle(160% at 50% -5%)' : 'circle(0% at 50% -5%)',
            }}
            transition={{ duration: 1.15, delay: heroReady ? 0.22 : 0, ease: MODERN_EASE }}
          >
            <motion.div
              animate={{ opacity: heroReady ? 1 : 0, y: heroReady ? 0 : 22, filter: heroReady ? 'blur(0px)' : 'blur(12px)' }}
              transition={{ duration: 0.8, delay: heroReady ? 0.42 : 0, ease: MODERN_EASE }}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <a id="download" href="#methodology" className="glow-button inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1">
                Probar Kanny <MousePointer2 className="h-4 w-4" />
              </a>
              <a href="#methodology" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
                Descubre cómo funciona <ArrowDown className="h-4 w-4" />
              </a>
            </motion.div>
            <motion.div
              animate={{ opacity: heroReady ? 1 : 0, y: heroReady ? 0 : 18, filter: heroReady ? 'blur(0px)' : 'blur(9px)' }}
              transition={{ duration: 0.8, delay: heroReady ? 0.58 : 0, ease: MODERN_EASE }}
              className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/30 px-5 py-3 text-xs text-slate-400 backdrop-blur"
            >
              <ShieldCheck className="h-4 w-4 text-cyan-300" /> Privado por diseño · cero vigilancia
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="methodology" data-scroll-section className="section-black relative isolate overflow-hidden px-6 py-20 md:py-24">
        <SectionParticles density={58} />
        <div data-scroll-layer data-speed="0.14" className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_70%_35%,rgba(6,182,212,0.10),transparent_36%)]" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div {...reveal}>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Methodology</span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Kanny puede leer el ritmo, no tu contenido.</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-slate-400">
              Analiza señales de interacción en tu dispositivo para reconocer cuándo estás en flujo, cuándo aparece fricción y cuándo conviene hacer una pausa.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="interactive-card glass-panel rounded-2xl p-5" tabIndex={0}>
                <BrainCircuit className="mb-3 h-6 w-6 text-cyan-300" />
                <strong className="block text-sm text-white">Entiende patrones</strong>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">Sin capturas, teclas registradas ni contenido en la nube.</span>
              </div>
              <div className="interactive-card glass-panel rounded-2xl p-5" tabIndex={0}>
                <Activity className="mb-3 h-6 w-6 text-cyan-300" />
                <strong className="block text-sm text-white">Interviene con calma</strong>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">Solo cuando una sugerencia puede ayudarte de verdad.</span>
              </div>
            </div>
          </motion.div>

          <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.1 }} className="interactive-card overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_30px_100px_rgba(2,132,199,0.16)] backdrop-blur-xl" tabIndex={0}>
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 font-mono text-[11px] text-slate-500">Kanny State Simulator.exe</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estado en tiempo real</p><p className="mt-1 text-sm font-semibold text-white">Sesión saludable · 42 min</p></div>
                <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Local</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {STATES.map(({ name, detail, icon: Icon, tone }) => (
                  <div key={name} className={`interactive-card rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 ${tone}`} tabIndex={0}>
                    <div className="flex items-center gap-3"><Icon className="h-5 w-5" /><span className="font-bold">{name}</span></div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="perspectives" className="px-6 py-20 md:py-24" aria-labelledby="solutions-title">
        <div className="mx-auto max-w-6xl">
          <motion.div {...reveal} className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Una experiencia, dos perspectivas</span>
            <h2 id="solutions-title" className="mt-3 text-4xl font-black text-white">Bienestar que también se puede comprender.</h2>
          </motion.div>

          <div className="space-y-6 md:space-y-8">
            <div className="grid items-stretch gap-6 md:grid-cols-2">
              <motion.article {...reveal} className="interactive-card glass-panel flex flex-col justify-center rounded-[2rem] p-8 md:p-12" tabIndex={0}>
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><BrainCircuit className="h-6 w-6" /></div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Para empleados</span>
                <h3 className="mt-3 text-3xl font-bold text-white">Recupera tu atención.</h3>
                <p className="mt-4 leading-relaxed text-slate-400">Kanny reduce la carga mental, detecta sesiones erráticas y te ayuda a gestionar pausas sin romper tu concentración.</p>
              </motion.article>
              <InlineKanny from="right" />
            </div>

            <div className="grid items-stretch gap-6 md:grid-cols-2">
              <InlineKanny from="left" />
              <motion.article {...reveal} className="interactive-card glass-panel flex flex-col justify-center rounded-[2rem] p-8 md:p-12" tabIndex={0}>
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300"><Users className="h-6 w-6" /></div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Para RRHH</span>
                <h3 className="mt-3 text-3xl font-bold text-white">Cuida el ritmo del equipo.</h3>
                <p className="mt-4 leading-relaxed text-slate-400">Obtén tendencias agregadas y claras en un dashboard interactivo, sin exponer la actividad privada de ninguna persona.</p>
              </motion.article>
            </div>
          </div>
        </div>
      </section>

      <section id="promise" className="px-6 py-20 md:py-24">
        <motion.div {...reveal} className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.09] via-slate-900/80 to-blue-500/[0.08] p-8 shadow-[0_30px_100px_rgba(6,182,212,0.1)] md:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><LockKeyhole className="h-8 w-8" /></div>
            <div><span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Our promise</span><h2 className="mt-3 text-3xl font-black text-white">Privacidad integrada desde el diseño.</h2><p className="mt-3 max-w-2xl leading-relaxed text-slate-400">Kandace limita la recolección de datos y prioriza el procesamiento local. No registra lo que escribes ni vende perfiles de productividad.</p></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4"><BarChart3 className="h-5 w-5 text-cyan-300" /><div><strong className="block text-sm text-white">Local-first</strong><span className="text-xs text-slate-500">Privacidad por defecto</span></div></div>
          </div>

          <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_SIGNALS.map(({ title, detail, icon: Icon }, index) => (
              <motion.article key={title} className="interactive-card rounded-2xl border border-white/[0.08] bg-slate-950/55 p-5 backdrop-blur" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: index * 0.08 }} tabIndex={0}>
                <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" /><h3 className="mt-4 text-sm font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</p>
              </motion.article>
            ))}
          </div>
          <p className="relative mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-slate-600">Marcos y principios de diseño · no representan certificaciones de terceros</p>
        </motion.div>
      </section>
    </>
  )
}
