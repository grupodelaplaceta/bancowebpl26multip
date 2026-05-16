# Banco de La Placeta Web

Web pública y banca web para Banco de La Placeta.

## Desarrollo

```bash
npm install
npm run dev
```

## Variables Vercel

- `PLACETA_API_BASE_URL`: backend Vercel usado por la app Android.
- `PLACETA_API_APP_ID`: id autorizado por el backend.
- `PLACETA_API_SECRET`: secreto HMAC. Solo vive en server-side, nunca en el navegador.
- `NEXT_PUBLIC_WEB_COMMISSION_PERCENT`: comisión entre cuentas web `GDLP-WXXX-XXXX` y app Android `GDLP-APXX-XXX`.

## Reglas web

- IBAN web: `GDLP-WXXX-XXXX`.
- No hay PlaceZum/NFC en web.
- Las tarjetas se muestran solo como datos. No pagan desde web.
- Las Promo Cards se ven si ya existen, pero solo se registran desde Android.
