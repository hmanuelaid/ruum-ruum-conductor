import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER = process.env.BASIC_AUTH_USER
const PASS = process.env.BASIC_AUTH_PASS

function base64Decode(encoded: string) {
  if (typeof globalThis.atob === 'function') return globalThis.atob(encoded)
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

export function middleware(req: NextRequest) {
  if (!USER || !PASS) {
    console.error('BASIC_AUTH_USER/BASIC_AUTH_PASS not set in environment')
    return new NextResponse('Server misconfigured', { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = base64Decode(encoded)
        const [user, pass] = decoded.split(':')
        if (user === USER && pass === PASS) return NextResponse.next()
      } catch (e) {
        console.error('Failed to decode Authorization header', e)
      }
    }
  }

  return new NextResponse('Acceso restringido', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Ruum Ruum"' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}