# ADR-012: Detección de contexto protegido en el MVP

## Estado

Aceptada (2026-07-22).

## Contexto

Laminar no debe interrumpir durante reuniones, presentaciones o pantalla compartida. Sin embargo, `PRIVACIDAD_Y_ETICA.md` prohíbe leer títulos de ventana, procesos personales o contenido. La detección automática y universal de "pantalla compartida" es técnicamente incierta sin cruzar esa línea, y no debe prometerse.

## Decisión

Para el MVP, el contexto protegido se determina mediante señales que **no leen títulos ni contenido**:

1. **Modo manual "Estoy presentando"**: el usuario activa explícitamente un estado protegido.
2. **Modo "No molestar" (quiet mode)**: silencia toda intervención salvo `do_nothing`.
3. **Detección de pantalla completa** de la aplicación activa, **solo si puede hacerse sin leer títulos ni contenido** (p. ej. por dimensiones/estado de la ventana activa).

**No se promete detección automática universal de pantalla compartida.** Esa integración queda en investigación/roadmap.

Estas señales alimentan los booleanos del contrato: `meeting_active`, `screen_sharing`, `fullscreen_active`, `quiet_mode`. En el MVP, `meeting_active` y `screen_sharing` se derivan del modo manual "Estoy presentando"; `fullscreen_active` de la detección de pantalla completa; `quiet_mode` del modo No molestar.

## Consecuencias

### Positivas

- respeta la privacidad content-blind;
- control humano explícito y comprensible;
- evita afirmaciones técnicas que no podemos garantizar.

### Negativas

- depende de que el usuario active el modo manual (posible falso negativo si lo olvida);
- la detección de pantalla completa puede no cubrir todos los casos.

## Roadmap / investigación

- detección automática de reunión o pantalla compartida sin leer títulos ni contenido (APIs de captura/loopback de audio, indicadores del sistema), pendiente de viabilidad y privacidad.
