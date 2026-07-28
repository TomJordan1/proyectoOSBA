# Matriz de criterios de la hackathon

## Objetivo estratégico

No buscar puntuación mediante cantidad de funciones. Cada evidencia debe conectar con un criterio.

## 1. Impacto tecnológico — 30 %

### Mensaje

Kandace resuelve las interrupciones descontextualizadas y reduce la necesidad de monitoreo invasivo.

### Evidencias

- problema puntual;
- cuatro escenarios;
- prueba con usuarios;
- tasa de intervenciones aceptadas;
- cantidad de interrupciones evitadas;
- historia enfocada en desarrolladores y estudiantes.

### Meta

- demo comprensible en menos de 60 segundos;
- resultados exploratorios reales;
- limitaciones transparentes.

## 2. Innovación — 30 %

### Ventajas técnicas

- procesamiento local;
- cero contenido en payload;
- invocación por eventos;
- herramientas restringidas;
- revalidación local;
- fallback;
- explicación mediante `reason_code`;
- UI sensorial diferenciada.

### Métricas

- CPU y memoria;
- bytes por solicitud;
- llamadas Bedrock frente a eventos locales;
- latencia p50/p95;
- porcentaje de decisiones bloqueadas por guardas;
- cobertura de pruebas.

## 3. Software funcional y entregables — 30 %

### Evidencias

- repositorio;
- README;
- release;
- demo online;
- video;
- arquitectura;
- casos de uso;
- pruebas;
- modo demo;
- fallback.

### Regla

La vertical completa tiene prioridad sobre cualquier mejora visual o funcional adicional.

## 4. AWS y Kiro — 10 %

### AWS central

- Bedrock decide;
- API Gateway expone;
- Lambda orquesta;
- DynamoDB registra;
- Amplify publica;
- CloudWatch observa.

### Kiro/Claude

- especificaciones;
- skills;
- CLAUDE.md;
- ADR;
- contratos;
- pruebas;
- historial;
- documentación del proceso.

## Checklist antes de entregar

- [ ] El LLM decide entre más de dos herramientas.
- [ ] El LLM no se usa solo para redactar mensajes.
- [ ] AWS aparece en el diagrama y en la demo.
- [ ] Existe una URL pública.
- [ ] Existe un ejecutable o instrucciones reproducibles.
- [ ] El video muestra el flujo real.
- [ ] No se afirma diagnóstico psicológico.
- [ ] El README explica privacidad.
- [ ] Los datos de demo están identificados.
- [ ] El repositorio no contiene secretos.
