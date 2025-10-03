# Spotify Provisional Frontend

Proyecto Next.js mínimo para probar autenticación con Supabase + Spotify y enviar el provider token a un backend local.

Cómo usar (resumen):

1. Copiar `.env.local.example` a `.env.local` y rellenar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Instalar dependencias: `npm install`.
3. Correr en dev: `npm run dev` (sitio en http://localhost:3001).

El componente principal está en `src/components/SpotifyLogin.tsx`. Cuando el usuario se autentique, el código enviará un POST a `http://localhost:3000/callback` con `{ provider_token }`.

Este proyecto es propositalmente simple y provisional.
