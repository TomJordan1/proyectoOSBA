# Demo y pitch

## Mensaje de una frase

Kandace es un agente local-first que detecta fricción digital y utiliza Amazon Bedrock para decidir si debe intervenir, esperar o iniciar una recuperación breve, sin leer el trabajo del usuario.

## Guion de demo

### 1. Problema — 20 segundos

“Los temporizadores interrumpen por horario y el bossware observa demasiado. Kandace busca el momento correcto sin capturar contenido.”

### 2. Estado estable — 20 segundos

- mostrar métricas;
- score bajo;
- Bedrock no es invocado;
- acción: ninguna.

### 3. Fricción disponible — 40 segundos

- simular anomalía;
- mostrar payload;
- Bedrock selecciona `launch_bubble_recovery`;
- ejecutar burbujas;
- guardar feedback.

### 4. Pantalla compartida — 30 segundos

- activar modo protegido;
- anomalía alta;
- Bedrock selecciona `postpone_intervention`;
- no aparece overlay.

### 5. Final de reunión — 20 segundos

- desactivar protección;
- intervención pendiente;
- notificación discreta.

### 6. Arquitectura y métricas — 30 segundos

- eventos locales;
- llamadas Bedrock;
- payload promedio;
- latencia;
- cero contenido;
- AWS.

## Plan B

- video local de respaldo;
- modo demo sin sensores;
- backend mock con mismo contrato;
- fallback local;
- dashboard con dataset marcado como demo.

## Lo que no debe decirse

- detectamos burnout;
- medimos estrés;
- anonimato perfecto;
- IA con control de tu PC;
- precisión clínica;
- solución lista para empresas grandes.

## Cierre

“Kandace demuestra que un agente puede ser útil sin ser invasivo: observa menos, decide mejor y devuelve el control al usuario.”
