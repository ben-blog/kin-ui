'use client'
// 채팅 메시지 목록 + 로딩 표시
import { useEffect, useRef } from 'react'
import { FONT, YELLOW } from '../../constants'

/** 메시지 content에서 표시용 텍스트 추출 */
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

/** 단일 메시지 버블 */
function MessageBubble({ msg }) {
  const isKin = msg.role === 'assistant'
  const text = msg.displayText ?? extractDisplayText(msg.content)

  return (
    <div
      className="msg-bubble"
      role="listitem"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isKin ? 'flex-start' : 'flex-end',
        gap: 5,
      }}
    >
      {/* 발신자 */}
      <span
        style={{
          fontFamily: FONT,
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isKin ? YELLOW : '#555',
        }}
      >
        {isKin ? 'KIN' : 'BEN'}
      </span>

      {/* 버블 */}
      <div
        style={{
          maxWidth: '84%',
          background: isKin ? '#0d0d0b' : '#131311',
          borderLeft: isKin ? `2px solid ${YELLOW}` : 'none',
          borderRight: !isKin ? '2px solid #252523' : 'none',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* 첨부 이미지 */}
        {msg.displayImage && (
          <img
            src={msg.displayImage}
            alt="첨부 이미지"
            style={{
              maxWidth: '100%',
              maxHeight: 220,
              objectFit: 'contain',
              display: 'block',
              border: '1px solid #1f1f1d',
            }}
          />
        )}
        {/* 텍스트 */}
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
}

/** 로딩 인디케이터 (점 3개 애니메이션) */
function LoadingIndicator() {
  return (
    <div
      className="msg-bubble"
      role="status"
      aria-label="KIN이 답변 중"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: YELLOW,
        }}
      >
        KIN
      </span>
      <div
        style={{
          background: '#0d0d0b',
          borderLeft: `2px solid ${YELLOW}`,
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
              background: YELLOW,
              animation: 'dotPulse 1.1s ease infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function MessageList({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div
      role="log"
      aria-label="대화 내역"
      aria-live="polite"
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
      {messages.map((msg, i) => (
        <MessageBubble key={i} msg={msg} />
      ))}
      {loading && <LoadingIndicator />}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  )
}
