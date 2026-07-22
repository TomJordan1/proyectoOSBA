import type { ReasonCode } from "../domain/types.js";

// Explicaciones breves y no clínicas, generadas localmente a partir del reason_code.
export const EXPLANATIONS: Record<ReasonCode, string> = {
  STABLE_PATTERN: "Patrón estable. No es necesario intervenir.",
  SUSTAINED_FRICTION_CONTEXT_AVAILABLE: "Se detectó fricción sostenida y no hay una actividad protegida.",
  PROTECTED_CONTEXT: "Contexto protegido activo. La intervención se pospone.",
  QUIET_MODE: "Modo No molestar activo.",
  COOLDOWN_ACTIVE: "Intervención reciente. Se respeta el periodo de espera.",
  PENDING_RECOVERY_RESUMED: "Terminó el contexto protegido. Se retoma la sugerencia pendiente.",
  SERVER_BUDGET_LIMIT: "Límite de uso alcanzado. Se resuelve localmente.",
  PROVIDER_ERROR_FALLBACK: "El motor de decisión no está disponible. Política local aplicada.",
  INVALID_MODEL_RESPONSE_FALLBACK: "Respuesta no válida del motor. Política local aplicada.",
  UNKNOWN_ACTION_DOWNGRADED: "Acción no reconocida. Se degrada de forma segura.",
};
