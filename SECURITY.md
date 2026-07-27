# Seguridad

## Reporte de vulnerabilidades

No publicar vulnerabilidades en issues abiertas. Usar un canal privado antes de cualquier divulgación.

## Gestión de secretos

- **Nunca** commitear claves AWS, API keys, tokens, secret access keys, cadenas de conexión, claves privadas ni certificados.
- **Desarrollo local:** variables en `.env` (ignorado por git). Ver `.env.example` para la lista.
- **Producción / deploy:** pasar secretos como parámetros del deploy (`sam deploy --parameter-overrides`) o, mejor, con **AWS Secrets Manager** / **SSM Parameter Store**. No fijarlos en el repo ni en `samconfig.toml` (ignorado).
- **Agente de escritorio:** la API key y el código de prueba viven en `kandace.settings.json` junto al ejecutable (ignorado por git). No se hornean en el código.
- **Frontend:** solo valores públicos (URL de API, Client ID de Cognito SPA). Nunca secretos del lado cliente.
- Rotar de inmediato **cualquier** secreto que se haya expuesto (chat, captura, log, commit).

### Dónde vive cada secreto

| Secreto | Dónde se configura | Ignorado por git |
|---|---|---|
| `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` | Parámetro del deploy → env de la Lambda `DecisionFunction` | sí (nunca en repo) |
| API key de API Gateway | `kandace.settings.json` (desktop) | sí |
| Código de prueba | `kandace.settings.json` / tabla DynamoDB `TrialCodes` | sí |
| Credenciales AWS | `aws configure` (perfil local) | sí (`.aws/`) |

## Rotación de credenciales (procedimiento)

Si una credencial se considera comprometida:

- **AWS Access Keys:** IAM → Users → *Security credentials* → desactivar y eliminar la key vieja → crear una nueva → `aws configure`. (Lo más crítico: da acceso total a la cuenta.)
- **DeepSeek:** revocar en el panel de DeepSeek y generar otra; redeploy con la nueva.
- **Anthropic:** revocar en `console.anthropic.com`.
- **API Gateway key:** crear una nueva en el usage plan, actualizar `kandace.settings.json`, borrar la vieja.
- **Código de prueba:** poner `active:false` en la tabla `TrialCodes` (revoca el acceso a IA de ese código).

> Nota: agregar un archivo a `.gitignore` **no** lo borra del historial. Si un secreto ya se commiteó, considéralo comprometido, rótalo, y (con autorización) reescribe el historial (`git filter-repo` / BFG). No ejecutar reescrituras de historial sin acordarlo.

## Principio de mínimo privilegio (IAM)

La Lambda `DecisionFunction` solo puede: invocar el modelo aprobado, leer/escribir la tabla de códigos de prueba y publicar sus logs. Las funciones de agregación solo acceden a la tabla de agregados (CRUD/lectura según el caso). Sin permisos amplios `*`.

## Comunicaciones y datos

- **En tránsito:** todo HTTPS (API Gateway/TLS).
- **En reposo:** DynamoDB cifrado por defecto (AWS-managed).
- **Content-blind:** el sistema nunca procesa contenido (teclas, títulos, pantalla). Solo señales abstractas y agregados. Ver `docs/privacidad/PRIVACIDAD_Y_ETICA.md`.
- **Logs:** content-blind por diseño; nunca registrar el payload de decisiones, el código de prueba ni secretos. Los handlers loguean solo `action`, `reason_code`, `decision_source`, `latencyMs`.

## Rate limiting y topes

- API Gateway: usage plan (1 req/s, 1000/mes).
- `ServerBudgetGate`: tope por hora/día de llamadas al LLM.
- Gate de códigos de prueba: tope de gasto por usuario (`TRIAL_MAX_CALLS`).

## Comandos de auditoría

```bash
# Buscar posibles secretos en archivos rastreados (revisar resultados, no pegarlos)
git grep -nI -E "AKIA[0-9A-Z]{16}|sk-ant-|sk-[a-f0-9]{20,}|aws_secret_access_key"

# Confirmar que no se rastrean archivos sensibles
git ls-files | grep -iE "settings\.json|samconfig\.toml|\.env$|\.pem|\.key|credentials"

# Dependencias vulnerables
cd backend && npm audit
cd desktop-agent && dotnet list package --vulnerable
```

## Agente de escritorio

- No ejecuta comandos ni descarga código remoto; solo aplica acciones validadas de un conjunto cerrado.
- Doble validación de la respuesta del backend (`ResponseValidator`) antes de actuar; límite de duración; siempre permite cerrar/pausar.
- Sensores content-blind (sin hooks globales); la luz ambiental solo lee luminancia promedio, nunca contenido.
- Verifica el endpoint configurado; no eleva privilegios (instalación por usuario, sin admin).
