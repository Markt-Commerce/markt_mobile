# Markt Mobile

Markt Commerce mobile app — an Expo / React Native marketplace that blends e‑commerce
(products, cart, checkout, Paystack payments), social (posts, likes, comments), and
community (niches, buyer requests) features.

## Getting started

```bash
npm install
cp .env.example .env   # then edit if you need non-default endpoints
npx expo start
```

If Expo Go can't reach the dev server, use a tunnel:

```bash
npx expo start --tunnel
```

## Environment configuration

Backend endpoints are configured via `EXPO_PUBLIC_*` environment variables, which Expo
inlines at build time. Copy `.env.example` to `.env` and set them per environment. When
unset, the app falls back to the **production** backend (see `services/config.ts`).

| Variable | Purpose | Default (production) |
|----------|---------|--------------|
| `EXPO_PUBLIC_API_URL` | REST API base (includes `/api/v1`) | `https://api.marktcommerce.com/api/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO host (namespace appended in `config.ts`) | `https://api.marktcommerce.com` |

> To point a build at the test backend (`https://test.api.marktcommerce.com`), set these
> in `.env` or the EAS build profile in `eas.json`. `.env` is git‑ignored; `.env.example`
> is the tracked template.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npx tsc --noEmit` | Type-check the project |
