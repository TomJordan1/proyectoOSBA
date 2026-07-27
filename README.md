# KANDACE

**Agente especializado, local-first y privado, que ayuda a desarrolladores y trabajadores a recuperar el foco — sin vigilarlos.**

Kandace detecta *localmente* señales abstractas de fricción digital (correcciones frecuentes, cambios de ventana, movimiento inestable del cursor) y, cuando la fricción es sostenida y el contexto lo permite, ofrece un micro-respiro opcional (pausa activa / burbujas). Un LLM actúa como **motor de decisión** para elegir la acción adecuada entre varias herramientas seguras. La empresa financia una herramienta de **autocuidado** y solo recibe **tendencias grupales**, nunca datos individuales.

> Reto: **Agentes especializados**. Modelo de producto: **B2B2E** (Business-to-Business-to-Employee).

## Los tres componentes

| Componente | Qué es | Tecnología |
|---|---|---|
| **Kandace Personal** | Agente de escritorio del trabajador: sensores, detección, intervención, todo local. Corre en segundo plano con una mascota y un icono de bandeja. | .NET 8 · C# · WPF |
| **Kandace Cloud** | Backend serverless: motor de decisión (LLM) + agregación con privacidad. | AWS API Gateway · Lambda (TypeScript) · Bedrock · DynamoDB |
| **Kandace Teams** | Dashboard colectivo para RR. HH.: tendencias grupales, sin personas ni rankings. | React · TypeScript · Amplify (demo en HTML) |

**Dos canales separados que no se mezclan:** decisiones (`/v1/decisions`, `/v1/feedback`) y agregación (`/v1/team-metrics`, `/v1/teams/{teamId}/summary`). El canal de agregación **nunca** lleva identidad humana (`installation_token` rotativo; prohibido `user_id`, nombre o correo). Los grupos con menos de 5 contribuyentes se **suprimen**.

## Estado de avance

Todo lo siguiente corre **localmente, sin coste y sin nube**:

| Área | Estado | Evidencia |
|---|---|---|
| Backend de decisión (motor + guardas + FinOps + agregación) | ✅ Implementado y probado | **48 pruebas verdes** (`cd backend && npm test`) |
| Motor Bedrock (Converse API + tool use) | ✅ Lógica lista tras interruptor | Probado con cliente inyectado; sin llamar a AWS |
| Desktop .NET (agente en segundo plano, mascota, bandeja, recuperación con burbujas, modo automático) | ✅ Compila y prueba en Windows | `dotnet build` + `dotnet test` (5/5) |
| Dashboard Teams (demo) | ✅ Funciona sin build | `dashboard/index.html` |
| Contratos ejecutables (JSON Schema) | ✅ | `contracts/` |
| Bedrock **real** (encendido en AWS) | ⏳ Pendiente supervisado | Requiere elegir modelo + desplegar |
| Persistencia en nube / multi-tenant / login de RR. HH. | 🗺️ Roadmap | Ver `docs/decisiones/` |

Hoy el "cerebro" usa un proveedor **mock determinista** y los sensores están **simulados** con una base realista de oficinista; la lógica de decisión, privacidad y agregación es real y está probada. Nada se despliega ni llama a AWS todavía.

## Estructura del repositorio

```text
.
├── README.md · LICENSE · SECURITY.md · CONTRIBUTING.md
├── backend/            Orquestador TypeScript (Lambda): decisiones + agregación + FinOps + pruebas
├── desktop-agent/      Agente .NET 8 / WPF (Kandace Personal)
├── dashboard/          Kandace Teams (demo HTML + datos de ejemplo)
├── infrastructure/     AWS SAM (plantilla, sin desplegar)
├── contracts/          JSON Schema de los contratos + fixtures de escenarios
├── tests/              Notas de pruebas
└── docs/
    ├── arquitectura/   Arquitectura, FinOps, guía AWS, referencias
    ├── contratos/      Contratos de API (decisiones y B2B2E)
    ├── privacidad/     Privacidad, ética y gobierno de datos
    ├── producto/       Criterios, validación, demo/pitch, negocio
    ├── decisiones/     Decisiones técnicas + ADRs (docs/adr)
    └── diagrams/       Diagramas (Mermaid)
```

## Cómo ejecutarlo

**Backend (Node ≥ 20):**
```bash
cd backend
npm install
npm test            # 48 pruebas
npm run demo:b2b2e  # muestra los dos canales (A–F) sin AWS
```

**Desktop (Windows + .NET 8 SDK):**
```bash
cd desktop-agent
dotnet build
dotnet run --project src/Kandace.App   # agente en segundo plano (mascota + bandeja)
```

**Dashboard Teams (demo, sin build):**
```bash
cd dashboard
python -m http.server 8080   # abrir http://localhost:8080/
```

## Privacidad y ética

Local-first y *content-blind*: **nunca** se capturan texto, teclas, títulos de ventana, URLs, archivos ni capturas. Solo métricas abstractas y contexto booleano. El detalle personal se queda en el equipo; a la nube solo suben agregados. No hay diagnóstico clínico, ni rankings, ni evaluación de personas. Las intervenciones son breves, opcionales y siempre cancelables (Esc / Salir), con tope de 60 s y modo de reducción de movimiento. Detalle en `docs/privacidad/`.

## Arquitectura

Resumen del flujo (diagrama en `docs/diagrams/vertical-decision-flow.mermaid`):

```text
Sensores locales → detección (estadística) → puertas (contexto/cooldown/presupuesto)
→ caché → [LLM solo si es ambiguo] → doble validación → intervención → feedback → agregado
```

El LLM se invoca **rara vez y con tope de coste** (la mayoría de decisiones se resuelven local). Ver `docs/arquitectura/` y las decisiones en `docs/decisiones/`.

## Roadmap (resumen)

1. **Ahora (sin AWS):** agente local automático, dashboard demo, publicación en GitHub.
2. **Con AWS (supervisado):** encender Bedrock real + desplegar API/Lambda/DynamoDB → persistencia de agregados.
3. **SaaS multi-tenant:** login de RR. HH., aislamiento por empresa, gestión de usuarios y configuración desde el dashboard.

## Licencia

MIT — ver [LICENSE](LICENSE).
