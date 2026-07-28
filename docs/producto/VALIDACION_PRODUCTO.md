# Plan de validación del producto

## Hipótesis

### H1 Problema

Los recordatorios fijos aparecen en momentos inadecuados.

### H2 Solución

Una decisión contextual es percibida como menos invasiva.

### H3 Recuperación

La experiencia breve con burbujas es aceptable y puede ayudar a cambiar de ritmo.

### H4 Privacidad

Los usuarios confían más cuando ven exactamente qué datos se envían.

### H5 Mercado

Un segmento aceptaría instalar Kandace y algunos pagarían por personalización o analítica personal.

## Validación técnica

Medir:

- CPU media y pico;
- memoria;
- eventos procesados;
- llamadas a Bedrock;
- bytes enviados;
- latencia p50/p95;
- tasa de respuestas inválidas;
- éxito del fallback;
- interrupciones durante contexto protegido.

## Validación UX

Los cuatro escenarios canónicos (definición y criterios de aceptación en `HOJA_RUTA.md`):

- A. trabajo estable;
- B. fricción alta y usuario disponible;
- C. fricción alta con contexto protegido;
- D. fin del contexto protegido y recuperación de la intervención pendiente.

La **pérdida de red** se prueba como validación técnica del fallback local, no como escenario UX independiente.

Preguntas:

- ¿Entendiste por qué apareció?
- ¿Fue un buen momento?
- ¿Te resultó invasivo?
- ¿Confiarías en la privacidad?
- ¿Volverías a usarlo?
- ¿Qué cambiarías?

## Muestra exploratoria

Objetivo inicial: 5–8 personas.

No presentar resultados como validación científica ni psicológica.

## Indicadores de éxito

- 100 % de escenarios protegidos sin overlay;
- al menos 70 % de intervenciones calificadas como oportunas o aceptables;
- menos de una falsa alerta molesta por sesión de prueba;
- mayoría comprende qué datos se envían;
- flujo completo sin error en tres demostraciones consecutivas.

## Validación de mercado

Crear landing con:

- propuesta;
- demo;
- privacidad;
- precio hipotético;
- botón “Unirme al piloto”.

Probar:

- gratuito;
- pago único;
- plan Pro mensual;
- licencia educativa.

No cobrar durante la hackathon salvo que exista capacidad de soporte real.
