import { AUTH_TOKEN_COOKIE } from '@/lib/auth-session'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.cookies.get(AUTH_TOKEN_COOKIE)?.value) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/docker/:path*',
    '/file/:path*',
    '/file-sharing/:path*',
    '/hardware/:path*',
    '/jobs/:path*',
    '/logs/:path*',
    '/storage/:path*',
    '/users/:path*',
  ],
}
