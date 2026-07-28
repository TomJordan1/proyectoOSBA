# Desktop Agent (.NET 8 / WPF)

Agente Windows local-first. Content-blind: transforma señales en métricas abstractas antes de comunicarse. El motor de decisión vive en el backend (LLM); el desktop agrega, aplica puertas locales, llama al cliente y **revalida** la respuesta antes de ejecutar.

## Estructura de la solución

```text
desktop-agent/
├── Kandace.sln
├── Directory.Build.props        (net8.0, nullable, warnings-as-errors)
├── src/
│   ├── Kandace.Domain/          Contratos, enum de 5 acciones, IAgentClient
│   ├── Kandace.Friction/        FrictionOptions, SustainedAnomalyGate (G2)
│   ├── Kandace.Context/         ContextGate, CooldownGate, LocalBudgetGate (token bucket), CircuitBreaker
│   ├── Kandace.AgentClient/     MockAgentClient (demo), HttpAgentClient (esqueleto), ResponseValidator (doble validación)
│   ├── Kandace.Interventions/   IIntervention + do_nothing / subtle_notification / postpone + router
│   ├── Kandace.App/             WPF (net8.0-windows) — modo demo con botones A-D, quiet mode, salida
│   └── Kandace.DemoConsole/     net8.0 — recorre A-D sin AWS (buildable multiplataforma)
└── tests/
    └── Kandace.Domain.Tests/    xUnit — 4 escenarios + revalidación >60 s
```

## Estado de verificación

**Verificado en Windows con .NET 8 SDK (2026-07-22):** `dotnet build` → *Compilación correcta*, 0 advertencias, 0 errores (incluida la app WPF `Kandace.App`, `net8.0-windows`). `dotnet test` → **5/5** pruebas xUnit verdes.

Regenerar la solución si hace falta:

```bash
dotnet new sln -n Kandace --force
dotnet sln add (Get-ChildItem -Recurse -Filter *.csproj)   # PowerShell
dotnet build && dotnet test
```

Nota: el tipo de dominio `Friction` se referencia como `Kandace.Domain.Friction` dentro de proyectos `Kandace.*` para evitar el choque con el namespace `Kandace.Friction`.

## Comandos (cuando exista el SDK .NET 8)

```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project src/Kandace.DemoConsole    # escenarios A-D sin AWS (multiplataforma)
dotnet run --project src/Kandace.App            # UI WPF (solo Windows)
```

## Alcance actual

Implementado: modo demo, puertas locales, cliente mock intercambiable, doble validación, quiet mode, salida, reducción de movimiento. **Pendiente** (fases posteriores, no simulado): `launch_bubble_recovery` visual, `enable_quiet_mode` completo, sensores reales (hooks), cliente HTTP contra endpoint real.
