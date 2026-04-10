'use client'
// src/app/chat/page.js — 채팅 페이지 (좌우 레이아웃 + 스트리밍 + SSE 로그)
import { useState, useRef, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { KIN_API } from '../constants'
import ErrorBoundary from '../components/ErrorBoundary'
import GlobalStyles from './components/GlobalStyles'
import KinPanel from './components/KinPanel'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import ImagePreview from './components/ImagePreview'

const MAX_LOGS = 40 // 최대 보관 로그 수

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState('default')
  const [sessionId, setSessionId] = useState(null)
  const [pendingImage, setPendingImage] = useState(null)
  const [logs, setLogs] = useState([]) // 백그라운드 로그
  const inputRef = useRef(null)
  const currentPlanRef = useRef(null)
  const eventSourceRef = useRef(null)

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

  // SSE 로그 연결
  useEffect(() => {
    if (!KIN_API) return

    let active = true // unmount 후 재연결 방지
    let retryTimer = null

    function connect() {
      if (!active) return
      const es = new EventSource(`${KIN_API}/api/kin/events`)
      eventSourceRef.current = es

      es.onmessage = (e) => {
        if (!active) return
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'connected') return
          setLogs((prev) => {
            const next = [...prev, data]
            return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next
          })
        } catch {
          // parse 실패 무시
        }
      }

      es.onerror = () => {
        es.close()
        if (active) {
          retryTimer = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      active = false
      clearTimeout(retryTimer)
      eventSourceRef.current?.close()
    }
  }, [])

  // 세션 종료
  const endSession = useCallback(() => {
    const newId = Math.random().toString(36).slice(2)
    localStorage.setItem('kin_session', newId)
    router.push('/')
  }, [router])

  // 스트리밍 메시지 전송
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

    // 스트리밍 KIN 메시지 placeholder
    const kinMsgIndex = newMessages.length
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', mood: 'thinking', streaming: true },
    ])

    try {
      const res = await fetch(`${KIN_API}/api/kin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'ben',
          sessionId,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          currentPlan: currentPlanRef.current || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      // SSE 스트림 읽기
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullReply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const data = JSON.parse(part.slice(6))

            if (data.type === 'token') {
              fullReply += data.text
              // flushSync로 토큰마다 즉시 렌더링 강제 (타이핑 애니메이션 효과)
              flushSync(() => {
                setMessages((prev) => {
                  const updated = [...prev]
                  if (updated[kinMsgIndex]) {
                    updated[kinMsgIndex] = {
                      ...updated[kinMsgIndex],
                      content: fullReply,
                      displayText: fullReply,
                    }
                  }
                  return updated
                })
              })
            } else if (data.type === 'done') {
              const newMood = data.mood || 'default'
              setMood(newMood)
              if (data.plan) currentPlanRef.current = data.plan
              // 최종 메시지 확정
              setMessages((prev) => {
                const updated = [...prev]
                updated[kinMsgIndex] = {
                  role: 'assistant',
                  content: fullReply,
                  mood: newMood,
                  streaming: false,
                }
                return updated
              })
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      console.error('[Chat] 오류:', err)
      setMood('default')
      setMessages((prev) => {
        const updated = [...prev]
        updated[kinMsgIndex] = {
          role: 'assistant',
          content: '연결에 문제가 생겼어. 잠시 후 다시 해줘.',
          mood: 'default',
          streaming: false,
        }
        return updated
      })
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

      {/* ── 메인 레이아웃 (PC: 좌우 / 모바일: 상하) ── */}
      <div
        className="chat-layout"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 좌측: KIN 패널 */}
        <ErrorBoundary name="KinPanel" fallbackMessage="">
          <div className="kin-panel-wrap">
            <KinPanel mood={mood} logs={logs} onBack={() => router.push('/')} onEnd={endSession} />
          </div>
        </ErrorBoundary>

        {/* 우측: 대화 영역 */}
        <div
          className="chat-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <ErrorBoundary name="MessageList" fallbackMessage="메시지를 표시할 수 없어.">
            <MessageList messages={messages} loading={false} />
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
              inputRef={inputRef}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* 반응형 스타일 */}
      <style>{`
        /* PC: 좌우 분리 — 40% / 60% */
        .kin-panel-wrap {
          width: 40%;
          min-width: 240px;
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-shrink: 0;
        }
        .kin-panel-wrap > div {
          flex: 1;
        }
        .chat-area {
          flex: 1;
          min-width: 0;
        }

        /* 모바일: 상하 분리 */
        @media (max-width: 640px) {
          .chat-layout {
            flex-direction: column !important;
          }
          .kin-panel-wrap {
            width: 100% !important;
            height: 40% !important;
            flex-shrink: 0;
          }
          /* KinPanel 내부 div의 inline border-right 해제 + 하단 border 추가 */
          .kin-panel-wrap > div {
            border-right: none !important;
            border-bottom: 1px solid #141412 !important;
          }
          .chat-area {
            height: 60%;
            flex: none !important;
          }
        }
      `}</style>
    </div>
  )
}
