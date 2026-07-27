# Runbook de despliegue AWS (supervisado)

> Ejecutar **contigo presente**. Objetivo: datos reales y persistentes en DynamoDB + (opcional) Bedrock real, con costo acotado. Todo el código ya está listo; esto es la puesta en marcha.

## 0. Estado del código (ya hecho, sin credenciales)

- Persistencia por repositorio: usa **DynamoDB** si existe `AGGREGATES_TABLE`, si no memoria (dev). Ver `backend/src/aggregation/store.ts` + `dynamo-client.ts`.
- Proveedor **Bedrock real** cableado (`providers/bedrock-client.ts`), se activa con `BEDROCK_ENABLED=true` + `BEDROCK_MODEL_ID`.
- SAM con IAM mínimo real: DynamoDB CRUD/Read por función y `bedrock:InvokeModel` solo sobre el modelo aprobado.
- Backend: `tsc` limpio, `npm run build` emite `dist/`, **48/48 pruebas**.

## Fase B — Preparar la cuenta (una vez)

1. Inicia sesión en AWS. **Activa MFA**; no trabajes con root.
2. Elige **región** (la misma en todo). Anótala.
3. **Presupuestos** (Billing → Budgets): crea alertas de **1, 5 y 10 USD**.
4. Instala herramientas: **AWS CLI** y **SAM CLI** (+ Docker si usarás `sam local`).
5. `aws configure` con un usuario/rol con permisos de despliegue (no root).

## Fase F0-03 — Elegir modelo Bedrock (bloqueante para IA real)

En la consola de Bedrock (región elegida):
1. **Model access** → habilita un modelo pequeño con **Converse + tool use** (candidatos: Amazon Nova Lite, Claude Haiku). Verifica *Access granted*.
2. Pruébalo en el **Playground** (que responde).
3. Anota el **`modelId`** exacto (cadena completa). 
4. (Opcional recomendado) corre el banco de evaluación cuando exista, para elegir el más barato que pase los umbrales.

> Mientras F0-03 no esté cerrado, despliega con `BedrockEnabled=false` (los datos/persistencia funcionan igual; la decisión usa reglas locales).

## Fase G — Desplegar (supervisado)

```bash
# 1) Compilar el backend
cd backend
npm ci
npm run build                 # emite dist/

# 2) Empaquetar dependencias de producción con la Lambda (por si el runtime no las trae)
cp package.json dist/ 2>/dev/null || copy package.json dist\
cd dist && npm install --omit=dev --no-audit --no-fund && cd ..

# 3) Infra
cd ../infrastructure
sam validate --lint
sam build

# 4) Primer deploy: SIN Bedrock (datos reales ya persisten en DynamoDB)
sam deploy --guided \
  --parameter-overrides BedrockEnabled=false BedrockModelId=""
# confirmar changeset, region, capabilities CAPABILITY_IAM
```

Al terminar, SAM imprime **`ApiBaseUrl`** (algo como `https://xxxx.execute-api.<region>.amazonaws.com/v1`) y crea una **API key** (Console → API Gateway → API Keys).

### Probar datos reales y persistentes

```bash
# enviar un paquete de equipo (usa tu ApiBaseUrl + x-api-key)
curl -X POST "$API/team-metrics" -H "x-api-key: $KEY" -H "content-type: application/json" \
  -d @../contracts/fixtures/team/scenario-E-group5.json   # (envía uno o varios)

# leer el resumen agregado (persistido en DynamoDB)
curl "$API/teams/backend/summary?organization_id=org_demo&period_start=2026-07-22T00:00:00Z&period_end=2026-07-22T23:59:59Z" \
  -H "x-api-key: $KEY"
```

Verifica en la consola de **DynamoDB** que la tabla tiene ítems (`pk = ORG#org_demo#TEAM#backend`). Reinicia/espera y confirma que **siguen ahí** → persistencia real.

### Encender Bedrock (cuando F0-03 esté cerrado)

```bash
sam deploy --parameter-overrides BedrockEnabled=true BedrockModelId="<modelId-confirmado>"
```
Haz **una sola** llamada de decisión, revisa CloudWatch (sin payloads) y los créditos. Si algo raro, `sam deploy ... BedrockEnabled=false` (kill switch por parámetro).

## Después del deploy

- Apunta el **dashboard** (`dashboard/` o `laminar-web`) a `ApiBaseUrl` para leer resúmenes reales.
- Apunta el **desktop** (`HttpAgentClient` + `TeamMetricsPublisher`) a `ApiBaseUrl` + API key.
- Prohibido en trabajo autónomo: nunca `sam deploy` sin ti, ni credenciales en el repo.

## Costos

On-demand: DynamoDB (pago por uso, mínimo a este volumen), Lambda/API Gateway (casi 0 en demo), Bedrock (solo por invocación, con tope de llamadas en la app). Los presupuestos de Fase B avisan; el corte real vive en `ServerBudgetGate` + kill switch.
