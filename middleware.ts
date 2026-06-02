import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasAdminAccess, hasDriverAccess } from '@/lib/auth-guards'

const ADMIN_ROUTES = ['/conductores', '/usuarios', '/pagos', '/documentos']
const DRIVER_ROUTES = ['/panel', '/viajes', '/ganancias', '/docs', '/soporte']

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(cookie => {
    target.cookies.set(cookie)
  })
  return target
}

function redirectTo(req: NextRequest, path: string, authResponse: NextResponse) {
  const url = req.nextUrl.clone()
  url.pathname = path
  url.search = ''

  if (path === '/login') {
    url.searchParams.set('next', `${req.nextUrl.pathname}${req.nextUrl.search}`)
  } else {
    url.searchParams.set('from', req.nextUrl.pathname)
  }

  return copyAuthCookies(authResponse, NextResponse.redirect(url))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES)
  const isDriverRoute = matchesRoute(pathname, DRIVER_ROUTES)

  if (!isAdminRoute && !isDriverRoute) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse('Missing Supabase environment variables.', { status: 500 })
  }

  let authResponse = NextResponse.next({ request: req })
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value)
        })

        authResponse = NextResponse.next({ request: req })

        cookiesToSet.forEach(({ name, value, options }) => {
          authResponse.cookies.set(name, value, options)
        })

        Object.entries(headers).forEach(([key, value]) => {
          authResponse.headers.set(key, value)
        })
      },
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return redirectTo(req, '/login', authResponse)
  }

  if (isAdminRoute && !(await hasAdminAccess(supabase, user))) {
    return redirectTo(req, '/sin-acceso', authResponse)
  }

  if (isDriverRoute && !(await hasDriverAccess(supabase, user))) {
    return redirectTo(req, '/sin-acceso', authResponse)
  }

  return authResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
