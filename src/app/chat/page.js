'use client'
// src/app/chat/page.js
import { useState, useRef, useEffect } from 'react'
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

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState('default')
  const [sessionId, setSessionId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('kin_session')
    if (stored) {
      setSessionId(stored)
    } else {
      const id = Math.random().toString(36).slice(2)
      localStorage.setItem('kin_session', id)
      setSessionId(id)
    }
  }, [])

  useEffect(() => {
    if (sessionId && messages.length === 0) {
      setMessages([{ role: 'assistant', content: '왔어.', mood: 'default' }])
    }
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setMood('thinking')

    try {
      const res = await fetch(`${KIN_API}/api/kin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'ben',
          sessionId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const newMood = data.mood || 'default'
      setMood(newMood)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        mood: newMood,
      }])
    } catch (err) {
      setMood('default')
      setMessages(prev => [...prev, { role: 'assistant', content: '...', mood: 'default' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
    }}>
      {/* 상단 바 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #111',
        gap: '12px',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#444',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            padding: 0,
          }}
        >
          ← 대시보드
        </button>
        <span style={{ color: '#222', fontSize: '12px' }}>|</span>
        <span style={{ color: '#FFE500', fontSize: '12px', letterSpacing: '2px' }}>KIN</span>
      </div>

      {/* KIN 이미지 (상단 고정) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '24px',
      }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <Image
            src={MOOD_IMAGE[mood]}
            alt="KIN"
            fill
            style={{ objectFit: 'contain', transition: 'all 0.3s ease' }}
            priority
          />
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 24px 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '640px',
        width: '100%',
        margin: '0 auto',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <p style={{
              color: msg.role === 'user' ? '#888' : '#fff',
              fontSize: '15px',
              lineHeight: '1.7',
              margin: 0,
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </p>
          </div>
        ))}
        {loading && (
          <p style={{ color: '#FFE500', opacity: 0.4, fontSize: '15px', margin: 0 }}>...</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 24px',
        background: '#000',
        borderTop: '1px solid #111',
      }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="말해."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #222',
              color: '#fff',
              fontSize: '15px',
              padding: '8px 0',
              outline: 'none',
              resize: 'none',
              fontFamily: 'monospace',
              lineHeight: '1.6',
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFE500',
              cursor: loading ? 'default' : 'pointer',
              fontSize: '18px',
              opacity: loading || !input.trim() ? 0.3 : 1,
              padding: '0 0 8px',
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
