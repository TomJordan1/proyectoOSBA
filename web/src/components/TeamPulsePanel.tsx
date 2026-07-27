import { useEffect, useState } from 'react'
import { Activity, Lightbulb, Minus, ShieldCheck, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { fetchTeamSummary, type TeamSummary } from '../lib/api'

function band(value?: number): string {
  if (value == null) return '—'
  if (value >= 0.7) return 'Elevada'
  if (value >= 0.55) return 'Moderada'
  return 'Baja'
}

function TrendBadge({ trend }: { trend?: string }) {
  if (trend === 'increasing') return <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300"><TrendingUp className="h-3.5 w-3.5" /> Subiendo</span>
  if (trend === 'decreasing') return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300"><TrendingDown className="h-3.5 w-3.5" /> Bajando</span>
  return <span className="inline-flex items-center gap-1 text-slate-500"><Minus className="h-3.5 w-3.5" /> Estable</span>
}

/** Pulso agregado y anónimo del equipo, con DATOS REALES desde la API. */
export default function TeamPulsePanel() {
  const [data, setData] = useState<TeamSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchTeamSummary('backend')
      .then((summary) => { if (alive) setData(summary) })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Error al cargar.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const visible = data?.privacy_status === 'visible'

  return (
    <section className="mb-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.04] p-5 dark:border-cyan-300/20" aria-label="Pulso del equipo (datos reales)">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
          <Activity className="h-3.5 w-3.5" /> Pulso del equipo · datos reales (backend)
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-600 dark:text-emerald-300"><ShieldCheck className="h-3 w-3" /> anónimo</span>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando pulso del equipo…</p>}

      {!loading && error && (
        <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-600 dark:text-rose-300">{error}</p>
      )}

      {!loading && !error && data && !visible && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aún no hay suficientes datos para mostrar el pulso del equipo (contribuyentes: <b>{data.contributor_count}</b>, mínimo 5 por privacidad de grupo). Se irá llenando con el uso del agente.
        </p>
      )}

      {!loading && !error && data && visible && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-black/[0.06] bg-white/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500"><Users className="h-3 w-3" /> Contribuyentes</div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{data.contributor_count}</p>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase text-slate-500">Fricción agregada</div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{band(data.avg_friction)}</p>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase text-slate-500">Tendencia</div>
              <p className="mt-1 text-sm font-bold"><TrendBadge trend={data.trend} /></p>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white/70 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase text-slate-500">Feedback útil</div>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{Math.round((data.helpful_rate ?? 0) * 100)}%</p>
            </div>
          </div>

          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mt-3 space-y-2">
              {data.recommendations.map((rec) => (
                <div key={rec.code} className="flex items-start gap-2 rounded-xl border-l-2 border-violet-400 bg-white/60 px-3 py-2 text-xs text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-300" />
                  <span>{rec.message}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
