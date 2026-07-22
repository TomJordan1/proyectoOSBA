# Contratos API y herramientas

Todos los contratos deben materializarse como JSON Schema en el código.

## POST `/v1/decisions`

### Request

```json
{
  "schema_version": "1.0",
  "event_id": "uuid",
  "timestamp": "2026-07-22T12:00:00Z",
  "friction": {
    "score": 0.82,
    "sustained_minutes": 3,
    "delete_z": 1.7,
    "switch_z": 2.1,
    "cursor_z": 1.3
  },
  "context": {
    "meeting_active": false,
    "screen_sharing": false,
    "fullscreen_active": false,
    "quiet_mode": false,
    "session_minutes": 67,
    "last_intervention_minutes": 48
  },
  "preferences": {
    "preferred_recovery": "bubbles",
    "reduced_motion": false,
    "max_duration_seconds": 60
  }
}
```

### Datos prohibidos

- texto;
- teclas individuales;
- títulos;
- ejecutables;
- URLs;
- nombres de usuario;
- machine ID persistente;
- capturas;
- rutas de archivos.

### Response

```json
{
  "schema_version": "1.0",
  "decision_id": "uuid",
  "action": "launch_bubble_recovery",
  "arguments": {
    "duration_seconds": 45,
    "intensity": "low"
  },
  "reason_code": "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
  "explanation": "Se detectó una desviación sostenida y no hay una actividad protegida.",
  "expires_at": "2026-07-22T12:00:20Z"
}
```

## Acciones permitidas

```text
do_nothing
show_subtle_notification
postpone_intervention
launch_bubble_recovery
enable_quiet_mode
```

`save_feedback` se ejecuta por endpoint separado.

`arguments.duration_seconds` nunca debe superar **60** (tope canónico del MVP; ver ADR-014). Los ejemplos pueden usar 30 o 45. El desktop rechaza cualquier valor mayor a 60 y ejecuta `do_nothing`.

## POST `/v1/feedback`

```json
{
  "schema_version": "1.0",
  "decision_id": "uuid",
  "result": "helpful",
  "reason": "good_timing",
  "recovery_completed": true,
  "duration_seconds": 41
}
```

Valores de `result`:

- `helpful`
- `not_now`
- `false_positive`
- `dismissed`

## POST `/v1/metrics`

Solo para dashboard agregado:

```json
{
  "schema_version": "1.0",
  "window_start": "2026-07-22T12:00:00Z",
  "scenario": "real",
  "decision_count": 3,
  "postponed_count": 1,
  "recovery_count": 1,
  "helpful_count": 1,
  "avg_latency_ms": 840
}
```

No enviar datos por persona para el MVP público.

## Validación de respuestas

El desktop debe rechazar:

- acción desconocida;
- duración mayor al límite;
- respuesta expirada;
- ausencia de `reason_code`;
- tipos incorrectos;
- acción incompatible con contexto actual.

En cualquier fallo, ejecutar `do_nothing`.
