// src/app/api/auth/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { password } = await request.json()

  if (password === process.env.PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('kin_auth', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30일
    })
    return response
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
