# Dev Container — Kandace

Entorno de desarrollo reproducible dentro de Docker. Trae **Node 20 + .NET 8 SDK + AWS SAM CLI + AWS CLI**, sin instalar nada en tu Windows. Al borrar el contenedor no queda nada.

## Requisitos

- Docker Desktop
- VS Code + extensión "Dev Containers"

## Uso

1. Abre la carpeta `Proyecto/` en VS Code.
2. Command Palette → "Dev Containers: Reopen in Container".
3. Espera a que `post-create.sh` instale SAM CLI y las dependencias del backend.
4. Dentro del contenedor:

```bash
cd backend && npm test          # 41 pruebas
cd desktop-agent && dotnet build && dotnet test
cd infrastructure && sam validate --lint && sam build
```

## Notas

- Incluye **docker-in-docker** para poder usar `sam local` dentro del contenedor.
- Es **solo para desarrollo**: no forma parte del producto ni se entrega al usuario final (ver ADR-017).
- No verificado en esta sesión (no hay Docker en el entorno de trabajo actual); se probará al abrirlo en tu equipo.
