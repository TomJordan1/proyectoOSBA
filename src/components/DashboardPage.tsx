import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Clock3,
  Coffee,
  Download,
  Grid2X2,
  HeartPulse,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import KannyOrb from './KannyOrb'

interface DashboardPageProps {
  email: string
  onLogout: () => void
}

type Period = '7 días' | '30 días'

type NavigationItem = {
  id: string
  label: string
  icon: typeof Grid2X2
}

const EASE = [0.16, 1, 0.3, 1] as const

const NAVIGATION: NavigationItem[] = [
  { id: 'dashboard-overview', label: 'Resumen', icon: Grid2X2 },
  { id: 'dashboard-rhythm', label: 'Ritmo', icon: LineChart },
  { id: 'dashboard-states', label: 'Estados', icon: BrainCircuit },
  { id: 'dashboard-activity', label: 'Actividad', icon: Activity },
]

const METRICS = [
  { label: 'Tiempo en foco', value: '4h 28m', change: '+18%', positive: true, icon: Clock3, sparkline: 'M2 35 C13 34 15 10 28 14 S43 28 54 15 S72 7 86 18 S101 33 118 10' },
  { label: 'Sesiones saludables', value: '12', change: '+3 hoy', positive: true, icon: HeartPulse, sparkline: 'M2 28 C15 5 22 36 34 20 S49 8 60 25 S77 34 89 12 S106 9 118 17' },
  { label: 'Pausas realizadas', value: '6', change: '92% meta', positive: true, icon: Coffee, sparkline: 'M2 34 C18 30 18 18 32 20 S50 8 62 12 S75 29 88 20 S103 8 118 11' },
  { label: 'Eventos de fricción', value: '3', change: '-24%', positive: true, icon: Zap, sparkline: 'M2 9 C14 13 20 28 32 20 S47 34 60 25 S74 10 87 16 S103 30 118 34' },
]

const CHARTS: Record<Period, { line: string; area: string; labels: string[]; value: string; delta: string }> = {
  '7 días': {
    line: 'M12 166 C38 154 43 118 73 124 S111 158 139 141 S174 111 205 120 S241 145 271 113 S306 70 337 83 S372 123 403 105 S438 132 469 112 S503 64 535 70 S570 45 601 59 S637 101 668 89 S704 70 742 82',
    area: 'M12 166 C38 154 43 118 73 124 S111 158 139 141 S174 111 205 120 S241 145 271 113 S306 70 337 83 S372 123 403 105 S438 132 469 112 S503 64 535 70 S570 45 601 59 S637 101 668 89 S704 70 742 82 L742 196 L12 196 Z',
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    value: '4h 28m',
    delta: '+18%',
  },
  '30 días': {
    line: 'M12 151 C45 136 59 151 92 130 S145 105 178 116 S224 147 259 119 S308 91 344 102 S393 127 430 91 S480 50 518 76 S568 103 608 73 S684 44 742 62',
    area: 'M12 151 C45 136 59 151 92 130 S145 105 178 116 S224 147 259 119 S308 91 344 102 S393 127 430 91 S480 50 518 76 S568 103 608 73 S684 44 742 62 L742 196 L12 196 Z',
    labels: ['1 Jun', '5 Jun', '10 Jun', '15 Jun', '20 Jun', '25 Jun', '30 Jun'],
    value: '87h 16m',
    delta: '+11%',
  },
}

const TOP_SESSIONS = [
  { title: 'Flujo profundo', subtitle: 'Mejor sesión · 52 min', value: '2h 12m', icon: BrainCircuit, color: 'text-violet-300', background: 'bg-violet-400/10' },
  { title: 'Ritmo normal', subtitle: '6 sesiones estables', value: '68%', icon: Activity, color: 'text-cyan-300', background: 'bg-cyan-400/10' },
  { title: 'Pausas saludables', subtitle: 'Meta diaria superada', value: '92%', icon: Coffee, color: 'text-emerald-300', background: 'bg-emerald-400/10' },
]

const RECENT_ACTIVITY = [
  { title: 'Sesión de concentración completada', detail: '52 minutos · proyecto principal', time: 'Hace 12 min', icon: Sparkles, tone: 'text-violet-300 bg-violet-400/10' },
  { title: 'Pausa saludable registrada', detail: '8 minutos · recuperación óptima', time: 'Hace 1 h', icon: Coffee, tone: 'text-emerald-300 bg-emerald-400/10' },
  { title: 'Patrón de flujo detectado', detail: 'Ritmo estable durante 42 minutos', time: 'Hace 3 h', icon: Activity, tone: 'text-cyan-300 bg-cyan-400/10' },
]

