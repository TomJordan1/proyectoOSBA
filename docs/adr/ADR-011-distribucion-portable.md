# ADR-011: Distribución como ejecutable portable en ZIP

## Estado

Aceptada (2026-07-22).

## Contexto

La demo del hackathon necesita que el agente de escritorio se ejecute en Windows de forma reproducible y rápida de compartir. Un instalador MSIX/MSI y la firma digital añaden trabajo (empaquetado, certificados, advertencias de SmartScreen) que no aporta a la vertical funcional ni a los criterios de evaluación.

## Decisión

Distribuir el agente como **ejecutable portable dentro de un ZIP**. El endpoint de AWS se configura mediante un archivo `.json` incluido en el paquete.

El **instalador MSIX/MSI y la firma digital quedan fuera del MVP** y pasan al roadmap.

## Consecuencias

### Positivas

- distribución inmediata y reproducible;
- sin dependencia de certificados de firma;
- fácil de versionar como release en el repositorio.

### Negativas

- Windows/SmartScreen puede mostrar advertencias al ejecutar un binario no firmado; debe documentarse en el README y en la demo;
- sin instalación asistida ni actualización automática (aceptable para el MVP).

## Roadmap

- instalador MSIX/MSI;
- firma digital de código;
- actualización automática.
