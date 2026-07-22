# Seguridad

## Reporte

No publicar vulnerabilidades en issues abiertas. Crear un canal privado antes de la publicación.

## Secretos

- no guardar claves AWS;
- usar perfiles locales o roles;
- `.env` fuera del repositorio;
- incluir `.env.example`;
- rotar cualquier secreto expuesto.

## Principio de mínimo privilegio

Lambda solo debe poder:

- invocar el modelo aprobado;
- escribir/leer las tablas necesarias;
- publicar logs definidos.

## Desktop

- no ejecutar comandos del modelo;
- no descargar código remoto;
- validar acciones;
- limitar duración;
- permitir cierre;
- verificar endpoint;
- no elevar privilegios innecesariamente.
