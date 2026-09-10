import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env"

const PUBLIC_PATHS = ["/login"]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function redirectToLogin(request: NextRequest) {
  const { pathname } = request.nextUrl
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/login"
  loginUrl.search = ""
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
  }
  return NextResponse.redirect(loginUrl)
}

/**
 * Runs on every request (see proxy.ts): refreshes the Supabase session cookie
 * and redirects anonymous visitors to /login. Server Actions and pages still
 * verify the user themselves; this is the outer wall, not the only one.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = isPublicPath(pathname)

  // Without connection settings nothing can be verified. Rather than failing
  // every request, send visitors to the login page, which explains what is
  // missing.
  if (!isSupabaseConfigured()) {
    return isPublic ? NextResponse.next({ request }) : redirectToLogin(request)
  }

  let response = NextResponse.next({ request })
  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // getClaims verifies the JWT locally (cached JWKS) instead of a round trip.
  const { data, error } = await supabase.auth.getClaims()
  const isSignedIn = !error && Boolean(data?.claims?.sub)

  if (!isSignedIn && !isPublic) {
    return redirectToLogin(request)
  }

  if (isSignedIn && isPublic) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    homeUrl.search = ""
    return NextResponse.redirect(homeUrl)
  }

  return response
}
