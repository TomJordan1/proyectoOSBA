# ADR-018: Persistencia real — patrón repositorio + DynamoDB single-table

## Estado

Aceptada (2026-07-23). Capa de repositorio implementada y probada; la conexión real a DynamoDB se activa en el despliegue supervisado.

## Contexto

El canal de agregación guardaba los paquetes de equipo **en memoria** (Map dentro de la Lambda), por lo que los datos **no persistían** entre invocaciones/contenedores. Para tener datos reales y persistentes hay que respaldarlos en un almacén durable, sin acoplar la lógica de negocio al proveedor.

## Decisión

Introducir un **patrón repositorio** (`AggregateStore`) con dos implementaciones que comparten el mismo contrato:

- `InMemoryAggregateStore` — desarrollo, pruebas y modo demo (no persiste).
- `DynamoAggregateStore` — producción, sobre un **cliente Document inyectable** (`DocClient`) para no depender de la SDK de AWS al compilar/probar. El adaptador real a `@aws-sdk/lib-dynamodb` se crea en el despliegue (documentado en `aggregation/store.ts`).

El `Aggregator` pasa a ser **asíncrono** (`ingest`/`summarize` devuelven `Promise`) y recibe el store por inyección. Diseño **single-table**: `pk = "ORG#<org>#TEAM#<team>"`, `sk = "WINDOW#<window_start>#<installation_token>"`, atributo `ttl` (retención 30 días). La tabla ya está declarada en `infrastructure/template.yaml` (`AggregatesTable`).

> **Corrección (2026-07-23, despliegue real):** la `sk` incluye ahora el `installation_token`. La versión inicial (`sk = "WINDOW#<window_start>"`) hacía que varios contribuyentes en la **misma ventana** compartieran pk+sk y se **sobrescribieran** en DynamoDB (bug no visible con `InMemoryAggregateStore`, que apila en lista). La consulta sigue siendo por rango `WINDOW#<startIso>` … `WINDOW#<endIso>#￿`, así que el sufijo no altera el filtrado temporal.

Persistencia real en dos caminos posibles:

- **Local con DynamoDB Local (Docker):** datos reales y persistentes en la máquina, sin coste ni nube. Ideal para desarrollo.
- **AWS (supervisado):** `sam deploy` crea la tabla real; se inyecta `DynamoAggregateStore` con el cliente de la SDK.

## Consecuencias

### Positivas

- Datos **realmente persistentes** sin reescribir la lógica: solo se cambia la implementación del store.
- La lógica de agregación/privacidad queda testeable con el store en memoria (48 pruebas verdes).
- Diseño single-table eficiente y con TTL (borra agregados viejos automáticamente).

### Negativas / pendientes

- Idempotencia y presupuesto (`IdempotencyStore`, `ServerBudgetGate`) siguen en memoria; para persistencia total conviene moverlos también a DynamoDB (siguiente iteración).
- El adaptador real de la SDK y el `sam deploy` requieren credenciales AWS (paso supervisado, con costo mínimo por uso).

## Verificación

`backend/`: `tsc --noEmit` limpio; `npx vitest run` → **48/48**. `Aggregator` ahora asíncrono con `InMemoryAggregateStore`; demo A–F sigue correcta. `DynamoAggregateStore` compila sin la SDK (cliente inyectable) y trae el adaptador real documentado.
