# LAMINAR — Arquitectura FinOps, control de llamadas y operación segura

**Estado:** propuesta para incorporar al repositorio  
**Objetivo:** construir el MVP agéntico sin consumir créditos innecesariamente, sin llamadas continuas al LLM y sin convertir AWS en un punto único de fallo.

## 1. Principio rector

Kandace no debe consultar un modelo por cada evento de teclado, ratón o ventana.

```text
Eventos frecuentes y baratos
        ↓
Procesamiento local determinista
        ↓
Agregación por ventanas
        ↓
Detección de anomalía sostenida
        ↓
Puertas de contexto, frecuencia y presupuesto
        ↓
Una llamada breve al LLM
        ↓
Decisión estructurada y validada
```

El LLM es el motor principal de la decisión contextual, pero no reemplaza sensores, filtros, validación ni políticas de seguridad.

## 2. Patrones utilizados

- Edge filtering / local-first.
- Event-driven architecture.
- Token bucket para limitar llamadas.
- Circuit breaker ante fallos o presupuesto.
- Bulkhead mediante concurrencia reservada.
- Cache-aside para decisiones equivalentes.
- Idempotency para impedir cobros duplicados.
- Graceful degradation con fallback local.
- Observability mediante métricas, no payloads.

## 3. Arquitectura lógica

```text
DESKTOP AGENT (.NET 8/WPF)
Sensors
  → MinuteAggregator
  → FrictionDetector
  → SustainedAnomalyGate
  → ContextGate
  → CooldownGate
  → LocalBudgetGate
  → DecisionCache
  → AgentApiClient

API GATEWAY REST
  → API key
  → usage plan
  → throttling
  → quota

LAMBDA TYPESCRIPT
  → schema validation
  → idempotency
  → ServerBudgetGate
  → deterministic safety guards
  → Bedrock adapter

BEDROCK
  → Converse API
  → tool use
  → short prompt
  → low maxTokens
```

Si una puerta local rechaza la solicitud, no existe llamada a AWS.

## 4. Siete puertas antes de Bedrock

### G1. Observación mínima

```text
minimum_observation_minutes = 3
```

### G2. Anomalía sostenida

```text
friction_score >= 0.78
durante >= 3 ventanas consecutivas
```

Valores provisionales y configurables.

### G3. Contexto

Si existe `quiet_mode`, `presentation_mode`, pantalla completa o intervención reciente, resolver localmente cuando la política sea inequívoca. El LLM se reserva para decisiones ambiguas o personalizadas.

### G4. Cooldown

```text
minimum_decision_cooldown_minutes = 15
minimum_recovery_cooldown_minutes = 30
```

### G5. Token bucket local

```text
capacity = 6 llamadas
refill = 1 llamada cada 20 minutos
daily_hard_limit = 30 llamadas
demo_daily_hard_limit = 100
```

### G6. Caché de decisión

Clave abstracta:

```text
friction_band + protected_context + cooldown_band +
preferred_recovery + recent_feedback_band
```

TTL inicial: 10 minutos.

### G7. Circuit breaker

Abrir con tres fallos consecutivos, latencia extrema, respuestas inválidas repetidas, `BUDGET_EXCEEDED` o HTTP 429 sostenido.

```text
failure_threshold = 3
open_duration_minutes = 10
```

## 5. Política de selección de modelo

No fijar un modelo por fama ni usar Opus como runtime para una decisión pequeña.

1. Crear 20–40 casos representativos.
2. Evaluar modelos disponibles en cuenta y región.
3. Comparar selección de herramienta, esquema, latencia, tokens y coste.
4. Elegir el modelo más barato que alcance los umbrales.

Candidatos iniciales:

- Amazon Nova Lite.
- Claude Haiku disponible en Bedrock.
- Modelo más capaz solo como fallback de evaluación.

Umbrales:

```text
tool_selection_accuracy >= 95 %
schema_validity >= 99 %
protected_context_errors = 0
p95_latency <= 3 segundos durante demo
```

