# LAMINAR — Guía de implementación AWS segura y económica

## Fase A — Trabajo autónomo sin credenciales

Claude puede crear código, SAM, pruebas, mocks, esquemas, eventos y documentación.

Claude no debe:

- ejecutar `sam deploy`;
- crear recursos AWS;
- invocar Bedrock;
- usar credenciales;
- habilitar modelos;
- modificar IAM real;
- consumir créditos.

## Fase B — Preparación manual de la cuenta

1. Activar MFA.
2. No desarrollar con root.
3. Revisar créditos y expiración.
4. Crear presupuestos de 1, 5 y 10 USD.
5. Etiquetar `Project=Kandace`, `Environment=Dev`.
6. Elegir región según modelo disponible.
7. Verificar Converse y tool use.
8. Anotar model ID exacto.
9. No habilitar modelos innecesarios.

## Fase C — Estructura

```text
infrastructure/
├── template.yaml
├── samconfig.example.toml
├── events/
│   ├── decision-stable.json
│   ├── decision-friction.json
│   └── decision-protected.json
└── README.md

backend/
├── src/
│   ├── handlers/decision.ts
│   ├── bedrock/bedrock-client.ts
│   ├── providers/model-provider.ts
│   ├── providers/mock-model-provider.ts
│   ├── policies/budget-gate.ts
│   ├── policies/safety-guards.ts
│   ├── validation/schemas.ts
│   └── observability/metrics.ts
├── tests/
└── package.json
```

## Fase D — Recursos SAM mínimos

- REST API Gateway.
- Lambda DecisionFunction.
- CloudWatch Log Group con retención.
- IAM mínimo.
- API key y usage plan.
- DynamoDB después, para idempotencia y presupuesto.

Parámetros:

```yaml
Parameters:
  BedrockModelId:
    Type: String
  BedrockEnabled:
    Type: String
    AllowedValues: ["true", "false"]
    Default: "false"
  MaxCallsPerHour:
    Type: Number
    Default: 20
  MaxCallsPerDay:
    Type: Number
    Default: 100
```

## Fase E — Lambda

1. Parsear.
2. Validar esquema.
3. Rechazar campos desconocidos.
4. Aplicar guardas.
5. Comprobar kill switch.
6. Comprobar presupuesto.
7. Comprobar idempotencia.
8. Construir prompt mínimo.
9. Invocar Bedrock.
10. Validar tool use.
11. Aplicar guardas nuevamente.
12. Responder.
13. Emitir métricas.

## Fase F — Pruebas

- contexto protegido;
- cooldown;
- límite diario;
- herramienta desconocida;
- duración > 60 s;
- respuesta expirada;
- campos prohibidos;
- fallo Bedrock;
- evento duplicado.

Comandos:

```bash
sam validate --lint
sam build
sam local invoke DecisionFunction -e infrastructure/events/decision-friction.json
```

No afirmar que funciona si no fue ejecutado.

## Fase G — Primer despliegue supervisado

Solo con el propietario presente:

1. revisar diff;
2. confirmar `BedrockEnabled=false`;
3. `sam validate`;
4. `sam build`;
5. `sam deploy --guided`;
6. inspeccionar recursos;
7. probar sin Bedrock;
8. verificar throttling;
9. activar Bedrock;
10. realizar una sola llamada;
11. revisar métricas y créditos;
12. desactivar si hay algo inesperado.

## Límites iniciales

```text
API rate: 1 req/s
API burst: 2
API quota: 1000/mes
Lambda concurrency: 2
Lambda timeout: 8 s
Lambda memory: 256 MB
Bedrock max output: 180 tokens
Calls/device/day: 30
Calls/account/day: 100
Logs: 3–7 días
```

## Checklist nocturno

- [ ] `BEDROCK_ENABLED=false`.
- [ ] No hay despliegues.
- [ ] No hay llamadas cloud.
- [ ] No hay polling.
- [ ] No hay credenciales en archivos.
- [ ] Pruebas locales terminadas.
- [ ] Procesos locales detenidos.
- [ ] Roadmap e historial actualizados.
