# Infrastructure (AWS SAM)

Infraestructura del MVP con **AWS SAM** (ADR-003; no CDK). Backend TypeScript sobre Lambda.

## Contenido

- `template.yaml` — REST API Gateway (API key + usage plan + throttling 1 req/s, burst 2, quota 1000/mes). Canal de **decisiones**: `DecisionFunction` (`/decisions`), `FeedbackFunction` (`/feedback`). Canal de **agregación B2B2E** (separado): `AggregationFunction` (`POST /team-metrics`), `TeamSummaryFunction` (`GET /teams/{teamId}/summary`). `AggregatesTable` DynamoDB on-demand con TTL (retención 30 días, sin índices secundarios). Lambdas: timeout 8 s, memoria 256 MB, reserved concurrency 2. Log groups con retención 3–7 días. `BedrockEnabled=false` por defecto; IAM de Bedrock y DynamoDB comentados (pendiente de F0-03 y despliegue supervisado).
- `samconfig.example.toml` — plantilla de configuración. Copiar a `samconfig.toml` (no commitear).
- `events/decision-*.json` y `events/team-metrics.json` — eventos API Gateway proxy para `sam local invoke`, derivados de los fixtures A–D y del escenario E.

## Estado de verificación (esta sesión)

`sam` y `docker` **no están instalados** en el entorno de trabajo, por lo que **no** se ejecutaron `sam validate` ni `sam build` ni `sam local`. La sintaxis YAML se comprobó con un cargador tolerante a tags de CloudFormation, pero **la validación SAM real queda pendiente** (BLOCKED). No se afirma que la plantilla despliegue correctamente.

## Comandos (para el despliegue supervisado — Fase G, con el propietario)

```bash
# 1) Compilar el backend a dist/
cd ../backend && npm install && npm run build && cd ../infrastructure

# 2) Validar y construir
sam validate --lint
sam build

# 3) Probar localmente (requiere Docker), SIN Bedrock
sam local invoke DecisionFunction -e events/decision-friction.json

# 4) Desplegar SOLO con supervisión (ver AWS_IMPLEMENTATION_GUIDE.md Fase G)
sam deploy --guided     # confirmar BedrockEnabled=false y revisar changeset
```

## Prohibido en trabajo autónomo

No ejecutar `sam deploy`, no crear/modificar recursos AWS, no habilitar Bedrock, no usar credenciales. Ver `../AWS_IMPLEMENTATION_GUIDE.md`.
