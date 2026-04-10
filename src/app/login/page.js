'use client'
// src/app/login/page.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const FONT = "'DM Mono', monospace"
const YELLOW = '#FFE500'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#080806',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .login-form {
          animation: fadeUp 0.45s ease forwards;
        }
        .login-input:focus {
          border-bottom-color: ${YELLOW} !important;
        }
        .login-btn:not(:disabled):hover {
          background: ${YELLOW} !important;
          color: #080806 !important;
        }
        .login-input.error {
          animation: shake 0.35s ease;
        }
      `}</style>

      {/* Grain 텍스처 */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      <form
        className="login-form"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          width: '260px',
          position: 'relative',
          zIndex: 1,
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* KIN 아바타 */}
        <div
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `1px solid ${YELLOW}22`,
            background: '#111',
          }}
        >
          <Image
            src="/kin_default.webp"
            alt="KIN"
            fill
            style={{ objectFit: 'contain', objectPosition: 'center top' }}
            priority
          />
        </div>

        {/* KIN 레이블 */}
        <p
          style={{
            color: YELLOW,
            fontSize: '11px',
            letterSpacing: '0.35em',
            margin: 0,
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          KIN
        </p>

        {/* 비밀번호 입력 */}
        <input
          type="password"
          className={`login-input${error ? ' error' : ''}`}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(false)
          }}
          placeholder="—"
          autoFocus
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${error ? '#ff4444' : '#2a2a28'}`,
            color: '#e8e8e0',
            fontSize: '18px',
            padding: '10px 0',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '8px',
            boxSizing: 'border-box',
            fontFamily: FONT,
            transition: 'border-color 0.2s ease',
          }}
        />

        {/* 에러 메시지 */}
        <p
          style={{
            color: '#ff4444',
            fontSize: '12px',
            margin: 0,
            letterSpacing: '0.08em',
            opacity: error ? 1 : 0,
            transition: 'opacity 0.2s ease',
            height: 16,
          }}
        >
          아니야.
        </p>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading || !password}
          className="login-btn"
          style={{
            background: 'transparent',
            border: `1px solid ${loading || !password ? '#2a2a28' : YELLOW + '88'}`,
            color: loading || !password ? '#444' : YELLOW,
            padding: '11px 0',
            cursor: loading || !password ? 'default' : 'pointer',
            fontSize: '12px',
            fontFamily: FONT,
            letterSpacing: '0.2em',
            width: '100%',
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? '···' : '들어가기'}
        </button>
      </form>
    </div>
  )
}
