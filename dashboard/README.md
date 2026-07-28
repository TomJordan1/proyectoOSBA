# Dashboard — Kandace Teams

Vista colectiva para la empresa (RR. HH., People Ops, PMO, líderes). Muestra tendencias grupales para mejorar procesos, **nunca** individuos, rankings ni evaluación de productividad.

## Contenido de esta sesión

- `index.html` — dashboard demo **autónomo** (sin build): tendencia semanal (Chart.js por CDN), tamaño de muestra, estado de privacidad, recomendaciones de proceso. Renderiza dos equipos de ejemplo: `backend` (visible) y `frontend` (grupo insuficiente → dato suprimido).
- `demo-data/summaries.json` — resúmenes agregados de ejemplo (marcados como demo). Mismo shape que `GET /v1/teams/{teamId}/summary`.

## Cómo verlo

Servir la carpeta (fetch del JSON requiere http, no `file://`):

```bash
cd dashboard
python3 -m http.server 8080
# abrir http://localhost:8080/
```

## Estado de verificación

`index.html` es HTML/JS estándar; se puede abrir servido por HTTP. **No** se levantó un servidor en esta sesión (no dejar procesos abiertos), pero no requiere build ni dependencias instaladas. El objetivo de producción es una app **React + TypeScript** en Amplify que consuma el endpoint real; este HTML es la versión demostrable equivalente para el MVP.

## Privacidad (obligatorio)

Con `privacy_status` distinto de `visible` no se muestran métricas. Lenguaje de proceso, no clínico: "la fricción digital agregada aumentó respecto a la línea base", nunca "el equipo está estresado". Ver `PRIVACIDAD_Y_ETICA.md` y `Reestruturacion/GOBIERNO_DATOS.md`.
