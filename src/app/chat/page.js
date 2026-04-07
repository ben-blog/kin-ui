'use client'
// src/app/chat/page.js — 채팅 페이지 (컴포넌트 분리 버전)
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { KIN_API } from '../constants'
import ErrorBoundary from '../components/ErrorBoundary'
import GlobalStyles from './components/GlobalStyles'
import ChatHeader from './components/ChatHeader'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import ImagePreview from './components/ImagePreview'

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState('default')
  const [sessionId, setSessionId] = useState(null)
  const [pendingImage, setPendingImage] = useState(null)
  const inputRef = useRef(null)

  // 세션 초기화
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

  // 초기 인사 메시지
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      setMessages([{ role: 'assistant', content: '왔어.', mood: 'default' }])
    }
  }, [sessionId])

  // 세션 종료
  const endSession = useCallback(() => {
    const newId = Math.random().toString(36).slice(2)
    localStorage.setItem('kin_session', newId)
    router.push('/')
  }, [router])

  // 메시지 전송
  const send = useCallback(async () => {
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
  }, [input, pendingImage, loading, messages, sessionId])

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
      <GlobalStyles />

      {/* Grain 텍스처 */}
      <div
        aria-hidden="true"
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

      <ErrorBoundary name="ChatHeader" fallbackMessage="헤더를 불러올 수 없어.">
        <ChatHeader mood={mood} onBack={() => router.push('/')} onEnd={endSession} />
      </ErrorBoundary>

      <ErrorBoundary name="MessageList" fallbackMessage="메시지를 표시할 수 없어.">
        <MessageList messages={messages} loading={loading} />
      </ErrorBoundary>

      <ImagePreview pendingImage={pendingImage} onRemove={() => setPendingImage(null)} />

      <ErrorBoundary name="ChatInput" fallbackMessage="입력 영역에 문제가 생겼어.">
        <ChatInput
          input={input}
          setInput={setInput}
          pendingImage={pendingImage}
          setPendingImage={setPendingImage}
          onSend={send}
          loading={loading}
        />
      </ErrorBoundary>
    </div>
  )
}
