# ADR-016: Reestructuración B2B2E y separación Kandace Personal / Cloud / Teams

## Estado

Aceptada (2026-07-22).

## Contexto

Kandace evoluciona de un agente individual a un SaaS híbrido **B2B2E**: la empresa financia una herramienta de autocuidado para el trabajador y recibe únicamente tendencias grupales, nunca vigilancia individual. Debe hacerse **sin reescribir** el MVP: se conserva el motor de decisiones, providers, guardas, FinOps, contratos A–D, desktop y SAM ya implementados y probados.

## Decisión

Tres componentes con responsabilidades claras:

- **Kandace Personal** (.NET 8/WPF): sensores, fricción, decisión, intervención, feedback, historial local y publicación agregada. El detalle nunca sale del equipo.
- **Kandace Cloud** (API Gateway + Lambda + Bedrock + DynamoDB): decisiones con el LLM y **agregación** con privacidad grupal.
- **Kandace Teams** (React/Amplify): dashboard colectivo de tendencias, sin vistas individuales.

**Dos canales separados que no se mezclan:** decisiones (`/v1/decisions`, `/v1/feedback`) y agregación (`/v1/team-metrics`, `/v1/teams/{teamId}/summary`).

**Identidad técnica sin identidad humana:** `installation_token` rotativo + `organization_id` + `team_id`. Prohibido `user_id`, nombre, correo o ID laboral en el canal de agregación (reforzado por JSON Schema con `additionalProperties:false` y `not/required`).

**Privacidad grupal:** ventana 15 min, `minimum_group_size_demo=5` (producción recomendada 8), retraso del dashboard 60 min, retención 30 días. Con grupo insuficiente no se devuelven métricas (`privacy_status: insufficient_group`). K=5 no garantiza anonimato perfecto.

**Migración modular:** se añaden `backend/src/aggregation/` y `backend/src/privacy/` junto al código de decisiones existente (que ya era modular en `agent/`, `policies/`, `providers/`, `validation/`). No se movieron los módulos de decisiones para no romper contratos ni pruebas A–D.

## Consecuencias

### Positivas

- reutiliza todo el trabajo previo; A–D siguen verdes;
- separación de canales y de niveles de datos (gobierno de datos A–D) fácil de auditar;
- posiciona el producto para un comprador empresarial sin convertirse en bossware.

### Negativas

- más superficie (dashboard, agregación, tablas) que mantener y validar;
- el modelo de privacidad grupal exige calibración y comunicación cuidadosa.

## Verificación

`backend/`: **37 pruebas verdes** (26 decisiones A–D + 11 B2B2E). Escenarios E (grupo 5 → visible con métricas) y F (grupo 4 → suprimido) probados en `aggregation.test.ts`. Rechazo de `user_id`/`email`/`name` en `team-validation.test.ts`. Demo integrada A–F: `backend/scripts/demo-b2b2e.ts`. SAM ampliado (validación de sintaxis YAML; `sam validate/build` pendiente por falta de herramientas). Desktop `TeamMetricsPublisher` añadido (sin build; `dotnet` no instalado).
