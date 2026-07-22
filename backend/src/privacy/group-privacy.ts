import type { PrivacyStatus } from "../domain/team-types.js";

export interface PrivacyOptions {
  minimumGroupSizeDemo: number;      // 5 (demo)
  recommendedProductionGroupSize: number; // 8
  dashboardDelayMinutes: number;     // 60
  retentionDays: number;             // 30
}

export const DEFAULT_PRIVACY: PrivacyOptions = {
  minimumGroupSizeDemo: 5,
  recommendedProductionGroupSize: 8,
  dashboardDelayMinutes: 60,
  retentionDays: 30,
};

/**
 * Determina el estado de privacidad de un grupo. Con grupo insuficiente NO se
 * deben devolver métricas (solo el estado). K=5 no garantiza anonimato perfecto.
 */
export function resolvePrivacyStatus(
  contributorCount: number,
  opts: PrivacyOptions,
  isDelayed: boolean,
): PrivacyStatus {
  if (contributorCount <= 0) return "unavailable";
  if (contributorCount < opts.minimumGroupSizeDemo) return "insufficient_group";
  if (isDelayed) return "delayed";
  return "visible";
}
