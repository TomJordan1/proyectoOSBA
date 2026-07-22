# ADR-015: FinOps y control de llamadas al LLM

## Estado

Aceptada (2026-07-22). Formaliza `LAMINAR_FINOPS_ARCHITECTURE.md` como decisión y lo materializa en el backend.

## Contexto

Un agente que consultara el LLM ante cada evento de teclado, ratón o ventana sería caro, lento y convertiría AWS en punto único de fallo. El reto premia software funcional y uso responsable de AWS, y el equipo debe evitar consumir créditos innecesariamente.

## Decisión

El LLM es el motor principal de la decisión contextual, pero se protege con puertas locales y de servidor. Antes de cualquier invocación se aplican, en orden: idempotencia por `event_id`, guardas deterministas (quiet mode, contexto protegido, patrón estable, cooldown), cache-aside por banda abstracta, `ServerBudgetGate` (límite por hora/día + kill switch) y circuit breaker. Si cualquier puerta resuelve el caso, **no hay llamada al modelo**. Ante fallo o presupuesto agotado se responde con política local (`fallback: true`).

Valores iniciales (provisionales y configurables por entorno): `friction_threshold=0.78`, `sustained_windows=3`, `minimum_observation_minutes=3`, `decision_cooldown=15 min`, `recovery_cooldown=30 min`, `calls/device/day=30`, `calls/account/day=100`, `MAX_CALLS_PER_HOUR=20`, `max_output_tokens=180`, `decision_ttl=20 s`, `duración máxima=60 s`. Infra: API rate 1 req/s, burst 2, quota 1000/mes; Lambda reserved concurrency 2, timeout 8 s, memoria 256 MB; logs 3–7 días. `BEDROCK_ENABLED=false` y `KILL_SWITCH=false` por defecto.

Toda decisión lleva `decision_source` (`bedrock | cache | local_policy | mock`), `reason_code`, `expires_at` y `fallback`. Las métricas FinOps cuentan llamadas evitadas por contexto, cooldown y presupuesto, además de invocaciones, latencia y respuestas inválidas — **sin payloads ni contenido**.

## Consecuencias

### Positivas

- coste acotado y previsible; el corte real vive en la aplicación (AWS Budgets solo alerta);
- resiliencia: funciona sin AWS mediante fallback local;
- evidencia cuantificable de eficiencia (llamadas evitadas) para el criterio de innovación.

### Negativas

- más componentes que mantener y probar;
- los umbrales requieren calibración posterior con datos reales.

## Materialización y verificación

Implementado y probado en `backend/` (`ServerBudgetGate`, `DecisionCache`, `CircuitBreaker`, `IdempotencyStore`, `safety-guards`, `fallback`, `metrics`). 26 pruebas verdes cubren budget, cooldown, contexto protegido, expiración, acción desconocida, duración > 60 s, campos prohibidos, evento duplicado, fallo de proveedor, circuit breaker, cache hit y quiet mode.
