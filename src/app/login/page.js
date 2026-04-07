'use client'
// src/app/login/page.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          width: '320px',
        }}
      >
        <p
          style={{
            color: '#FFE500',
            fontSize: '16px',
            letterSpacing: '4px',
            margin: 0,
          }}
        >
          KIN
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${error ? '#ff4444' : '#FFE500'}`,
            color: '#fff',
            fontSize: '20px',
            padding: '12px 0',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '6px',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p
            style={{
              color: '#ff4444',
              fontSize: '14px',
              margin: 0,
            }}
          >
            아니야.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            background: 'transparent',
            border: '1px solid #FFE500',
            color: '#FFE500',
            padding: '12px 40px',
            cursor: loading || !password ? 'default' : 'pointer',
            fontSize: '15px',
            fontFamily: 'monospace',
            letterSpacing: '2px',
            opacity: loading || !password ? 0.4 : 1,
            width: '100%',
          }}
        >
          {loading ? '...' : '들어가기'}
        </button>
      </form>
    </div>
  )
}