## 6. Prompt y tokens

No enviar contenido, títulos, URL, historial largo ni documentación completa.

Enviar únicamente métricas, booleanos de contexto, cooldown, preferencia y feedback categórico.

```text
max_output_tokens = 180
temperature = 0
conversation_history = none
```

La explicación visible debe generarse localmente mediante `reason_code`.

## 7. Control de coste AWS

### API Gateway REST

```text
rate_limit = 1 request/second
burst_limit = 2
quota = 1000 requests/month
```

### Lambda

```text
reserved_concurrency = 2
timeout = 8 segundos
memory = 256 MB
```

No usar provisioned concurrency.

### Bedrock

- On-demand.
- Un modelo aprobado.
- Converse + tool use.
- Sin provisioned throughput.
- Sin AgentCore.
- Sin Knowledge Bases.
- Sin fine-tuning.
- Sin batch para el MVP.

### DynamoDB

- On-demand.
- TTL.
- Sin índices secundarios hasta necesitarlos.
- Máximo de throughput on-demand configurado cuando corresponda.
- Solo métricas agregadas.

### CloudWatch

- Retención 3–7 días.
- No guardar payloads.
- No activar model invocation logging con contenido.
- Métricas y alarmas mínimas.

### Budgets

Crear alertas de 1, 5 y 10 USD. AWS Budgets alerta, pero el corte real debe estar en la aplicación y Lambda.

## 8. ServerBudgetGate

Variables:

```text
MAX_CALLS_PER_HOUR=20
MAX_CALLS_PER_DAY=100
BEDROCK_ENABLED=false
KILL_SWITCH=false
```

Respuesta al superar presupuesto:

```json
{
  "action": "do_nothing",
  "reason_code": "SERVER_BUDGET_LIMIT",
  "fallback": true
}
```

Debe existir un kill switch que deshabilite Bedrock.

## 9. Idempotencia y reintentos

Cada anomalía recibe `event_id`. Una repetición devuelve la decisión previa sin invocar nuevamente Bedrock.

Cliente:

```text
máximo 1 reintento
backoff con jitter
no reintentar 400, 401, 403 o budget exceeded
```

## 10. Métricas FinOps

- LocalEventsProcessed
- AnomaliesDetected
- CallsPreventedByContext
- CallsPreventedByCooldown
- CallsPreventedByBudget
- DecisionCacheHits
- BedrockInvocations
- InputTokens
- OutputTokens
- EstimatedModelCost
- DecisionLatencyMs
- InvalidModelResponses
- FallbackCount

## 11. Fallback local

```text
contexto protegido → postpone
quiet mode → do_nothing
score alto y disponible → show_subtle_notification
otro caso → do_nothing
```

Registrar:

```text
decision_source = bedrock | cache | local_policy
```

## 12. Seguridad

- IAM restringido al modelo.
- No registrar prompt/respuesta completos.
- Validar entrada y salida.
- Revalidar contexto en desktop.
- Caducidad de decisión: 20 segundos.
- No ejecutar shell, comandos ni archivos.
- Nunca enviar eventos crudos.

## 13. Alcance

MVP:

- un modelo económico;
- una Lambda;
- un endpoint;
- cinco acciones;
- filtros locales;
- cooldown;
- límites;
- API throttling;
- Lambda reserved concurrency;
- fallback;
- métricas básicas.

Posterior:

- prompt caching;
- intelligent prompt routing;
- segundo modelo;
- RAG;
- MCP;
- AgentCore.

## 14. Criterios de aceptación

- [ ] Ningún evento individual genera una llamada.
- [ ] Contexto inequívoco se resuelve sin Bedrock.
- [ ] Límites local y servidor.
- [ ] Cooldown y circuit breaker.
- [ ] API throttling y quota.
- [ ] Lambda reserved concurrency.
- [ ] Kill switch.
- [ ] Límites de tokens.
- [ ] Idempotencia.
- [ ] Logs sin payload.
- [ ] Modo offline.
- [ ] Métricas de llamadas evitadas.
