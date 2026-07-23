import { FormEvent, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import KannyOrb from './KannyOrb'

interface LoginPageProps {
  onLogin: (email: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('demo@kandace.io')
  const [password, setPassword] = useState('kanny123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!validEmail || password.length < 6) {
      setError('Ingresa un correo válido y una contraseña de al menos 6 caracteres.')
      return
    }
    setError('')
    onLogin(email.trim())
  }

  return (
    <main className="relative z-10 min-h-screen overflow-hidden bg-[#05070c] px-5 py-8 text-slate-100">
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      <a href="#home" className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition hover:border-cyan-300/30 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Volver al sitio
      </a>

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl items-center gap-10 lg:grid-cols-2">
        <section className="hidden text-center lg:block" aria-label="Bienvenida de Kanny">
          <div className="mx-auto flex h-56 w-56 items-center justify-center">
            <KannyOrb className="login-kanny-orb" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Kanny te estaba esperando</p>
          <h1 className="mx-auto mt-4 max-w-md text-4xl font-black tracking-tight text-white">Tu bienestar, ahora en un solo lugar.</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">Consulta tus sesiones, patrones saludables y recomendaciones personalizadas desde el dashboard.</p>
        </section>

        <section className="interactive-card mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/75 p-7 shadow-2xl backdrop-blur-2xl sm:p-9">
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 lg:hidden"><LockKeyhole className="h-5 w-5" /></div>
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Dashboard Kandace</span>
            <h2 className="mt-3 text-3xl font-black text-white">Inicia sesión</h2>
            <p className="mt-2 text-sm text-slate-400">Accede a tu espacio personal con Kanny.</p>
          </div>

          <form onSubmit={submit} className="space-y-5" noValidate>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-300">Correo electrónico</span>
              <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-400/10">
                <Mail className="h-4 w-4 text-slate-500" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="tu@correo.com" autoComplete="email" />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-300">Contraseña</span>
              <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-400/10">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 transition hover:text-cyan-200" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs leading-relaxed text-rose-200" role="alert">{error}</p>}

            <button type="submit" className="glow-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-black text-white transition hover:-translate-y-0.5">
              Entrar al dashboard
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            Acceso demo local. Puedes usar las credenciales precargadas; no se envían datos a ningún servidor.
          </div>
        </section>
      </div>
    </main>
  )
}
