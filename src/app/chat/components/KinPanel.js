'use client'
// 채팅 좌측 패널: KIN 이미지 + 감정 상태 + 실시간 로그 스트림
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { FONT, YELLOW } from '../../constants'

const MOOD_IMAGE = {
  default: '/kin_default.webp',
  thinking: '/kin_thinking.webp',
  happy: '/kin_happy.webp',
  laughing: '/kin_laughing.webp',
  sad: '/kin_sad.webp',
  shocked: '/kin_shocked.webp',
  excited: '/kin_excited.webp',
  serious: '/kin_serious.webp',
  calm: '/kin_calm.webp',
  energetic: '/kin_energetic.webp',
  interested: '/kin_interested.webp',
}

const MOOD_KO = {
  default: '대기 중',
  thinking: '생각 중',
  happy: '기분 좋음',
  laughing: '웃음',
  sad: '슬픔',
  shocked: '놀람',
  excited: '신남',
  serious: '진지',
  calm: '차분',
  energetic: '에너지',
  interested: '흥미',
}

const LOG_LEVEL_COLOR = {
  info: '#505048',
  warn: '#8a7a30',
  error: '#7a3030',
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
        padding: '20px 16px 16px',
        borderRight: '1px solid #141412',
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
          left: 12,
          background: 'transparent',
          border: 'none',
          color: '#3a3a38',
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
          width: 160,
          height: 160,
          marginTop: 20,
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
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: YELLOW,
          opacity: 0.6,
          textTransform: 'uppercase',
          marginTop: 10,
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
          background: '#141412',
          margin: '16px 0 12px',
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
          gap: 6,
          minHeight: 0,
        }}
      >
        {logs.length === 0 && (
          <p
            style={{
              fontFamily: FONT,
              fontSize: '10px',
              color: '#2a2a28',
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
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontFamily: FONT,
                fontSize: '9px',
                color: LOG_LEVEL_COLOR[log.level] || LOG_LEVEL_COLOR.info,
                letterSpacing: '0.05em',
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
                fontSize: '10px',
                color: log.level === 'error' ? '#7a4a4a' : '#404038',
                letterSpacing: '0.03em',
                lineHeight: '1.5',
                wordBreak: 'break-all',
              }}
            >
              {log.tag} {log.message}
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
          border: '1px solid #1a1a18',
          color: '#383836',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: FONT,
          padding: '8px 0',
          letterSpacing: '0.15em',
          width: '100%',
          marginTop: 12,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        종료
      </button>
    </div>
  )
}
