# ADR-019: Autenticación de Kandace Teams con Amazon Cognito

## Estado

Aceptada (2026-07-23). Decisión tomada; implementación por fases y supervisada.

## Contexto

El dashboard de **Kandace Teams** (gestores/admins de cada organización) necesita autenticación real. Hoy el dashboard es un HTML estático que lee un JSON demo y la API solo se protege con una **API key** compartida (adecuada para el canal máquina-a-máquina del agente de escritorio, no para usuarios humanos).

Requisitos: multi-tenant B2B2E (organización → equipos), coste ~0 (sin presupuesto), coherencia con el stack (AWS serverless: Lambda + API Gateway + DynamoDB) y con la postura *privacy-first*.

Opciones evaluadas (free tiers verificados 2026-07-23): Amazon Cognito (~10k MAU), Supabase Auth (50k MAU), Auth0 (25k MAU, con primitiva *Organizations*), Firebase Auth (básico casi ilimitado), NextAuth/Auth.js (descartado: la web es un SPA Vite, no Next.js).

## Decisión

Usar **Amazon Cognito** como proveedor de identidad.

Motivos: es nativo del stack (autorizador de Cognito **integrado en API Gateway**, sin código propio de verificación de JWT), no introduce otro proveedor ni otra base de datos, los datos de identidad quedan en la misma cuenta AWS (coherente con privacidad), y su free tier cubre de sobra el MVP y las pruebas.

### Diseño

- **User Pool** + **App Client** (SPA, sin secreto; flujo Authorization Code + PKCE). Hosted UI de Cognito para el login inicial (menos código en el MVP).
- **Multi-tenant:** atributo personalizado `custom:organization_id` (y opcional `custom:role`) por usuario; grupos de Cognito para roles (`org_admin`, `team_lead`). El `organization_id` del token se usa para filtrar en las consultas.
- **Autorizadores en API Gateway:**
  - `GET /v1/teams/{teamId}/summary` → **autorizador Cognito** (JWT de usuario). La Lambda valida que el `organization_id` del token coincida con el solicitado (aislamiento entre tenants).
  - `POST /v1/team-metrics` y `POST /v1/decisions`/`/feedback` → siguen con **API key** (canal máquina del agente; no hay usuario humano). Doble modelo por diseño.
- **Dashboard:** login con Hosted UI, guarda el JWT en memoria de sesión, llama a la API con `Authorization: Bearer <id_token>`.

## Consecuencias

### Positivas
- Sin nuevo proveedor ni coste adicional relevante; identidad en la misma cuenta.
- Verificación de token la hace API Gateway (menos superficie de error y de código).
- Separación limpia: usuarios humanos por JWT, agente por API key.

### Negativas / pendientes
- La Hosted UI de Cognito es menos personalizable que Supabase/Clerk (aceptable en MVP; se puede sustituir por UI propia luego).
- Hay que gestionar el mapeo `organization_id` en el alta de usuarios (mock/consola maestra en el futuro).
- Nuevos tramos de precio de Cognito son algo complejos; vigilar MAU con los presupuestos ya creados.

## Plan de implementación (por fases, supervisado)

1. **Infra:** añadir `UserPool` + `UserPoolClient` + `UserPoolDomain` a `template.yaml`; declarar autorizador Cognito en `KandaceApi` y aplicarlo solo a `GET /teams/{teamId}/summary`. `sam validate`.
2. **Backend:** en `team-summary.handler`, leer `organization_id` de los *claims* del token y exigir que coincida con el `organization_id` de la query (rechazar 403 si no). Mantener compatibilidad para pruebas.
3. **Despliegue supervisado:** `sam deploy`; crear un usuario de prueba con `custom:organization_id=org_demo`; obtener token vía Hosted UI; `curl` con `Authorization: Bearer`.
4. **Dashboard:** conectar el login (Hosted UI) y las llamadas reales; luego decidir landing/deploy.

## Verificación

Pendiente: `sam validate` tras la fase 1; prueba `curl` con y sin token tras la fase 3 (200 con token válido de la org correcta, 401 sin token, 403 con org distinta).
