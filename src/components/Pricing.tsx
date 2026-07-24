import { Check, Sparkles } from 'lucide-react'

const PLANS = [
  { name: 'Basic', price: '$0', description: 'Para usuarios individuales que quieren conocer a Kanny.', features: ['Estados AFK y Normal', 'Sugerencias de pausas', 'Procesamiento local'], cta: 'Empezar gratis' },
  { name: 'Pro', price: '$19', unit: '/mes', description: 'Acceso completo a todos los estados y métricas avanzadas.', features: ['Todo lo incluido en Basic', 'Estados Erratic y Break', 'Historial y métricas personales', 'Configuración avanzada'], cta: 'Obtener Pro', featured: true },
  { name: 'Enterprise', price: 'Personalizado', description: 'Integración para equipos completos con dashboard de RRHH.', features: ['Dashboard de bienestar', 'Tendencias agregadas', 'Despliegue administrado', 'Soporte prioritario'], cta: 'Contactar ventas' },
]

export default function Pricing() {
  return (
    <section id="pricing" data-scroll-section className="relative overflow-hidden px-6 py-20 md:py-24">
      <div data-scroll-layer data-speed="0.18" className="absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.05] blur-[120px] dark:bg-blue-500/[0.08]" />
      <div data-scroll-reveal className="mx-auto mb-10 max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">Pricing</span>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl dark:text-white">Empieza con calma. Crece a tu ritmo.</h2>
        <p className="mx-auto mt-5 max-w-xl text-slate-600 dark:text-slate-400">Sin contratos ni sorpresas. Elige el nivel de acompañamiento que necesitas.</p>
      </div>

      <div className="pricing-deck mx-auto grid max-w-6xl items-stretch gap-6 py-4 md:grid-cols-3 md:gap-7 lg:gap-8 md:[perspective:1200px]">
        {PLANS.map((plan, index) => (
          <div key={plan.name} data-gsap-pricing-card data-card-index={index} className="relative h-full [transform-style:preserve-3d] [contain:layout_style]">
            <article className={`pricing-card group relative min-h-[28rem] h-full rounded-[2rem] border p-7 shadow-2xl ${plan.featured ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.08] to-white/95 shadow-[0_25px_80px_rgba(6,182,212,0.1)] dark:border-cyan-300/35 dark:from-cyan-400/[0.13] dark:to-slate-950/95 dark:shadow-[0_25px_80px_rgba(6,182,212,0.18)]' : 'border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/90'}`}>
              {plan.featured && <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105 dark:bg-cyan-300 dark:text-slate-950"><Sparkles className="h-3 w-3" /> Recomendado</span>}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-7 flex items-end gap-1"><span className={`${plan.price.length > 5 ? 'text-3xl' : 'text-5xl'} font-black tracking-tight text-slate-900 dark:text-white`}>{plan.price}</span>{plan.unit && <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{plan.unit}</span>}</div>
              <p className="mt-5 min-h-[3rem] text-sm leading-relaxed text-slate-600 dark:text-slate-400">{plan.description}</p>
              <ul className="my-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />{feature}</li>)}</ul>
              <a href={plan.name === 'Enterprise' ? '#contact' : '#download'} className={`absolute bottom-7 left-7 right-7 rounded-xl px-5 py-3 text-center text-xs font-bold transition ${plan.featured ? 'glow-button bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:-translate-y-1' : 'border border-black/10 bg-black/[0.02] text-slate-700 hover:border-cyan-500/30 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-cyan-300/30 dark:hover:text-white'}`}>{plan.cta}</a>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
