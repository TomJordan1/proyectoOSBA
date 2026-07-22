# Backend — Orquestador de decisión LAMINAR (TypeScript)

Motor de decisión agéntico para API Gateway + Lambda. Content-blind: recibe solo métricas abstractas y contexto booleano. El LLM (Bedrock, vía `BedrockModelProvider`) es el motor principal; mientras `BEDROCK_ENABLED=false` se usa `MockModelProvider` determinista.

## Estructura

```text
src/
├── domain/types.ts            Tipos compartidos, enum canónico de 5 acciones, reason codes
├── config.ts                  Configuración por entorno (BEDROCK_ENABLED, límites, umbrales)
├── validation/schemas.ts      Esquemas ejecutables (copia de /contracts) + validadores ajv
├── providers/
│   ├── model-provider.ts       Interfaz ModelProvider + errores
│   ├── mock-model-provider.ts  Decisión determinista (decision_source = mock)
│   ├── bedrock-model-provider.ts  Esqueleto DESHABILITADO (no llama a AWS)
│   └── index.ts                selectProvider()
├── policies/                  Guardas y FinOps
│   ├── safety-guards.ts        preLlmGate + enforcePostLlm (defense in depth)
│   ├── budget-gate.ts          ServerBudgetGate (hora/día, kill switch)
│   ├── idempotency.ts          IdempotencyStore por event_id
│   ├── decision-cache.ts       Cache-aside por banda abstracta
│   ├── circuit-breaker.ts      CircuitBreaker
│   └── fallback.ts             Política local (§11 FinOps)
├── observability/metrics.ts   Métricas FinOps (contadores, sin payloads)
├── agent/decide.ts            DecisionEngine: orquesta todo el pipeline
└── handlers/                  decision.ts, feedback.ts (API Gateway proxy)
```

## Pipeline de decisión

1. Idempotencia por `event_id`.
2. Guardas previas al LLM (quiet mode, contexto protegido, estable, cooldown) → resuelven local sin llamar al modelo.
3. Cache-aside por banda abstracta.
4. `ServerBudgetGate` + kill switch.
5. `CircuitBreaker`.
6. Proveedor (mock/bedrock) → `enforcePostLlm` (degrada acciones inseguras).
7. `expires_at` (TTL 20 s), validación de esquema de la respuesta, métricas.

## Comandos

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run  (26 pruebas)
npm run demo        # recorre los 4 escenarios sin AWS
npm run build       # tsc -> dist/ (para empaquetar la Lambda)
```

## Variables de entorno

Ver `../.env.example`. Clave: `BEDROCK_ENABLED=false` (por defecto), `BEDROCK_MODEL_ID` sin fijar hasta cerrar F0-03.

## Estado

- Implementado y probado localmente (mock). **No** hay integración real con Bedrock ni despliegue AWS: `BedrockModelProvider.propose` lanza a propósito hasta el despliegue supervisado (Fase G de `../AWS_IMPLEMENTATION_GUIDE.md`).
