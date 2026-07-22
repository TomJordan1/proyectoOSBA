# ADR-001: Arquitectura híbrida

## Estado

Aceptada.

## Contexto

Una web no puede capturar de forma global las señales necesarias ni ejecutar un overlay sobre aplicaciones de Windows. La hackathon exige publicación y una demostración online.

## Decisión

Crear un agente Windows descargable y una plataforma AWS pública.

## Consecuencias

### Positivas

- acceso local controlado;
- intervención nativa;
- demo online;
- AWS central;
- separación de privacidad.

### Negativas

- instalación;
- dos entornos;
- integración adicional;
- advertencias de firma digital.
