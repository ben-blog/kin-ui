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
    <div style={{
      background: '#000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="—"
          autoFocus
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${error ? '#ff4444' : '#FFE500'}`,
            color: '#FFE500',
            fontSize: '24px',
            padding: '8px 0',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '8px',
            width: '200px',
          }}
        />
        {error && (
          <p style={{ color: '#ff4444', textAlign: 'center', fontSize: '12px', margin: 0 }}>
            아니야.
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFE500',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '...' : '→'}
        </button>
      </form>
    </div>
  )
}
