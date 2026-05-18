# Seguridad de plataformas GDLP

## Variables obligatorias en produccion

Configura secretos reales antes de desplegar:

```text
PLACETA_API_SECRET
PLACETA_API_APP_ID
GDLP_ADMIN_KEY
PERIODICO_ADMIN_KEY
TRIBUTOS_READ_KEY
PLACETA_DEVELOPER_API_KEY
PLACETA_DEVELOPER_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

En produccion, las APIs editoriales y fiscales no aceptan claves por defecto.

## Endpoints protegidos

- `POST /api/gdlp-news`: requiere `x-gdlp-admin-key`.
- `POST /api/periodico-news`: requiere `x-gdlp-admin-key`.
- `GET /api/tributos-weekly`: requiere `x-tributos-key`.
- `POST /api/stripe-donations`: crea PaymentIntent sin exponer la clave secreta de Stripe.
- `POST /api/stripe-donations/confirm`: consulta Stripe antes de registrar puntos.
- `POST /api/stripe-donations/webhook`: valida `stripe-signature`.

Las comparaciones de claves usan `crypto.timingSafeEqual` para evitar filtraciones por timing.

## Cabeceras

`next.config.mjs` aplica:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictivo
- `Content-Security-Policy` con `frame-ancestors 'none'`

## Notas operativas

No pongas claves en query string. Usa cabeceras HTTP o formularios con almacenamiento local del navegador cuando sea necesario.

Rota cualquier clave que haya sido compartida en chat, capturas, repositorios o despliegues de prueba.
