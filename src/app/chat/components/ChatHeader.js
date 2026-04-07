'use client'
// 채팅 헤더 — KIN 아바타 + 무드 표시
import Image from 'next/image'
import { FONT, YELLOW, MOOD_IMAGE, MOOD_KO } from '../../constants'

export default function ChatHeader({ mood, onBack, onEnd }) {
  return (
    <header
      role="banner"
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
      {/* 뒤로가기 */}
      <button
        onClick={onBack}
        aria-label="대시보드로 돌아가기"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#777',
          cursor: 'pointer',
          fontSize: '18px',
          fontFamily: FONT,
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
        }}
        className="back-btn"
      >
        ←
      </button>

      {/* KIN 아바타 + 무드 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ position: 'relative', width: 68, height: 68 }}>
          <Image
            src={MOOD_IMAGE[mood] || MOOD_IMAGE.default}
            alt={`KIN 상태: ${MOOD_KO[mood] || '대기 중'}`}
            fill
            style={{ objectFit: 'contain', transition: 'all 0.35s ease' }}
            priority
          />
        </div>
        <span
          aria-live="polite"
          style={{
            fontFamily: FONT,
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: YELLOW,
            opacity: 0.8,
            textTransform: 'uppercase',
          }}
        >
          {MOOD_KO[mood] || '대기 중'}
        </span>
      </div>

      {/* 종료 */}
      <button
        className="end-btn"
        onClick={onEnd}
        aria-label="세션 종료"
        style={{
          background: 'transparent',
          border: '1px solid #252523',
          color: '#666',
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: FONT,
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
    </header>
  )
}
