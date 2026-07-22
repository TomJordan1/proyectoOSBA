# ADR-017: Capa de aprendizaje y dirección de evolución (post-MVP)

## Estado

Aceptada como **dirección de evolución**. Implementación **posterior al MVP** (no se programa todavía; no amplía el alcance del MVP del hackathon).

## Contexto

Se busca que Laminar elija la mejor intervención aprendiendo del historial del usuario, manteniendo el sistema **ligero, barato y privado**, y reduciendo llamadas al LLM con el uso. Durante el diseño se evaluaron varias técnicas y se aclararon confusiones comunes (RAG vs entrenamiento, caché de app vs prompt caching, detección vs decisión, pathfinding vs aprendizaje).

## Decisión

Adoptar una arquitectura en cascada por capas, todas **posteriores al MVP**:

1. **Detección (local, gratis):** estadística sobre la línea base del usuario (z-scores `delete_z`/`switch_z`/`cursor_z`, ya presentes). Evolución opcional a una **red neuronal pequeña local** solo si la estadística resulta insuficiente. Debe permanecer **liviana** (no un LLM local).
2. **Capa de aprendizaje (local, 0 tokens):** una **tabla de historial / bandit contextual** que mapea "firma de situación → acción → tasa de éxito", alimentada por el **feedback que ya se recoge** (`helpful`/`not_now`/`false_positive`/`dismissed`). Para situaciones conocidas elige la acción con mejor tasa de éxito, sin llamar al LLM. Aprende con el uso, por lo que **reduce el costo variable con el tiempo**.
3. **Decisión con LLM (nube, tokens, acotada):** solo para situaciones **nuevas o ambiguas**. Se elige el **modelo pequeño de Bedrock más barato que pase una evaluación** (umbrales: tool-selection ≥95%, esquema ≥99%, cero errores en contexto protegido, p95 ≤3 s), no por fama. Cada decisión nueva + feedback **realimenta** la tabla de la capa 2.
4. **RAG (opcional, avanzado):** versión sofisticada de la capa 2 (recuperar casos similares por similitud) para **personalización**, no para abaratar. Suma tokens de entrada; usar solo si la tabla simple se queda corta.
5. **Fine-tuning (inversión inicial opcional):** ajustar el modelo pequeño para acertar el tool-use con prompts más cortos → llamadas más baratas y consistentes.

### Descartes explícitos

- **Dijkstra / BFS:** descartados. El problema es una **decisión de un paso con costos aprendidos del feedback**, no la búsqueda del camino más corto en un grafo con costos conocidos. La técnica correcta es bandit contextual / recuperación de casos.
- **LLM local pesado (p. ej. Ollama):** descartado por **peso en la máquina del usuario**; contradice la promesa de ligereza. "Claude local" además no existe (Claude solo por API/Bedrock).
- **Caché compartida en Redis/ElastiCache:** descartada para el MVP por **costo fijo por hora**; se prefiere **DynamoDB** (serverless, TTL, pago por uso). `Prompt caching` de Bedrock queda como optimización menor (prompts ya son cortos).

## Consecuencias

### Positivas

- Costo variable **decreciente con el uso** (la capa de aprendizaje evita llamadas).
- Detección y aprendizaje **locales, privados y ligeros**; el LLM queda como último recurso acotado.
- Reutiliza señales ya existentes (feedback, caché por banda) sin rediseñar.

### Negativas / riesgos

- Añade componentes a mantener y **amplía alcance**: por eso es post-MVP y requiere su propia planificación.
- La tabla de aprendizaje necesita datos/feedback suficientes para ser útil (arranque frío).
- Debe vigilarse que la NN/ML de detección no comprometa la ligereza.

## Relación con otras decisiones

Complementa [[ADR-015]] (FinOps: puertas + presupuesto) y [[ADR-016]] (B2B2E). No modifica los contratos de decisiones ni el alcance del MVP. Cualquier implementación de estas capas debe abrir su propia tarea en `HOJA_RUTA_B2B2E.md` (sección futura) con criterios de aceptación.

## Nota sobre despliegue

Ninguna de estas capas requiere Docker en el producto: la detección y el aprendizaje corren **local en el agente .NET**, y la caché/persistencia usa **DynamoDB** (serverless). Docker sigue siendo únicamente una utilidad **opcional de desarrollo** (`sam local`).
