# Arquitectura B2B2E

## Componentes

### Kandace Personal
- sensores mínimos;
- línea base;
- fricción;
- decisión;
- intervención;
- feedback;
- historial local;
- transparencia;
- publicación agregada.

### Kandace Cloud
- endpoint de decisiones;
- Bedrock;
- validación;
- endpoint de métricas;
- agregación;
- privacidad;
- almacenamiento;
- FinOps.

### Kandace Teams
- tendencias;
- muestra;
- retraso;
- privacidad;
- recomendaciones;
- sin personas.

## Diagrama

```text
LAMINAR PERSONAL
sensores → fricción → agente → intervención
                    ↓
              paquete agregado
                    ↓
LAMINAR CLOUD
decisiones + agregación + privacidad
                    ↓
LAMINAR TEAMS
tendencias colectivas + acciones organizacionales
```

## Canales separados

### Decisiones
`desktop → /v1/decisions → Bedrock → desktop`

### Agregación
`desktop → /v1/team-metrics → aggregator → dashboard`

No mezclar ambos canales.

## Identidad técnica

- installation_token rotativo;
- organization_id;
- team_id;
- sin nombre;
- sin correo;
- sin user_id en métricas.

## Política MVP

```text
window = 15 minutos
minimum_group_size_demo = 5
recommended_production_group_size = 8
dashboard_delay = 60 minutos
retention = 30 días
```

K=5 no garantiza anonimato perfecto.

## AWS

- API Gateway;
- Lambda Decision;
- Lambda Aggregation;
- Bedrock;
- DynamoDB;
- CloudWatch;
- Amplify.

No usar EC2, RDS, AgentCore ni TimescaleDB.
