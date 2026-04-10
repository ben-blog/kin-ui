'use client'
// 채팅 좌측 패널: KIN 이미지 + 감정 상태 + 실시간 로그 스트림
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { FONT, YELLOW, MOOD_IMAGE, MOOD_KO } from '../../constants'

const LOG_LEVEL_COLOR = {
  info: '#686860',
  warn: '#b0a040',
  error: '#c05050',
}

export default function KinPanel({ mood, logs, onBack, onEnd }) {
  const logEndRef = useRef(null)

  // 새 로그 들어올 때마다 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px 16px',
        borderRight: '1px solid #1a1a18',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        aria-label="돌아가기"
        className="back-btn"
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          background: 'transparent',
          border: 'none',
          color: '#555550',
          cursor: 'pointer',
          fontSize: '16px',
          fontFamily: FONT,
          padding: '4px 8px',
          transition: 'color 0.2s',
        }}
      >
        ←
      </button>

      {/* KIN 이미지 */}
      <div
        style={{
          position: 'relative',
          width: 200,
          height: 200,
          marginTop: 24,
          flexShrink: 0,
        }}
      >
        <Image
          src={MOOD_IMAGE[mood] || MOOD_IMAGE.default}
          alt={`KIN — ${MOOD_KO[mood] || '대기 중'}`}
          fill
          style={{ objectFit: 'contain', transition: 'all 0.4s ease' }}
          priority
        />
      </div>

      {/* 감정 상태 */}
      <span
        aria-live="polite"
        style={{
          fontFamily: FONT,
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: YELLOW,
          opacity: 0.75,
          textTransform: 'uppercase',
          marginTop: 12,
          flexShrink: 0,
        }}
      >
        {MOOD_KO[mood] || '대기 중'}
      </span>

      {/* 구분선 */}
      <div
        style={{
          width: '100%',
          height: 1,
          background: '#1e1e1c',
          margin: '20px 0 14px',
          flexShrink: 0,
        }}
      />

      {/* 로그 영역 */}
      <div
        aria-label="백그라운드 로그"
        style={{
          flex: 1,
          width: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 0,
          paddingRight: 4,
        }}
      >
        {logs.length === 0 && (
          <p
            style={{
              fontFamily: FONT,
              fontSize: '12px',
              color: '#383834',
              letterSpacing: '0.05em',
              margin: 0,
              textAlign: 'center',
              paddingTop: 8,
            }}
          >
            —
          </p>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontFamily: FONT,
                fontSize: '10px',
                color: LOG_LEVEL_COLOR[log.level] || LOG_LEVEL_COLOR.info,
                letterSpacing: '0.05em',
                opacity: 0.8,
              }}
            >
              {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: '12px',
                color: log.level === 'error' ? '#c06060' : '#787870',
                letterSpacing: '0.02em',
                lineHeight: '1.55',
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: YELLOW, opacity: 0.6 }}>{log.tag}</span> {log.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} style={{ height: 1 }} />
      </div>

      {/* 종료 버튼 */}
      <button
        className="end-btn"
        onClick={onEnd}
        aria-label="세션 종료"
        style={{
          background: 'transparent',
          border: '1px solid #222220',
          color: '#484844',
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: FONT,
          padding: '9px 0',
          letterSpacing: '0.18em',
          width: '100%',
          marginTop: 14,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        종료
      </button>
    </div>
  )
}
