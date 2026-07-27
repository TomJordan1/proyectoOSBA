// Llamadas a la API de Kandace (canal de agregación). Usa el token de la sesión y
// la organización del usuario (viene en el token). Content-blind: solo agregados.

import { API_BASE_URL, getSession } from './auth'

export interface Recommendation {
  code: string
  message: string
}

export interface TeamSummary {
  team_id: string
  period_start: string
  period_end: string
  contributor_count: number
  privacy_status: string
  avg_friction?: number
  trend?: string
  helpful_rate?: number
  confidence?: string
  recommendations?: Recommendation[]
}

/** Resumen agregado y anónimo del equipo, para la organización del usuario logueado. */
export async function fetchTeamSummary(team = 'backend'): Promise<TeamSummary> {
  const session = getSession()
  if (!session) throw new Error('No hay sesión activa.')

  const end = new Date()
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000) // últimos 7 días
  const qs = new URLSearchParams({
    organization_id: session.organizationId,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
  })

  const res = await fetch(`${API_BASE_URL}/teams/${encodeURIComponent(team)}/summary?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${session.idToken}` },
  })
  if (res.status === 401) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
  if (res.status === 403) throw new Error('No tienes acceso a los datos de esa organización.')
  if (!res.ok) throw new Error(`No se pudo cargar el resumen (${res.status}).`)
  return (await res.json()) as TeamSummary
}
