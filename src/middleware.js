// src/middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // 로그인 페이지랑 API는 통과
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // 쿠키 확인
  const auth = request.cookies.get('kin_auth')
  if (auth?.value === 'true') {
    return NextResponse.next()
  }

  // 로그인 페이지로
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
