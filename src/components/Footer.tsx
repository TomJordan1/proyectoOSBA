import { Github, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-white/[0.07] bg-slate-950/45 px-6 py-14 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <a href="#home" className="text-xl font-black text-white">Kandace<span className="text-cyan-300">.</span></a>
          <h2 className="mt-6 max-w-lg text-2xl font-bold text-white">¿Tienes dudas o sugerencias?</h2>
          <a href="mailto:support@kandace.io" className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-100">
            <Mail className="h-4 w-4" /> support@kandace.io
          </a>
        </div>
        <div className="md:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Social media</p>
          <div className="mt-5 flex gap-3 md:justify-end">
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200"><Linkedin className="h-4 w-4" /></a>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200"><Github className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Kandace. Todos los derechos reservados.</p>
        <p>Calm technology for healthier work.</p>
      </div>
    </footer>
  )
}
