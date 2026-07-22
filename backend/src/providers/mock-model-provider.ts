import type { AppConfig } from "../config.js";
import type { DecisionRequest, ModelProposal } from "../domain/types.js";
import type { ModelProvider } from "./model-provider.js";

/**
 * Proveedor determinista que emula el razonamiento del LLM eligiendo entre
 * varias herramientas según fricción, duración, preferencia y feedback.
 * NO afirma que Bedrock funcione: decision_source será "mock".
 *
 * Nota: el contexto protegido, quiet mode y cooldown se resuelven en las guardas
 * ANTES de llegar aquí (ahorro de llamadas), por lo que este proveedor asume
 * contexto disponible.
 */
export class MockModelProvider implements ModelProvider {
  readonly name = "mock" as const;
  constructor(private readonly config: AppConfig) {}

  async propose(request: DecisionRequest): Promise<ModelProposal> {
    const { friction, preferences, recent_feedback } = request;
    const sustainedEnough = friction.sustained_minutes >= this.config.sustainedWindows;
    const highFriction = friction.score >= this.config.frictionThreshold;

    if (!highFriction || !sustainedEnough) {
      return { action: "do_nothing", reason_code: "STABLE_PATTERN" };
    }

    // Si el usuario marcó recientemente falso positivo, ser más conservador.
    if (recent_feedback === "false_positive" || recent_feedback === "not_now") {
      return { action: "show_subtle_notification", arguments: { intensity: "low" }, reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" };
    }

    const wantsBubbles = preferences.preferred_recovery === "bubbles" && !preferences.reduced_motion;
    if (wantsBubbles) {
      const duration = Math.min(preferences.max_duration_seconds, this.config.maxRecoveryDurationSeconds);
      return {
        action: "launch_bubble_recovery",
        arguments: { duration_seconds: duration, intensity: "low" },
        reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
      };
    }

    return {
      action: "show_subtle_notification",
      arguments: { intensity: "low" },
      reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
    };
  }
}
