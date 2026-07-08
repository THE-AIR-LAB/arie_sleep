# Sleep Therapist — Standalone React Web Client

A minimal Vite + React app that talks to the headless Sleep Therapist API using
Clerk Bearer-token auth. Use it to test the API end-to-end from a real browser
before building the React Native app.

## How it authenticates

The browser app and the API are on **different origins**, so:

1. It signs the user in with `@clerk/clerk-react` (same Clerk instance as the
   sleep-therapist app — same publishable key).
2. For each request it attaches the Clerk session token:
   `Authorization: Bearer <getToken()>`.
3. The Next.js middleware (`proxy.ts`) allows the origin via CORS and Clerk
   verifies the Bearer token — no cookie needed.

## Prerequisites (in the sleep-therapist app)

Set these env vars where the Next.js app runs (`.env` locally, Vercel in prod):

```
AIRLAB_ALLOWED_ORIGINS=http://localhost:5173
AIRLAB_AUTHORIZED_PARTIES=http://localhost:5173,http://localhost:3000
```

Then start the API: `npm run dev` (defaults to http://localhost:3000).

## Run this client

```bash
cd examples/react-web-client
cp .env.example .env       # then fill in the two values
npm install
npm run dev                # http://localhost:5173
```

`.env`:
- `VITE_CLERK_PUBLISHABLE_KEY` — same value as
  `NEXT_PUBLIC_AIR_CLERK_PUBLISHABLE_KEY` in the sleep app.
- `VITE_API_BASE_URL` — `http://localhost:3000` (or your Vercel URL).

## What to expect

Sign in → type a message → the app creates a `sleep` conversation on the first
send and streams the therapist's reply back. See `src/sleepApi.ts` for the exact
calls — that file is the reusable API client.
