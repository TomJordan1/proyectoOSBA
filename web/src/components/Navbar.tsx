import { useEffect, useState } from 'react'
import { Download, LayoutDashboard, LogIn, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#methodology', label: 'Methodology' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 16)

  useEffect(() => {
    let frame = 0
    const updateNavbar = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 16)
        frame = 0
      })
    }

    updateNavbar()
    window.addEventListener('scroll', updateNavbar, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateNavbar)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const closeMenu = () => setOpen(false)
  const hasSurface = scrolled || open

  return (
    <header
      className={`pointer-events-auto fixed inset-x-0 top-0 z-[90] w-full border-b px-5 py-3.5 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
        hasSurface
          ? 'border-black/[0.06] bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-slate-950/80 dark:shadow-[0_12px_40px_rgba(2,6,23,0.28)]'
          : 'border-transparent bg-transparent shadow-none backdrop-blur-none'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="#home" onClick={closeMenu} className="flex items-center gap-2.5" aria-label="Kandace, ir al inicio">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 dark:border-cyan-300/20 dark:bg-cyan-400/10"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_12px_#22d3ee] dark:bg-cyan-300" /></span>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">Kandace<span className="text-cyan-500 dark:text-cyan-300">.</span></span>
        </a>

        <nav className="hidden items-center gap-7 text-xs font-semibold text-slate-500 dark:text-slate-400 md:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="rounded-md py-2 transition-colors duration-300 hover:text-cyan-600 dark:hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:grid" />
          <a href="#/login" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-200" aria-label="Ir a iniciar sesión">
            <LogIn className="h-3.5 w-3.5" /><span className="hidden lg:inline">Iniciar sesión</span>
          </a>
          <a href="#/dashboard" className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-2.5 text-xs font-bold text-cyan-700 transition duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/15 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:border-cyan-200/50 dark:hover:bg-cyan-300/15" aria-label="Ir al dashboard">
            <LayoutDashboard className="h-3.5 w-3.5" /><span className="hidden xl:inline">Dashboard</span>
          </a>
          <a href="#download" className="glow-button hidden items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition duration-300 hover:bg-cyan-300 lg:inline-flex"><Download className="h-3.5 w-3.5" />Download</a>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/40 text-slate-700 md:hidden dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="mx-auto mt-3 grid max-w-6xl gap-1 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-2xl md:hidden dark:border-white/10 dark:bg-slate-950/95" aria-label="Navegación móvil">
          {NAV_LINKS.map((link) => <a key={link.href} href={link.href} onClick={closeMenu} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-black/5 hover:text-cyan-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-cyan-200">{link.label}</a>)}
          <div className="mt-1 flex items-center justify-between rounded-xl px-4 py-2 sm:hidden">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tema</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  )
}
