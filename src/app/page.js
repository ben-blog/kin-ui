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
      {/* 상단 - KIN 이미지 + 이름 */}
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
          <p style={{ color: '#FFE500', fontSize: '11px', letterSpacing: '3px', margin: '0 0 4px' }}>
            KIN
          </p>
          <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>
            {loading ? '...' : `경험 ${expCount}개 쌓임`}
          </p>
        </div>

        {/* 우상단 대화 버튼 */}
        <button
          onClick={() => router.push('/chat')}
          style={{
            marginLeft: 'auto',
            marginBottom: '16px',
            background: 'transparent',
            border: '1px solid #FFE500',
            color: '#FFE500',
            padding: '8px 20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
          }}
        >
          말 걸기 →
        </button>
      </div>

      <div style={{ height: '1px', background: '#111', margin: '24px 40px 0' }} />

      {/* 본문 */}
      <div style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
        maxWidth: '720px',
      }}>

        {/* 1. KIN의 현재 */}
        <section>
          <p style={{ color: '#333', fontSize: '11px', letterSpacing: '2px', marginBottom: '16px' }}>
            KIN의 현재
          </p>
          {loading ? (
            <p style={{ color: '#444', fontSize: '14px' }}>...</p>
          ) : reflection?.what_worked ? (
            <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
              {reflection.what_worked}
            </p>
          ) : (
            <p style={{ color: '#333', fontSize: '14px', margin: 0 }}>
              아직 아무것도 없어. 말 걸어봐.
            </p>
          )}
        </section>

        {/* 2. KIN이 Ben에게 */}
        <section>
          <p style={{ color: '#333', fontSize: '11px', letterSpacing: '2px', marginBottom: '16px' }}>
            KIN이 하고 싶은 말
          </p>
          {loading ? (
            <p style={{ color: '#444', fontSize: '14px' }}>...</p>
          ) : reflection?.request_to_ben ? (
            <p style={{ color: '#FFE500', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
              "{reflection.request_to_ben}"
            </p>
          ) : (
            <p style={{ color: '#333', fontSize: '14px', margin: 0 }}>
              아직 없어.
            </p>
          )}
        </section>

        {/* 3. 쌓인 것들 */}
        <section>
          <p style={{ color: '#333', fontSize: '11px', letterSpacing: '2px', marginBottom: '16px' }}>
            쌓인 것들
          </p>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <p style={{ color: '#FFE500', fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px' }}>
                {expCount}
              </p>
              <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>경험</p>
            </div>
            {reflection && (
              <div>
                <p style={{ color: '#fff', fontSize: '13px', margin: '0 0 4px' }}>
                  {new Date(reflection.created_at).toLocaleDateString('ko-KR')}
                </p>
                <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>마지막 Reflection</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
