// src/middleware.js
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/session'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // 로그인 페이지랑 로그인 API는 통과
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // 정적 파일은 통과
  if (pathname.startsWith('/_next') || pathname.endsWith('.webp') || pathname.endsWith('.ico')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const valid = await verifySessionToken(token, process.env.AUTH_SECRET)
  if (valid) return NextResponse.next()

  // API는 HTML 로그인으로 보내면 fetch가 페이지를 따라간다. 401로 거절.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
