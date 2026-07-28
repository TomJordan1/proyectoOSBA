# ADR-022: Recalibración del detector y UX de intervención de dos pasos

## Estado

Aceptada (2026-07-25). Implementado en `Kandace.App` (Windows) y `Kandace.Friction`. Pendiente de `dotnet build`/`dotnet test` en Windows (WPF no compila en Linux).

## Contexto

Los logs (`sam logs`) mostraron que **todas** las decisiones eran `launch_bubble_recovery`: el detector estaba sobre-sensible. Además, el usuario reportó dos problemas de experiencia:

1. La pantalla de pausa se **apoderaba de toda la pantalla y robaba el foco** de golpe → estresaba en vez de ayudar, y el reflejo era cerrar con Esc de inmediato.
2. Ese cierre rápido **no enseñaba nada**: la intervención podía volver a saltar igual, con riesgo de bucle "intervención → molestia → más intervenciones".

También se discutió cómo debe adaptarse el score y por qué NO conviene una red neuronal para esto (poca data por usuario, coste de CPU local, interpretabilidad). Ver [ADR-017](ADR-017-capa-de-aprendizaje-y-evolucion.md) y [ADR-021](ADR-021-sensores-reales-content-blind.md).

## Decisión

### 1. Recalibrar el detector (menos falsos positivos)
- Nueva clase pura `Kandace.Friction.FrictionScorer`: exige **corroboración** (manda la 2ª señal más alta), **down-weight del cursor** (peso 0.35, es la señal más ruidosa) y acota cada z (ZCap=2.0). Base 0.30.
- `RealMetricsSource` usa el scorer y adapta la base más rápido (EWMA `Alpha` 0.03 → 0.1).
- `InputMonitor`: guard anti-jitter del cursor (ignora <2px y >300px) → mata el artefacto de CPU saturado en la fuente.
- `FrictionOptions.SustainedWindows` 3 → 5 (~15s sostenidos).

### 2. Intervención de dos pasos (suave primero)
- Paso 1: `NudgeWindow` — aviso discreto, esquina inferior derecha, **sin robar el foco** (`WS_EX_NOACTIVATE`) y sin tapar la pantalla. Botones "Tomar pausa" / "Ahora no"; si se ignora, se cierra solo.
- Paso 2: la pantalla completa de pausa se abre **solo si el usuario acepta**.

### 3. Back-off que aprende del rechazo
- `Kandace.Friction.InterventionBackoff` (puro, testeable): ventana de **gracia** base tras mostrar (anti-bucle), **escalada exponencial** del silencio ante cierres rápidos consecutivos (5→10→…→60 min tope), y **reset** al completar la pausa.
- `AgentLoop.Snooze(until)` silencia la detección durante ese periodo.
- Señal de feedback = **velocidad de cierre**: completa (reset), <3s (quick dismiss → escala), intermedio (suave). El Esc deja de ser solo una huida y se vuelve un dato útil.
- **Regla clave anti-bucle:** la reacción a una intervención (fastidio, teclear fuerte) alimenta el back-off, **nunca** el score de fricción, para no retroalimentar más intervenciones.

### 4. Ocultar a Kanny en contexto sensible
- `AgentLoop` reporta contexto protegido (reunión por cámara/micrófono, o pantalla completa) por tick; `App` **oculta** al acompañante en ese contexto y lo restaura al salir (sin pelear con un ocultar manual del usuario).

### 5. Frases personalizables sin recompilar
- `PhraseConfig` carga `kanny.frases.json` junto al .exe (tolerante a claves no-lista, p. ej. comentarios); `DialoguePool` y `RecoveryTips` lo usan con **fallback** a los valores del código. Cero tokens.

### Descartado por ahora
- Red neuronal / aprendizaje federado para el score: sobreingeniería para 3–4 señales content-blind con poca data por usuario. El aprendizaje "por pesos" va en la selección de respuesta (bandit `HistoryPolicy`), no en el z-score.

## Consecuencias

### Positivas
- Muchos menos disparos y ninguno por carga de CPU/tecleo rápido.
- La intervención pasa de "interrupción" a "invitación"; el rechazo enseña y calla.
- Se rompe el bucle molestia→más intervenciones.
- Frases variadas y editables por no-desarrolladores.

### Negativas / pendientes
- Falta `dotnet build`/`dotnet test` en Windows para confirmar compilación WPF.
- La línea base adaptativa **por usuario y por contexto** (día/hora/temporada) persistida sigue pendiente (hoy es por sesión); queda como evolución (ligada a ADR-017).

## Verificación

- Lógica pura verificada programáticamente (réplica en Python) + tests xUnit: `FrictionScorerTests` (7 casos: un pico aislado de cursor/teclado ya no dispara; dos señales reales sí) e `InterventionBackoffTests` (gracia 90s, escalada 5→10→…→60, reset al completar).
- Pendiente en Windows: `dotnet test tests\Kandace.Domain.Tests\Kandace.Domain.Tests.csproj` y `dotnet build src\Kandace.App\Kandace.App.csproj`.
