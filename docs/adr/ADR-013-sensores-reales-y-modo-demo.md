# ADR-013: Sensores reales y modo demo reproducible

## Estado

Aceptada (2026-07-22).

## Contexto

El MVP debe demostrar captura local real de señales de fricción, pero también necesita una demo estable e independiente del entorno para la presentación. Ambos objetivos coexisten.

## Decisión

El MVP tendrá **sensores reales** y además un **modo demo** con escenarios simulados reproducibles.

Sensores reales del MVP (content-blind):

1. **Backspace/Delete agregados**: solo conteos por ventana temporal, nunca teclas ni texto.
2. **Cambios de ventana**: conteo de cambios de foco, sin leer títulos ni procesos.
3. **Métrica básica del cursor**: medida de inestabilidad del movimiento, sin posiciones persistidas.

Modo demo:

- escenarios simulados y reproducibles para la presentación (ver los cuatro escenarios en `HOJA_RUTA.md`);
- los datos de demo se marcan claramente como demo y no se mezclan con datos reales.

## Consecuencias

### Positivas

- evidencia de captura local real para los criterios;
- demo estable e independiente del entorno;
- privacidad preservada (solo métricas abstractas).

### Negativas

- la captura real requiere hooks de teclado/ventanas en Windows, que pueden activar advertencias de antivirus/SmartScreen (documentar y probar);
- mantener dos rutas (real y demo) exige cuidado para que compartan el mismo contrato.

## Notas

- Los sensores solo producen contadores, medias y desviaciones; ningún dato prohibido por `PRIVACIDAD_Y_ETICA.md`.
