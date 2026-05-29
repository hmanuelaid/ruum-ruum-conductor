import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER = 'ruum'
const PASS = 'conductor2024'

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic') {
      const decoded = Buffer.from(encoded, 'base64').toString()
      const [user, pass] = decoded.split(':')
      if (user === USER && pass === PASS) return NextResponse.next()
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