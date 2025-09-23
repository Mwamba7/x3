import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect ALL /admin routes. Only allow unauthenticated access to /admin/login
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only consider /admin paths
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Allow ONLY the login endpoint to load freely
  const isLogin = pathname === '/admin/login'
  if (isLogin) return NextResponse.next()

  // For other admin pages, require the session cookie
  const hasSession = req.cookies.get('tt_session')?.value
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
