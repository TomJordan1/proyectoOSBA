# ADR-002: Bedrock Converse API y tool use

## Estado

Propuesta. El uso de Bedrock Converse API + tool use está aprobado; **el modelo concreto NO se fija aún** (bloqueado por verificación en consola, tarea F0-03).

**Avance 2026-07-22:** la lógica del proveedor (`BedrockModelProvider`) ya está **implementada y probada** con un `ConverseClient` inyectado (construcción de mensajes content-blind, declaración de las 5 herramientas, parseo de `toolUse`) — 7 pruebas en `bedrock-provider.test.ts`. **No** llama a AWS: el adaptador real de `@aws-sdk/client-bedrock-runtime` se inyecta solo en el despliegue supervisado (Fase G), tras cerrar F0-03.

## Contexto

El reto requiere que el LLM sea motor principal. Una llamada que solo redacte mensajes no es suficiente.

## Decisión

Utilizar Bedrock Converse API y definir herramientas seguras. El backend procesa solicitudes de herramientas y retorna una decisión estructurada.

El nombre del modelo definitivo **no debe fijarse todavía**. Antes de seleccionarlo hay que comprobar en la consola que el modelo candidato:

1. está habilitado en nuestra cuenta y región;
2. soporta Bedrock Converse API;
3. soporta tool use;
4. produce respuestas estructuradas de forma consistente.

Esta verificación es una **tarea bloqueante** (ver F0-03 en `HOJA_RUTA.md`): ningún código de producto que dependa del modelo debe darse por operativo hasta cerrarla, y su cierre debe registrarse en un ADR de seguimiento.

## Consecuencias

- evidencia clara de comportamiento agéntico;
- modelo reemplazable;
- validación adicional;
- necesidad de manejar errores y disponibilidad;
- la elección del modelo queda pendiente de verificación empírica, no de suposición.
