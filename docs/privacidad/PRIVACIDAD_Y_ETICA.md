# Privacidad, ética y seguridad del producto

## Posicionamiento correcto

Laminar es **local-first, content-blind y privacy-by-design**.

No usar “zero-knowledge” ni “anonimato matemáticamente imposible” sin una demostración formal.

## Datos locales

Puede conservar temporalmente:

- contadores;
- medias y desviaciones;
- feedback;
- preferencias;
- cooldown;
- estado de demo.

No debe conservar:

- contenido;
- texto;
- títulos;
- URLs;
- capturas;
- historial detallado de aplicaciones.

## Transparencia

La aplicación debe incluir una vista:

- qué mide;
- qué no mide;
- qué sale del equipo;
- qué permanece local;
- cuándo se consultó AWS;
- qué decisión se recibió;
- cómo desactivar sensores.

## Consentimiento

- activación explícita;
- pausa del agente;
- salida inmediata;
- reducción de movimiento;
- modo silencioso;
- borrado de datos locales;
- no habilitar inicio automático sin permiso.

## Lenguaje

Evitar:

- burnout detectado;
- estrés medido;
- nivel psicológico;
- productividad baja;
- distracción;
- empleado riesgoso.

Preferir:

- fricción digital;
- desviación del patrón;
- interacción inestable;
- intervención sugerida;
- contexto protegido.

## Riesgo de función dual

Aunque se diseñe para bienestar, una empresa podría usarlo para presión. Por eso:

- no mostrar individuos;
- no crear rankings;
- no clasificar empleados;
- no exportar historial granular;
- no permitir cambios empresariales a las reglas locales sin consentimiento;
- publicar límites de uso.

## Amenazas mínimas

| Amenaza | Mitigación |
|---|---|
| Payload sensible | lista blanca de campos |
| Prompt injection | no enviar texto del usuario |
| Tool use inseguro | herramientas cerradas |
| Respuesta manipulada | HTTPS, esquema y expiración |
| Repetición | event ID e idempotencia |
| Logs sensibles | redacción y estructura |
| Secreto en repositorio | variables y escaneo |
| Interrupción crítica | revalidación local |
