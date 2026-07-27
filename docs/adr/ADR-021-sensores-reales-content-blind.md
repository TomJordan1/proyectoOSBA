# ADR-021: Sensores reales content-blind (agente de escritorio)

## Estado

Aceptada (2026-07-24). Implementado en `Laminar.App` (Windows), activable con `LAMINAR_SENSORS=real`.

## Contexto

El agente usaba `SimulatedMetricsSource` (fricción inventada). Para que sea "vivo" necesita medir comportamiento real, pero sin violar la privacidad ni parecer un keylogger.

## Decisión

Añadir `InputMonitor`, `RealMetricsSource` y `ContextSensor`, todos **content-blind**:

- **Solo señales abstractas:** cuenta correcciones (Backspace/Delete), cambios de ventana en primer plano, erraticidad del cursor (distancia y giros) e inactividad (AFK). **Nunca** se registran las teclas pulsadas, el texto, los títulos de ventana, los procesos ni las URLs.
- **Polling, sin hooks globales:** se usa `GetAsyncKeyState` (solo para Backspace/Delete), `GetForegroundWindow` (solo el handle, no el título), `GetCursorPos` y `GetLastInputInfo`. No se instala `SetWindowsHookEx`, para no comportarse como un keylogger ni ser marcado por antivirus.
- **Score adaptativo:** z-scores por métrica con línea base EWMA; el score de fricción combina los z positivos. AFK (>120 s sin actividad) fuerza fricción baja.
- **Contexto real:** "reunión" se infiere de que la **cámara o el micrófono estén en uso** (registro `CapabilityAccessManager\ConsentStore`, `LastUsedTimeStop==0`), y "pantalla completa" comparando el rect de la ventana en primer plano con la pantalla. Señales booleanas, sin identificar la app.
- **Opt-in / reversible:** por defecto se usan sensores simulados; los reales se activan con `LAMINAR_SENSORS=real`. El pre-filtro FinOps del `AgentLoop` sigue evitando llamadas innecesarias a la nube.

## Consecuencias

### Positivas
- El agente mide comportamiento real manteniendo la promesa content-blind y local-first.
- Sin hooks globales → menor riesgo de falsos positivos de antivirus y menor huella.
- Detección de reunión fiable y barata (cámara/micrófono), sin leer procesos ni títulos.

### Negativas / pendientes
- `GetAsyncKeyState` por polling puede perder pulsaciones muy rápidas de Backspace/Delete (aceptable: es una tasa, no un conteo exacto).
- La detección de pantalla completa es heurística (rect == pantalla).
- Requiere Windows; `Microsoft.Win32.Registry` viene con el runtime de escritorio (WPF/WinForms).

## Verificación

Compila en `net8.0-windows`. Prueba en vivo con `LAMINAR_SENSORS=real`: teclear/borrar y cambiar de ventana con erraticidad eleva la fricción hasta disparar una decisión (visible en CloudWatch `decision_source`), y estar en una videollamada (cámara/micrófono activos) hace que el agente **posponga** (contexto protegido).