function ProgressRing({ value, color, label }: { value: number; color: string; label: string }) {
  const reducedMotion = useReducedMotion()
  const radius = 19
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)

  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth="3" />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : 0.35, ease: EASE }}
        />
      </svg>
      <span className="absolute text-[10px] font-black text-white">{value}%</span>
    </div>
  )
}

function MetricSparkline({ path, positive }: { path: string; positive: boolean }) {
  const reducedMotion = useReducedMotion()
  return (
    <svg viewBox="0 0 120 42" className="mt-4 h-9 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        stroke={positive ? '#22d3ee' : '#fb7185'}
        strokeWidth="2"
        strokeLinecap="round"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={{ duration: reducedMotion ? 0 : 0.75, delay: reducedMotion ? 0 : 0.2, ease: EASE }}
      />
    </svg>
  )
}

export default function DashboardPage({ email, onLogout }: DashboardPageProps) {
  const reducedMotion = useReducedMotion()
  const [activeSection, setActiveSection] = useState('dashboard-overview')
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('7 días')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const chart = CHARTS[period]
  const userName = email.split('@')[0] || 'usuario'
  const userInitial = userName.charAt(0).toUpperCase()

  const navigateTo = (id: string) => {
    setActiveSection(id)
    setMobileNavigationOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const downloadReport = () => {
    const rows = [
      ['Métrica', 'Valor', 'Cambio'],
      ...METRICS.map((metric) => [metric.label, metric.value, metric.change]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kanny-reporte-${period.replace(' ', '-')}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="relative z-10 min-h-screen bg-[#090a10] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-white/[0.07] bg-[#0d0e15] py-5 lg:flex" aria-label="Navegación del dashboard">
        <a href="#home" className="mb-8 grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-violet-400/10" aria-label="Volver al sitio">
          <span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_#22d3ee]" />
        </a>
        <nav className="flex w-full flex-1 flex-col items-center gap-2">
          {NAVIGATION.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id
            return (
              <button key={id} type="button" onClick={() => navigateTo(id)} className={`group relative grid h-11 w-11 place-items-center rounded-xl transition-colors duration-300 ${active ? 'bg-violet-400/15 text-violet-200' : 'text-slate-600 hover:bg-white/[0.04] hover:text-slate-200'}`} aria-label={label} aria-current={active ? 'page' : undefined}>
                {active && <span className="absolute -left-[19px] h-7 w-1 rounded-r-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,.7)]" />}
                <Icon className="h-[18px] w-[18px]" />
                <span className="pointer-events-none absolute left-14 z-50 rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">{label}</span>
              </button>
            )
          })}
        </nav>
        <div className="flex flex-col items-center gap-2">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-200" aria-label="Configuración"><Settings className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={onLogout} className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300" aria-label="Cerrar sesión"><LogOut className="h-[18px] w-[18px]" /></button>
        </div>
      </aside>

      <div className="lg:pl-20">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090a10]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <button type="button" onClick={() => setMobileNavigationOpen((current) => !current)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] text-slate-300 lg:hidden" aria-label={mobileNavigationOpen ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={mobileNavigationOpen}>
              {mobileNavigationOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <label className="flex min-h-10 max-w-md flex-1 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 transition-colors focus-within:border-violet-300/35">
              <Search className="h-4 w-4 shrink-0 text-slate-600" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" placeholder="Buscar métricas, sesiones..." aria-label="Buscar en el dashboard" />
              {search && <button type="button" onClick={() => setSearch('')} className="text-slate-600 hover:text-white" aria-label="Limpiar búsqueda"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:text-slate-200" aria-label="Notificaciones">
                <Bell className="h-4 w-4" /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-violet-400 ring-2 ring-[#0c0d13]" />
              </button>
              <div className="hidden h-7 w-px bg-white/[0.07] sm:block" />
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 text-xs font-black text-slate-950">{userInitial}</span>
                <div className="hidden sm:block"><p className="max-w-32 truncate text-xs font-bold text-white">{userName}</p><p className="text-[10px] text-slate-600">Cuenta personal</p></div>
              </div>
            </div>
          </div>

          {mobileNavigationOpen && (
            <nav className="mx-auto mt-3 grid max-w-[1500px] grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-[#11121a] p-3 lg:hidden" aria-label="Navegación móvil del dashboard">
              {NAVIGATION.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => navigateTo(id)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${activeSection === id ? 'bg-violet-400/15 text-violet-200' : 'text-slate-400 hover:bg-white/[0.04]'}`}><Icon className="h-4 w-4" />{label}</button>)}
              <button type="button" onClick={onLogout} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-rose-300/10 px-3 py-2.5 text-xs font-semibold text-rose-300"><LogOut className="h-4 w-4" />Cerrar sesión</button>
            </nav>
          )}
        </header>

        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: EASE }} className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <section id="dashboard-overview" className="scroll-mt-24" aria-labelledby="dashboard-title">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300"><ShieldCheck className="h-3.5 w-3.5" /> Procesamiento local activo</div>
                <h1 id="dashboard-title" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Hola, {userName}.</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Tu ritmo de trabajo se mantiene estable hoy.</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500"><CalendarDays className="h-4 w-4 text-violet-300" /> Actualizado hoy, 14:32</div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
              <div className="min-w-0 space-y-4">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas principales">
                  {METRICS.map(({ label, value, change, positive, icon: Icon, sparkline }, index) => (
                    <motion.article key={label} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : index * 0.06, ease: EASE }} className="rounded-2xl border border-white/[0.07] bg-[#12131b] p-4 transition-colors duration-300 hover:border-violet-300/20">
                      <div className="flex items-start justify-between gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-slate-400"><Icon className="h-4 w-4" /></span><span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-black ${positive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{change}</span></div>
                      <p className="mt-4 text-2xl font-black tracking-tight text-white">{value}</p>
                      <p className="mt-1 text-[10px] font-medium text-slate-600">{label}</p>
                      <MetricSparkline path={sparkline} positive={positive} />
                    </motion.article>
                  ))}
                </section>

                <section id="dashboard-rhythm" className="scroll-mt-24 rounded-[1.4rem] border border-white/[0.07] bg-[#12131b] p-4 sm:p-6" aria-labelledby="rhythm-title">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Ritmo de concentración</p><h2 id="rhythm-title" className="mt-1.5 text-lg font-bold text-white">Energía sostenida</h2></div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button type="button" onClick={() => setPeriodMenuOpen((current) => !current)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3 text-[10px] font-semibold text-slate-300" aria-expanded={periodMenuOpen}>{period}<ChevronDown className="h-3.5 w-3.5" /></button>
                        {periodMenuOpen && <div className="absolute right-0 top-11 z-20 min-w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-1 shadow-2xl">{(['7 días', '30 días'] as Period[]).map((option) => <button key={option} type="button" onClick={() => { setPeriod(option); setPeriodMenuOpen(false) }} className={`block w-full rounded-lg px-3 py-2 text-left text-[10px] ${period === option ? 'bg-violet-400/15 text-violet-200' : 'text-slate-400 hover:bg-white/5'}`}>{option}</button>)}</div>}
                      </div>
                      <button type="button" onClick={downloadReport} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-[10px] font-black text-slate-900 transition hover:bg-white"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Descargar CSV</span></button>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end gap-3"><span className="text-2xl font-black text-white">{chart.value}</span><span className="mb-1 rounded-md bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">{chart.delta}</span></div>
                  <div className="mt-3 overflow-hidden" role="img" aria-label={`Gráfico de ritmo de concentración de los últimos ${period}`}>
                    <svg viewBox="0 0 754 220" className="h-56 w-full min-w-[620px]" preserveAspectRatio="none">
                      <defs><linearGradient id="focus-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b5cf6" stopOpacity="0.34" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient><linearGradient id="focus-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#22d3ee" /><stop offset="0.55" stopColor="#a78bfa" /><stop offset="1" stopColor="#67e8f9" /></linearGradient></defs>
                      {[42, 82, 122, 162, 202].map((y) => <line key={y} x1="12" x2="742" y1={y} y2={y} stroke="rgba(148,163,184,.10)" strokeDasharray="5 7" />)}
                      <motion.path key={`area-${period}`} d={chart.area} fill="url(#focus-area)" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.5 }} />
                      <motion.path key={`line-${period}`} d={chart.line} fill="none" stroke="url(#focus-line)" strokeWidth="2.5" strokeLinecap="round" initial={reducedMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducedMotion ? 0 : 0.85, ease: EASE }} />
                      <circle cx={period === '7 días' ? 535 : 608} cy={period === '7 días' ? 70 : 73} r="5" fill="#c4b5fd" stroke="#12131b" strokeWidth="4" />
                    </svg>
                    <div className="-mt-4 grid min-w-[620px] grid-cols-7 px-1 text-center text-[9px] text-slate-700">{chart.labels.map((label) => <span key={label}>{label}</span>)}</div>
                  </div>
                </section>

                <section id="dashboard-activity" className="scroll-mt-24 rounded-[1.4rem] border border-white/[0.07] bg-[#101118] p-4 sm:p-6" aria-labelledby="sessions-title">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Mejores resultados</p><h2 id="sessions-title" className="mt-1.5 text-lg font-bold text-white">Sesiones destacadas</h2></div><BarChart3 className="h-5 w-5 text-violet-300" /></div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {TOP_SESSIONS.map(({ title, subtitle, value, icon: Icon, color, background }) => <article key={title} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition-colors hover:border-white/[0.12]"><div className={`grid h-9 w-9 place-items-center rounded-xl ${background} ${color}`}><Icon className="h-4 w-4" /></div><p className="mt-5 text-sm font-bold text-white">{title}</p><p className="mt-1 text-[10px] text-slate-600">{subtitle}</p><p className={`mt-4 text-xl font-black ${color}`}>{value}</p></article>)}
                  </div>
                  <div className="mt-5 divide-y divide-white/[0.06]">
                    {RECENT_ACTIVITY.map(({ title, detail, time, icon: Icon, tone }) => <div key={title} className="flex items-center justify-between gap-4 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-200">{title}</p><p className="mt-1 truncate text-[10px] text-slate-600">{detail}</p></div></div><time className="shrink-0 text-[9px] text-slate-700">{time}</time></div>)}
                  </div>
                </section>
              </div>

              <aside id="dashboard-states" className="scroll-mt-24 self-start overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-[#111218] xl:sticky xl:top-24" aria-labelledby="states-title">
                <div className="border-b border-white/[0.06] p-5">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Distribución de estados</p><h2 id="states-title" className="mt-1.5 text-lg font-bold text-white">Balance de Kanny</h2></div><BrainCircuit className="h-5 w-5 text-violet-300" /></div>
                  <div className="relative mx-auto mt-5 aspect-square max-w-[230px]">
                    <svg viewBox="0 0 240 240" className="h-full w-full" role="img" aria-label="Radar de distribución de estados de Kanny">
                      {[86, 62, 38].map((radius) => <polygon key={radius} points={`120,${120-radius} ${120+radius},120 120,${120+radius} ${120-radius},120`} fill="none" stroke="rgba(148,163,184,.12)" />)}
                      <line x1="120" y1="26" x2="120" y2="214" stroke="rgba(148,163,184,.10)" /><line x1="26" y1="120" x2="214" y2="120" stroke="rgba(148,163,184,.10)" />
                      <motion.polygon points="120,43 194,120 120,189 59,120" fill="rgba(139,92,246,.28)" stroke="#a78bfa" strokeWidth="2" initial={reducedMotion ? false : { opacity: 0, scale: 0.65, transformOrigin: '120px 120px' }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : 0.2, ease: EASE }} />
                      <polygon points="120,62 173,120 120,168 78,120" fill="rgba(34,211,238,.15)" stroke="rgba(103,232,249,.7)" />
                    </svg>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[9px] font-semibold text-slate-500">Normal</span><span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-500">Flujo</span><span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-500">Break</span><span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-500">Erratic</span>
                  </div>
                </div>

                <div className="border-b border-white/[0.06] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Estado actual</p>
                  <div className="mt-4 flex items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center"><KannyOrb className="dashboard-kanny-orb" /></div><div><div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /><p className="text-lg font-black text-white">Normal</p></div><p className="mt-1 text-[10px] leading-relaxed text-slate-500">42 min de concentración estable.</p></div></div>
                  <button type="button" className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-left text-[10px] font-semibold text-slate-300 transition hover:border-cyan-300/20"><span className="flex items-center gap-2"><TimerReset className="h-4 w-4 text-cyan-300" />Programar pausa</span><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
                </div>

                <div className="space-y-3 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Indicadores</p>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"><ProgressRing value={86} color="#a78bfa" label="Calidad de foco" /><div><p className="text-xs font-bold text-white">Calidad de foco</p><p className="mt-1 text-[9px] text-slate-600">Máximo semanal 92%</p></div><span className="ml-auto text-lg font-black text-white">8.6</span></div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"><ProgressRing value={92} color="#22d3ee" label="Pausas cumplidas" /><div><p className="text-xs font-bold text-white">Pausas cumplidas</p><p className="mt-1 text-[9px] text-slate-600">6 de 7 sugeridas</p></div><span className="ml-auto text-lg font-black text-white">6</span></div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"><ProgressRing value={74} color="#34d399" label="Balance diario" /><div><p className="text-xs font-bold text-white">Balance diario</p><p className="mt-1 text-[9px] text-emerald-400">+12% esta semana</p></div><span className="ml-auto text-lg font-black text-white">7.4</span></div>
                </div>
              </aside>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  )
}
