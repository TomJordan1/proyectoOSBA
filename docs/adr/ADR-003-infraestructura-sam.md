# ADR-003: AWS SAM para la infraestructura del MVP

## Estado

Aceptada (2026-07-22). Sustituye la decisión pendiente "CDK o SAM".

## Contexto

El equipo tiene poca experiencia en agentes y en infraestructura como código. Se necesita reducir la complejidad y el tiempo de despliegue para llegar cuanto antes a una vertical funcional. La infraestructura del MVP es acotada: API Gateway HTTP API, Lambda, DynamoDB, CloudWatch y permisos para Bedrock.

Se consideró AWS CDK (misma lengua que el backend, TypeScript), pero implica más conceptos (constructs, bootstrap, síntesis) y mayor curva de aprendizaje.

## Decisión

Usar **AWS SAM** como única herramienta de infraestructura del MVP. No usar CDK ni mezclar ambos.

El backend sigue siendo **TypeScript sobre AWS Lambda**; SAM solo define y despliega los recursos.

## Consecuencias

### Positivas

- menor complejidad y despliegue más rápido (`sam build`, `sam deploy`);
- plantilla declarativa fácil de leer para un equipo junior;
- desarrollo local con `sam local` para probar Lambdas;
- una sola herramienta de IaC, sin ambigüedad.

### Negativas

- menos expresividad que CDK para lógica compleja (no necesaria en el MVP);
- la infraestructura se describe en YAML, separado del código TypeScript;
- si el proyecto crece mucho, podría reconsiderarse CDK (queda en roadmap).

## Notas

- `infrastructure/` contendrá `template.yaml` y configuración de SAM.
- Actualizar los comandos previstos en `CLAUDE.md` (`sam validate`, `sam build`, `sam deploy`).
