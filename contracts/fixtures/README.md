# Fixtures de escenarios (datos de demo)

Estos archivos son **datos simulados de demo**, claramente identificados, para probar la vertical sin sensores reales. No contienen datos personales: solo métricas abstractas y contexto booleano.

| Escenario | Archivo | Acción esperada del backend | reason_code |
|---|---|---|---|
| A — trabajo estable | `scenario-A-stable.json` | `do_nothing` | `STABLE_PATTERN` |
| B — fricción alta y disponible | `scenario-B-friction-available.json` | `launch_bubble_recovery` | `SUSTAINED_FRICTION_CONTEXT_AVAILABLE` |
| C — fricción alta con contexto protegido | `scenario-C-protected.json` | `postpone_intervention` | `PROTECTED_CONTEXT` |
| D — fin de contexto protegido, recuperación pendiente | `scenario-D-protected-ended.json` | `show_subtle_notification` | `PENDING_RECOVERY_RESUMED` |

La recuperación "pendiente" del escenario D es un estado que gestiona el desktop; a nivel de contrato de backend se representa con el contexto ya libre y fricción sostenida moderada.
