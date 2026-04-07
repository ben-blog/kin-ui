// src/app/api/auth/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// 간단한 인메모리 rate limiter (IP별)
const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15분

function checkRateLimit(ip) {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  // 윈도우 만료 → 리셋
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count++
  return true
}

// 오래된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of loginAttempts) {
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip)
    }
  }
}, 60 * 1000)

export async function POST(request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: '너무 많은 시도. 잠시 후 다시.' }, { status: 429 })
  }

  const { password } = await request.json()

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (password === process.env.PASSWORD) {
    // 랜덤 토큰 생성 (정적 문자열 대신)
    const token = crypto.randomBytes(32).toString('hex')

    const response = NextResponse.json({ ok: true })
    response.cookies.set('kin_auth', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30일
    })
    return response
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
