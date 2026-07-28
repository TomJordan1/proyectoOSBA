# Kandace — prototipo SaaS B2B2E

Abra `index.html` en Chrome, Edge o Firefox. No requiere servidor ni instalación.

## Incluye
- Dashboard organizacional agregado.
- Simulación del acompañante Kandace Personal.
- Gestión de dispositivos y revocación.
- Flujo de activación por enlace temporal.
- Políticas de privacidad.
- Insights organizacionales.
- Prompts UX/UI copiables.

## Nota de arquitectura
No conviene autorizar únicamente por IP porque cambia con frecuencia, puede compartirse por NAT y no identifica de forma segura un dispositivo. Para producción use `organization_id + device_id criptográfico + certificado/token`, con conexión HTTPS saliente por puerto 443. La IP puede usarse como señal secundaria o restricción opcional de red.
