# Fixtures de agregación (datos demo, escenarios E–F)

Datos simulados marcados como demo (`scenario: "demo"`), sin identidad humana.

| Escenario | Archivo | Contribuyentes | Resultado esperado |
|---|---|---|---|
| E — grupo suficiente | `scenario-E-group5.json` | 5 | `privacy_status: visible`, resumen con tendencia y recomendaciones |
| F — grupo insuficiente | `scenario-F-group4.json` | 4 | `privacy_status: insufficient_group`, **sin** métricas (dato suprimido) |

El umbral demo es `minimum_group_size_demo = 5` (producción recomendada 8). K=5 no garantiza anonimato perfecto.
