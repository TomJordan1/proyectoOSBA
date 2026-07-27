# ADR-020: Proveedor de IA directo con la API de Anthropic (alternativa a Bedrock)

## Estado

Aceptada (2026-07-23). Implementado junto al proveedor Bedrock, sin quitarlo.

## Contexto

Al activar Bedrock en una cuenta AWS nueva (plan Free), los modelos de Anthropic en Bedrock devuelven `ThrottlingException: Too many tokens per day`: la cuota diaria de cuentas nuevas es muy baja. Esto bloquea la demo de la IA real. El usuario dispone de una **API key propia de Anthropic** (console.anthropic.com) con su propia cuota/créditos.

## Decisión

Añadir un **`AnthropicModelProvider`** que llama directamente a la Messages API de Anthropic (`https://api.anthropic.com/v1/messages`) con *tool use*, reutilizando el esquema de las 5 herramientas y el prompt content-blind del proveedor Bedrock. `selectProvider` prioriza: Anthropic (si hay `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`) → Bedrock (si habilitado + modelId) → Mock.

### Manejo del secreto
- La API key **no se guarda en el repo**. Se pasa en el `sam deploy` como parámetro `AnthropicApiKey` con `NoEcho: true`, y llega a la Lambda de decisión como variable de entorno `ANTHROPIC_API_KEY` (cifrada en reposo). Solo la función `DecisionFunction` la recibe.

### Privacidad
- Los payloads ya son *content-blind* (scores de fricción y flags booleanos; nunca texto/URLs/títulos del usuario), por lo que enviarlos a la API de Anthropic no expone contenido personal. El coste: deja de ser "todo dentro de AWS". Aceptable para el MVP/demo; Bedrock queda como camino "todo-AWS" para producción.

## Consecuencias

### Positivas
- Desbloquea la IA real sin depender de la cuota de Bedrock de la cuenta nueva.
- Sin dependencias nuevas: usa `fetch` nativo de Node 22.
- Reversible: vaciar `AnthropicApiKey` vuelve a Bedrock/mock (kill switch por parámetro).

### Negativas / pendientes
- Dependencia externa a AWS (API de Anthropic) y facturación en la cuenta de Anthropic del usuario.
- El secreto vive como env var de Lambda (no en Secrets Manager); suficiente para MVP, endurecer luego (SSM SecureString/Secrets Manager).

## Verificación

`backend`: `tsc` limpio; pruebas nuevas en `tests/anthropic-provider.test.ts` (parser, ensureConfigured, propose con fetch simulado, error HTTP). Prueba en vivo: `POST /v1/decisions` escenario B → `decision_source` de modelo con acción coherente.
