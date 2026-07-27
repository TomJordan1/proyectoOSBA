# Análisis de logs del agente — 2026-07-25

Fuente: `sam logs --stack-name laminar --region us-east-1 --start-time "24 hour ago"` (volcado en `Escritorio/kandace_logs.txt`).
Uso de tokens Anthropic acumulado del proyecto: ~94.707 in / 4.394 out ≈ **US$0.07**.

## Qué muestran los logs

- **Todas** las decisiones son `launch_bubble_recovery` con `reason_code=SUSTAINED_FRICTION_CONTEXT_AVAILABLE`.
- Patrón por sesión: 1 llamada `decision_source=anthropic` (~1.8–2.9 s, coste de tokens) y luego varias `cache` (0–60 ms, sin coste). La caché FinOps funciona.
- Muchas sesiones distintas (cada `INIT_START` = cold start) a lo largo de 2 días → decenas de llamadas `anthropic`.
- Lambda sana: memoria 108–122 MB, sin errores, sin fallback.

## Diagnóstico (por qué se siente "caótico")

1. **Sobre-sensibilidad introducida para la demo.** Se subió la fórmula a `score = 0.55 + 0.2*blend` con baseline muy lento (EWMA Alpha=0.03) para que disparara fácil. Resultado: **dispara casi siempre**, incluso sin fricción real del usuario.
2. **Falsos positivos por carga del sistema.** Bajo lag/juego/CPU al límite, el cursor se mueve a saltos y hay micro-cambios de ventana → sube la "erraticidad" aunque el usuario no esté estresado. El proxy confunde *máquina ocupada* con *usuario friccionado*.
3. **Tecleo rápido** también eleva señales sin ser fricción.
4. **Una sola acción siempre** (recovery) porque la entrada siempre "parece" fricción sostenida → no hay variedad (do_nothing / notificación sutil).

## Recomendaciones

### A. Recalibrar la fricción (menos disparos, más realista)
- Bajar sensibilidad: subir umbral efectivo, exigir **varias señales altas** (no solo cursor), baseline más rápido (Alpha ~0.1), y **más ventanas sostenidas**.
- **Down-weight del cursor** (es la señal más ruidosa bajo lag).
- Cooldown más largo entre intervenciones.

### B. Contexto sensible (reunión / juego / pantalla compartida)
- `ContextSensor` ya detecta **cámara/micrófono en uso** (reunión, p. ej. Google Meet) y **pantalla completa** (juego/vídeo) → el bucle **pospone** (no interviene).
- Falta: cuando el contexto es protegido, **ocultar también el acompañante** (hoy solo pospone la decisión, pero Kanny sigue visible).
- Añadir "Modo juego / No molestar" manual (ya existe QuietMode; exponerlo mejor).
- Pantalla compartida real es difícil de detectar por API; la heurística de pantalla completa cubre la mayoría.

### C. Control de costo de la IA (clave para el demo)
- **Coste real hoy: US$0.07** en todo el proyecto. Cada decisión `anthropic` cuesta fracciones de centavo (Haiku, 180 tokens máx de salida). 8 testers en una semana difícilmente pasan de ~US$1–2, no US$10 — pero para ir **a cero**:
- **Distribuir el agente en modo LOCAL/mock (sin API key)**: usa las reglas locales (`MockAgentClient`) → **US$0 en tokens**. El acompañante funciona igual (detecta y ofrece pausa). La IA real se usa solo en TU demo controlada.
- Recalibrar (A) reduce muchísimo el nº de llamadas.
- Topes ya existentes: `ServerBudgetGate` (20/h, 100/día) y usage plan de API Gateway (1 req/s, 1000/mes). Para un tope **global duro** habría que persistir un contador en DynamoDB (mejora futura).

## Prioridad sugerida
1. Poner el agente descargable en **modo local (sin key)** → costo cero para testers.
2. **Recalibrar** la fricción (menos falsos positivos).
3. **Ocultar el acompañante** en reunión/juego/pantalla completa.
