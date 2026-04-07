'use client'
// src/app/chat/page.js
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

const MOOD_IMAGE = {
  default: '/kin_default.webp',
  happy: '/kin_happy.webp',
  excited: '/kin_excited.webp',
  thinking: '/kin_thinking1.webp',
  serious: '/kin_serious.webp',
  sad: '/kin_sad.webp',
  laughing: '/kin_laughing2.webp',
  shocked: '/kin_shocked1.webp',
  energetic: '/kin_energetic1.webp',
  interested: '/kin_interested1.webp',
  calm: '/kin_calm.webp',
}

const MOOD_KO = {
  default: '대기 중',
  happy: '기분 좋음',
  excited: '흥미로움',
  thinking: '생각 중',
  serious: '진지함',
  sad: '슬픔',
  laughing: '웃음',
  shocked: '놀람',
  energetic: '에너지',
  interested: '관심 있음',
  calm: '차분함',
}

function extractDisplayText(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
  }
  return ''
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState('default')
  const [sessionId, setSessionId] = useState(null)
  const [pendingImage, setPendingImage] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

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
  }, [messages, loading])

  function endSession() {
    const newId = Math.random().toString(36).slice(2)
    localStorage.setItem('kin_session', newId)
    router.push('/')
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new window.Image()
      img.onload = () => {
        // canvas로 리사이즈 + 압축 (최대 1200px, quality 0.82)
        const MAX_PX = 1200
        let w = img.width,
          h = img.height
        if (w > MAX_PX || h > MAX_PX) {
          if (w > h) {
            h = Math.round((h * MAX_PX) / w)
            w = MAX_PX
          } else {
            w = Math.round((w * MAX_PX) / h)
            h = MAX_PX
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        setPendingImage({
          dataUrl,
          mediaType: 'image/jpeg',
          name: file.name,
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function send() {
    if ((!input.trim() && !pendingImage) || loading) return

    let apiContent
    if (pendingImage) {
      const base64 = pendingImage.dataUrl.split(',')[1]
      apiContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: pendingImage.mediaType, data: base64 },
        },
        { type: 'text', text: input.trim() || '이 이미지 봐줘.' },
      ]
    } else {
      apiContent = input.trim()
    }

    const userMsg = {
      role: 'user',
      content: apiContent,
      displayImage: pendingImage?.dataUrl || null,
      displayText: input.trim(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setPendingImage(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    setMood('thinking')

    try {
      const res = await fetch(`${KIN_API}/api/kin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'ben',
          sessionId,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const newMood = data.mood || 'default'
      setMood(newMood)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, mood: newMood }])
    } catch (err) {
      console.error('[Chat] 오류:', err)
      setMood('default')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '연결에 문제가 생겼어. 잠시 후 다시 해줘.', mood: 'default' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKey(e) {
    if (e.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const canSend = !!(input.trim() || pendingImage) && !loading

  return (
    <div
      style={{
        background: '#080806',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Mono', monospace",
        overflow: 'hidden',
      }}
    >
      {/* Google Fonts + animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

        @keyframes dotPulse {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50%       { opacity: 1;    transform: scale(1.1);  }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .msg-bubble {
          animation: msgIn 0.22s ease forwards;
        }
        .send-btn:hover { color: #FFE500 !important; }
        .attach-btn:hover { color: #FFE500 !important; }
        .back-btn:hover { color: #FFE500 !important; }
        .end-btn:hover { border-color: #444 !important; color: #888 !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a28; border-radius: 2px; }
      `}</style>

      {/* Grain */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.022,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      {/* ── HEADER ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(8,8,6,0.96)',
          borderBottom: '1px solid #1a1a18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          flexShrink: 0,
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#777',
            cursor: 'pointer',
            fontSize: '18px',
            fontFamily: "'DM Mono', monospace",
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>

        {/* KIN identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ position: 'relative', width: 68, height: 68 }}>
            <Image
              src={MOOD_IMAGE[mood] || MOOD_IMAGE.default}
              alt="KIN"
              fill
              style={{ objectFit: 'contain', transition: 'all 0.35s ease' }}
              priority
            />
          </div>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#FFE500',
              opacity: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {MOOD_KO[mood] || '대기 중'}
          </span>
        </div>

        {/* End */}
        <button
          className="end-btn"
          onClick={endSession}
          style={{
            background: 'transparent',
            border: '1px solid #252523',
            color: '#666',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: "'DM Mono', monospace",
            padding: '0 12px',
            letterSpacing: '0.08em',
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
        >
          종료
        </button>
      </div>

      {/* ── MESSAGES ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          position: 'relative',
          zIndex: 1,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.map((msg, i) => {
          const isKin = msg.role === 'assistant'
          const text = msg.displayText ?? extractDisplayText(msg.content)
          return (
            <div
              key={i}
              className="msg-bubble"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isKin ? 'flex-start' : 'flex-end',
                gap: 5,
              }}
            >
              {/* Label */}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isKin ? '#FFE500' : '#555',
                }}
              >
                {isKin ? 'KIN' : 'BEN'}
              </span>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: '84%',
                  background: isKin ? '#0d0d0b' : '#131311',
                  borderLeft: isKin ? '2px solid #FFE500' : 'none',
                  borderRight: !isKin ? '2px solid #252523' : 'none',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Image */}
                {msg.displayImage && (
                  <img
                    src={msg.displayImage}
                    alt="첨부"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 220,
                      objectFit: 'contain',
                      display: 'block',
                      border: '1px solid #1f1f1d',
                    }}
                  />
                )}
                {/* Text */}
                {text && (
                  <p
                    style={{
                      color: isKin ? '#f0f0e8' : '#888',
                      fontSize: '15px',
                      lineHeight: '1.8',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {text}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading dots */}
        {loading && (
          <div
            className="msg-bubble"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#FFE500',
              }}
            >
              KIN
            </span>
            <div
              style={{
                background: '#0d0d0b',
                borderLeft: '2px solid #FFE500',
                padding: '14px 16px',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#FFE500',
                    animation: `dotPulse 1.1s ease infinite`,
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── IMAGE PREVIEW ── */}
      {pendingImage && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            borderTop: '1px solid #1a1a18',
            background: '#0a0a08',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <img
            src={pendingImage.dataUrl}
            alt="preview"
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              border: '1px solid #252523',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              flex: 1,
              fontSize: '10px',
              color: '#444',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pendingImage.name}
          </span>
          <button
            onClick={() => setPendingImage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#444',
              cursor: 'pointer',
              fontSize: '18px',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── INPUT ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid #1a1a18',
          background: 'rgba(8,8,6,0.98)',
          padding: '10px 16px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        {/* Attach button */}
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'transparent',
            border: 'none',
            color: pendingImage ? '#FFE500' : '#555',
            cursor: 'pointer',
            fontSize: '20px',
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.2s',
          }}
          title="이미지 첨부"
        >
          ⊕
        </button>

        {/* Textarea */}
        <textarea
          ref={(el) => {
            inputRef.current = el
            textareaRef.current = el
          }}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKey}
          placeholder="말해."
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #252523',
            color: '#e0e0d8',
            fontSize: '16px',
            padding: '8px 0',
            outline: 'none',
            resize: 'none',
            fontFamily: "'DM Mono', monospace",
            lineHeight: '1.6',
            minHeight: 36,
            maxHeight: 120,
          }}
        />

        {/* Send button */}
        <button
          className="send-btn"
          onClick={send}
          disabled={!canSend}
          style={{
            background: 'transparent',
            border: 'none',
            color: canSend ? '#aaa' : '#333',
            cursor: canSend ? 'pointer' : 'default',
            fontSize: '22px',
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.2s',
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
