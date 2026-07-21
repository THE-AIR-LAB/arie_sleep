# Headless Sleep Therapist → React Native

Deploy `sleep-therapist` (Next.js 16) as a headless API on Vercel and consume it
from a React Native / Expo app. Authentication is done with **Clerk Bearer
tokens** — the RN app sends the Clerk session token in the `Authorization`
header, which `clerkMiddleware()` already understands.

---

## Architecture

The sleep therapist is already API-first. No browser is required — the RN app is
just an HTTP client to these three endpoints:

| Step | Endpoint | Body | Returns |
|------|----------|------|---------|
| 1. Start a session | `POST /api/conversations` | `{ "topic": "sleep", "title": "Sleep chat" }` | `{ "id": "<uuid>" }` |
| 2. Send a message | `POST /api/chat/sleep/base` *(or `/ft-1`)* | `{ "conversationId", "userMessage" }` | assistant reply text (or `{ content, ... }` when `trace: true`) |
| 3. Load history | `GET /api/conversations/[id]/messages` | — | `{ messages: [...] }` |

State (conversations + messages) lives in **Supabase**, keyed by the Clerk user,
so each request is stateless — ideal for mobile.

Relevant server files:
- `proxy.ts` — Clerk middleware (auth gate for `/api/**`)
- `app/api/chat/route.ts` → `createChatPostHandler` (`authenticate: () => auth()`)
- `app/api/chat/sleep/[trainingStage]/route.ts` — `base` and `ft-1` stages
- `app/api/conversations/route.ts` — create/list conversations
- `app/lib/admin-auth.ts` → `getRequestUserUUID()` (also uses `auth()`)

---

## Why auth is the only real work

Every route gates on Clerk:

```ts
const { userId } = await auth();   // @clerk/nextjs/server
if (!userId) return 401;
```

In the browser, `auth()` reads the Clerk **session cookie**. React Native has no
cookie tied to the domain, so instead the RN app sends the session token as
`Authorization: Bearer <token>`. `clerkMiddleware()` reads that header
automatically — **no change to the route handlers is needed.**

The RN app must point at the **same Clerk instance** as this repo (same
publishable key: `NEXT_PUBLIC_AIR_CLERK_PUBLISHABLE_KEY`).

---

## Task list

### Server (this repo) — DONE
- [x] `proxy.ts` — add `authorizedParties` (driven by `AIRLAB_AUTHORIZED_PARTIES`)
      so Clerk accepts tokens presented by headless clients.
- [x] `proxy.ts` — add CORS + OPTIONS preflight handling (driven by
      `AIRLAB_ALLOWED_ORIGINS`) so a browser React app on another origin can call
      the API. localhost is auto-allowed in dev.
- [x] `.env.example` — document `AIRLAB_ALLOWED_ORIGINS` + `AIRLAB_AUTHORIZED_PARTIES`.
- [x] Typecheck passes (`npx tsc --noEmit`).
- [ ] Set both env vars in Vercel Production before native/prod use.

### Standalone React web test client — DONE
`examples/react-web-client/` — a Vite + React + `@clerk/clerk-react` app that
exercises the full flow with Bearer auth. See its README to run it. This is the
recommended way to smoke-test the headless API before building React Native.
`src/sleepApi.ts` is the reusable client (drop-in analog for the RN version).

### Deploy (Vercel — project `sleep-therapist`, already linked)
Ensure Production env vars are set:
- `AIR_CLERK_SECRET_KEY`, `NEXT_PUBLIC_AIR_CLERK_PUBLISHABLE_KEY`
- `AIRIE_OPENAI_API_KEY`, `AIRLAB_FT_SLEEP_STAGE_1`
- `NEXT_PUBLIC_AIRLAB_SUPABASE_URL`, `NEXT_PUBLIC_AIRLAB_SUPABASE_ANON_KEY`,
  `AIRLAB_SUPABASE_SERVICE_ROLE_KEY`
- `AIRLAB_AUTHORIZED_PARTIES` (new)

Deploy: `vercel --prod` (or the `/vercel:deploy prod` skill).

### React Native app (separate repo)
- [ ] Install `@clerk/clerk-expo` + secure token cache.
- [ ] Wrap the app in `<ClerkProvider publishableKey={NEXT_PUBLIC_AIR_CLERK_PUBLISHABLE_KEY}>`.
- [ ] Add an `authedFetch` helper that attaches `Authorization: Bearer ${await getToken()}`.
- [ ] Build the sleep chat screen against the 3 endpoints above.

---

## RN client reference

```ts
import { useAuth } from '@clerk/clerk-expo'

const API = 'https://sleep-therapist.vercel.app'

function useSleepApi() {
  const { getToken } = useAuth()

  const authedFetch = async (path: string, init: RequestInit = {}) => {
    const token = await getToken()
    return fetch(`${API}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    })
  }

  const startSession = async () =>
    (await (await authedFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ topic: 'sleep', title: 'Sleep chat' }),
    })).json()).id as string

  const sendMessage = async (conversationId: string, userMessage: string) =>
    (await authedFetch('/api/chat/sleep/base', {
      method: 'POST',
      body: JSON.stringify({ conversationId, userMessage }),
    })).text()

  return { startSession, sendMessage }
}
```

---

## Notes / gotchas
- **Same Clerk instance** on both sides, or tokens won't verify.
- **`base` vs `ft-1`**: `base` uses the general stateful runtime; `ft-1` uses the
  fine-tuned model `AIRLAB_FT_SLEEP_STAGE_1`. Pick per training stage.
- **CORS** only matters for Expo web, not native.
- **Token expiry**: `getToken()` returns a short-lived JWT; call it per request
  (as above) rather than caching it.
- **Anonymous users**: not supported by this plan — every call needs a signed-in
  Clerk user, since conversations are keyed by `user_id`.
