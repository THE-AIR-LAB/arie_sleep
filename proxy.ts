import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedDemoRoute = createRouteMatcher([
  '/demo/nutrition/expert(.*)',
  '/demo/nutrition/input(.*)',
  '/demo/nutritian/input(.*)',
  '/demo/general-orchestration-daemon/input(.*)',
  '/sandbox(.*)',
])

// Routes the restricted "air" login may not reach directly. These mirror what
// SiteNavbar / the demo page hide for "air" users: the "Details" page and the
// General Orchestration Daemon (GOD) card.
const isAirBlockedRoute = createRouteMatcher([
  '/technical(.*)',
  '/demo/general-orchestration-daemon(.*)',
])

// AIR_CLERK_* are the project-specific Clerk credentials; we override the
// default CLERK_* lookup so this project can deploy alongside another
// Clerk-using project on Vercel without env-var collisions.
const secretKey =
  process.env.AIR_CLERK_SECRET_KEY ?? process.env.CLERK_SECRET_KEY
const publishableKey =
  process.env.NEXT_PUBLIC_AIR_CLERK_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// ── Cross-origin (CORS) support for headless clients ────────────────────────
// A standalone React web app (e.g. Vite on http://localhost:5173) or a native
// app runs on a different origin than this API, so the browser enforces CORS.
// Allowed origins come from AIRLAB_ALLOWED_ORIGINS (comma-separated); localhost
// origins are always allowed in development for convenience.
const configuredAllowedOrigins = (process.env.AIRLAB_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  if (configuredAllowedOrigins.includes(origin)) return true
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return true
  }
  return false
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const clerk = clerkMiddleware(
  async (auth, request) => {
    // "air" users are redirected away from routes reserved for the "us" login.
    if (
      request.cookies.get('siteAuthType')?.value === 'air' &&
      isAirBlockedRoute(request)
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/demo'
      return NextResponse.redirect(url)
    }

    if (isProtectedDemoRoute(request)) {
      await auth.protect()
    }
  },
  {
    secretKey,
    publishableKey,
    // Headless clients (standalone React web, React Native / Expo) authenticate
    // by sending the Clerk session token as `Authorization: Bearer <token>`
    // instead of a cookie. clerkMiddleware() reads that header automatically;
    // authorizedParties tells Clerk which callers may present a token so `azp`
    // claims are accepted. AIRLAB_AUTHORIZED_PARTIES is a comma-separated list
    // (deployment URL, app id, dev origin).
    authorizedParties: (process.env.AIRLAB_AUTHORIZED_PARTIES ?? '')
      .split(',')
      .map((party) => party.trim())
      .filter(Boolean),
  }
)

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const origin = request.headers.get('origin')
  const allowed = isOriginAllowed(origin)

  // Answer CORS preflight before Clerk runs — the browser sends OPTIONS with no
  // credentials, so it must never hit auth.
  if (request.method === 'OPTIONS' && origin) {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? corsHeaders(origin) : {},
    })
  }

  const response = (await clerk(request, event)) ?? NextResponse.next()

  if (allowed && origin) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
