# ADR-014: Duración máxima canónica de recuperación = 60 segundos

## Estado

Aceptada (2026-07-22). Resuelve la contradicción entre `ARQUITECTURA.md` (antes 90 s) y `CONTRATOS_API.md` (`max_duration_seconds` 60).

## Contexto

La documentación tenía valores distintos para la duración máxima de una recuperación: la guarda determinista indicaba 90 s, mientras que las preferencias y el ejemplo de respuesta usaban 60 y 45. Se necesita un único valor canónico.

## Decisión

La duración máxima canónica de una recuperación en el MVP es **60 segundos**.

- Los ejemplos pueden usar 30 o 45 segundos, pero **nunca superar 60**.
- La guarda determinista del backend y la revalidación del desktop rechazan cualquier `duration_seconds > 60` y ejecutan `do_nothing`.
- `preferences.max_duration_seconds` no puede exceder 60.

## Consecuencias

### Positivas

- un único tope, sin contradicciones entre documentos;
- refuerza intervenciones breves y no invasivas.

### Negativas

- ninguna relevante para el MVP.

## Impacto documental

- `ARQUITECTURA.md` §6 actualizado de 90 s a 60 s.
- `CONTRATOS_API.md` incluye la nota del tope de 60 s.
