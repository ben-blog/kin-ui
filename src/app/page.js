'use client'
// src/app/page.js  (대시보드)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

const MOOD_IMAGE = {
  default:   '/kin_default.webp',
  happy:     '/kin_happy.webp',
  excited:   '/kin_excited.webp',
  thinking:  '/kin_thinking1.webp',
  serious:   '/kin_serious.webp',
  sad:       '/kin_sad.webp',
  laughing:  '/kin_laughing2.webp',
  shocked:   '/kin_shocked1.webp',
  energetic: '/kin_energetic1.webp',
  interested:'/kin_interested1.webp',
  calm:      '/kin_calm.webp',
}

export default function DashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${KIN_API}/api/kin/status`)
      .then(r => r.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const mood = status?.mood || 'default'
  const reflection = status?.lastReflection
  const expCount = status?.experienceCount || 0

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 상단 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        padding: '48px 40px 0',
        gap: '32px',
      }}>
        <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
          <Image
            src={MOOD_IMAGE[mood]}
            alt="KIN"
            fill
            style={{ objectFit: 'contain', objectPosition: 'bottom' }}
            priority
          />
        </div>
        <div style={{ paddingBottom: '16px' }}>
          <p style={{ color: '#FFE500', fontSize: '13px', letterSpacing: '3px', margin: '0 0 8px' }}>
            KIN
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            {loading ? '...' : `경험 ${expCount}개 쌓임`}
          </p>
        </div>

        <button
          onClick={() => router.push('/chat')}
          style={{
            marginLeft: 'auto',
            marginBottom: '16px',
            background: 'transparent',
            border: '1px solid #FFE500',
            color: '#FFE500',
            padding: '10px 24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
          }}
        >
          말 걸기 →
        </button>
      </div>

      <div style={{ height: '1px', background: '#222', margin: '24px 40px 0' }} />

      {/* 본문 */}
      <div style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '52px',
        maxWidth: '720px',
      }}>

        {/* 1. KIN의 현재 */}
        <section>
          <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px', marginBottom: '20px', textTransform: 'uppercase' }}>
            KIN의 현재
          </p>
          {loading ? (
            <p style={{ color: '#666', fontSize: '16px' }}>...</p>
          ) : reflection?.what_worked ? (
            <p style={{ color: '#eee', fontSize: '17px', lineHeight: '2', margin: 0 }}>
              {reflection.what_worked}
            </p>
          ) : (
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
              아직 아무것도 없어. 말 걸어봐.
            </p>
          )}
        </section>

        {/* 2. KIN이 하고 싶은 말 */}
        <section>
          <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px', marginBottom: '20px', textTransform: 'uppercase' }}>
            KIN이 하고 싶은 말
          </p>
          {loading ? (
            <p style={{ color: '#666', fontSize: '16px' }}>...</p>
          ) : reflection?.request_to_ben ? (
            <p style={{ color: '#FFE500', fontSize: '17px', lineHeight: '2', margin: 0 }}>
              "{reflection.request_to_ben}"
            </p>
          ) : (
            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
              아직 없어.
            </p>
          )}
        </section>

        {/* 3. 쌓인 것들 */}
        <section>
          <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px', marginBottom: '20px', textTransform: 'uppercase' }}>
            쌓인 것들
          </p>
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-end' }}>
            <div>
              <p style={{ color: '#FFE500', fontSize: '36px', fontWeight: 'bold', margin: '0 0 6px' }}>
                {expCount}
              </p>
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>경험</p>
            </div>
            {reflection && (
              <div style={{ paddingBottom: '8px' }}>
                <p style={{ color: '#eee', fontSize: '15px', margin: '0 0 6px' }}>
                  {new Date(reflection.created_at).toLocaleDateString('ko-KR')}
                </p>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>마지막 Reflection</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
