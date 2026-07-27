import { Download, ShieldCheck, Info, MonitorSmartphone, Sparkles } from 'lucide-react'
import KannyOrb from './KannyOrb'

// El instalador se aloja en S3. La descarga es directa desde esta URL pública.
const DOWNLOAD_URL = 'https://kandace-downloads.s3.us-east-1.amazonaws.com/KandaceSetup.exe'

const STEPS = [
  { title: 'Descarga el instalador', text: 'Pulsa el botón para bajar KandaceSetup.exe.' },
  { title: 'Ábrelo', text: 'Haz doble clic en el instalador descargado, normalmente en tu carpeta Descargas.' },
  { title: '“Windows protegió su PC”', text: 'Es un aviso normal para apps nuevas. Pulsa “Más información” y luego “Ejecutar de todos modos”.' },
  { title: 'Sigue el asistente', text: 'Siguiente → Instalar → Finalizar. Se crea el acceso directo en tu escritorio y en el menú Inicio.' },
]

const PRIVACY = [
  'Nunca registra qué teclas pulsas ni el texto que escribes.',
  'Nunca lee títulos de ventana, procesos ni páginas que visitas.',
  'Solo cuenta señales abstractas de ritmo de trabajo, en tu propia máquina.',
]

export default function InstallSection() {
  return (
    <section id="download" data-scroll-section className="relative px-6 pb-24 pt-24 md:pt-32">
      <div
        data-scroll-layer
        data-speed="0.16"
        className="pointer-events-none absolute left-1/2 top-1/3 z-[1] h-[34rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(6,182,212,0.1),transparent_70%)] dark:bg-[radial-gradient(ellipse,rgba(6,182,212,0.14),transparent_70%)]"
      />

      <div data-scroll-reveal className="relative z-10 mx-auto mb-12 max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">Download</span>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl dark:text-white">Instala a Kanny en tu escritorio</h2>
        <p className="mx-auto mt-5 max-w-xl text-slate-600 dark:text-slate-400">
          Tu acompañante de bienestar, privado por diseño. Descárgalo, ábrelo y Kanny estará contigo en segundos.
        </p>
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Tarjeta de descarga con el acompañante */}
        <div
          data-scroll-reveal
          data-axis="x"
          data-direction="-1"
          className="rounded-[2rem] border border-black/10 bg-white/90 p-8 text-center shadow-2xl dark:border-white/10 dark:bg-slate-900/90"
        >
          <div className="mx-auto h-52 w-52 sm:h-60 sm:w-60"><KannyOrb state="normal" /></div>
          <a
            href={DOWNLOAD_URL}
            download
            className="glow-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1"
          >
            <Download className="h-4 w-4" /> Descargar instalador
          </a>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <MonitorSmartphone className="h-3.5 w-3.5" /> Windows 10 u 11 (64 bits) · instalador guiado
          </p>
        </div>

        {/* Pasos + aviso SmartScreen */}
        <div data-scroll-reveal data-axis="x" data-direction="1" className="flex flex-col gap-6">
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-600 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{step.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.09] p-5 dark:border-amber-300/25 dark:bg-amber-300/[0.07]">
            <p className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
              <Info className="h-4 w-4" /> ¿Aparece “Windows protegió su PC”?
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Es la advertencia normal de Windows para apps nuevas sin firma digital. <b>No es un virus.</b> Pulsa
              <b> “Más información”</b> y luego <b>“Ejecutar de todos modos”</b>. Solo hay que hacerlo la primera vez.
            </p>
          </div>
        </div>
      </div>

      {/* Franja de privacidad */}
      <div
        data-scroll-reveal
        className="relative z-10 mx-auto mt-10 max-w-6xl rounded-[2rem] border border-black/10 bg-white/70 p-8 backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
      >
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
          <ShieldCheck className="h-4 w-4" /> Privado por diseño
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PRIVACY.map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
