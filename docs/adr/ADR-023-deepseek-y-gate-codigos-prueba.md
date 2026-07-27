# ADR-023: Proveedor DeepSeek + gate de códigos de prueba (tope de gasto por usuario)

## Estado

Aceptada (2026-07-25). Implementado en `backend` + `infrastructure` + `desktop-agent`. Pendiente de `sam deploy` (lo ejecuta el usuario) con la API key de DeepSeek.

## Contexto

Para el demo de la hackathon se necesita: (1) que cada persona que descargue el agente gaste **a lo sumo ~US$0.50** de IA y luego se corte el acceso, configurable; (2) opción de usar una IA más barata. El usuario eligió **códigos de prueba** (uno por persona, con tope y vencimiento) y **DeepSeek** como proveedor.

## Decisión

### 1. Proveedor DeepSeek (API compatible con OpenAI)
- `DeepSeekModelProvider` (`backend/src/providers/deepseek-model-provider.ts`): llama a `https://api.deepseek.com/chat/completions` con function calling (`tool_choice: "required"`), reutilizando el esquema de las 5 herramientas y el prompt content-blind del proveedor Bedrock.
- Prioridad de selección (`providers/index.ts`): **DeepSeek** (si hay `DEEPSEEK_API_KEY`) → Anthropic → Bedrock → Mock.
- Config: `DEEPSEEK_API_KEY` (secreto, en el deploy), `DEEPSEEK_MODEL` (default `deepseek-chat`).
- Nuevo `decision_source: "deepseek"` añadido al tipo, al esquema ejecutable y al contrato canónico (aditivo; el desktop lo trata como string).

### 2. Gate de códigos de prueba (tope de gasto por usuario)
- El código viaja en el **header HTTP `x-trial-code`** (NO en el cuerpo → **no cambia el contrato JSON** de la petición).
- `TrialGate` + stores (`policies/trial-gate.ts`): `InMemoryTrialStore` (tests) y `makeDynamoTrialStore` (DynamoDB con **UpdateItem condicional atómico**: permite y suma 1 solo si el código existe, está activo, no venció y no superó el tope).
- Tabla DynamoDB `TrialCodesTable` (PK `code`; atributos `active`, `expiresAt` ISO, `callsUsed`, `maxCalls` opcional, `ttl` opcional).
- Wiring en `decide.ts`: si el gate está activo y el código está agotado/vencido/ausente → **no se llama a la IA** y se responde con la política local (`reason_code: SERVER_BUDGET_LIMIT`). Se ubica justo antes de invocar al proveedor (solo cuenta llamadas reales a la IA; cache/local no consumen cupo).
- Config: `TRIAL_CODES_TABLE` (activa el gate solo si está presente) y `TRIAL_MAX_CALLS` (default 400 ≈ US$0.50 con DeepSeek/Haiku). **Configurable en AWS** por variables de entorno del stack.
- Desktop: `HttpAgentClient` envía `x-trial-code`; `AgentSettings.TrialCode` (env `LAMINAR_TRIAL_CODE` o `kandace.settings.json`).

## Consecuencias

### Positivas
- Cada tester gasta como máximo su cupo; al agotarse, el agente sigue funcionando en local (US$0) sin romperse.
- El tope y el proveedor se configuran en el deploy, sin tocar código.
- Sin cambios en el contrato de la petición (código por header) → el test de sincronía de contratos sigue verde salvo por la adición aditiva de `decision_source: deepseek`.

### Negativas / pendientes
- El tope es por **nº de llamadas** (proxy de costo), no por costo exacto por token.
- Códigos evadibles pidiendo otro (aceptable para demo; el super-admin/panel para emitir y ver códigos queda para después — ligado a #30 Consola Maestra).
- Requiere `sam deploy` y una cuenta/API key de DeepSeek.
- Falta `npm test` en Windows para confirmar (vitest no corre en el entorno de análisis por binario nativo de rollup); `tsc --noEmit` pasa.

## Verificación
- `tsc --noEmit` del backend: OK.
- Tests añadidos: `trial-gate.test.ts` (tope, vencimiento, inactivo, sin código) y `deepseek-provider.test.ts` (parseo de tool_calls). Ejecutar con `npm test` en Windows.
