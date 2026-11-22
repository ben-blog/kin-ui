// src/app/api/auth/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '../../../lib/session'

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

function passwordMatches(input, expected) {
  if (typeof input !== 'string' || typeof expected !== 'string' || expected.length === 0) {
    return false
  }
  const provided = Buffer.from(input)
  const actual = Buffer.from(expected)
  if (provided.length !== actual.length) return false
  return crypto.timingSafeEqual(provided, actual)
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

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const password = body?.password
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const authSecret = process.env.AUTH_SECRET
  if (typeof authSecret !== 'string' || authSecret.length === 0) {
    console.error('[auth] AUTH_SECRET is not configured')
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
  }

  if (passwordMatches(password, process.env.PASSWORD)) {
    let token
    try {
      token = await createSessionToken(authSecret)
    } catch {
      console.error('[auth] failed to issue session')
      return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
