'use client'
// 공통 UI 프리미티브 컴포넌트
import { useState } from 'react'
import { FONT, YELLOW } from '../../constants'

/** 작은 라벨 텍스트 */
export function Label({ children, color = '#3a3a38', style = {} }) {
  return (
    <span
      style={{
        fontSize: 9,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color,
        fontFamily: FONT,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** 섹션 제목 (번호 + 타이틀 + 액션) */
export function SectionTitle({ num, title, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: '1px solid #1c1c1a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 9, color: '#2e2e2c', fontFamily: FONT, letterSpacing: '0.15em' }}>
          {String(num).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 15, color: YELLOW, fontFamily: FONT, letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}

/** 큰 숫자 + 라벨 */
export function Num({ value, label, color = YELLOW, size = 36 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: size, fontWeight: 700, color, fontFamily: FONT, lineHeight: 1 }}>
        {value}
      </span>
      <Label color="#3a3a38">{label}</Label>
    </div>
  )
}

/** 수평 바 차트 항목 */
export function Bar({ label, value, max, color = YELLOW }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}
      role="meter"
      aria-label={`${label}: ${value}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span
        style={{
          width: 88,
          fontSize: 11,
          color: '#555',
          fontFamily: FONT,
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: '#181816' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            transition: 'width 1s ease',
          }}
        />
      </div>
      <span
        style={{ width: 20, fontSize: 10, color: '#444', fontFamily: FONT, textAlign: 'right' }}
      >
        {value}
      </span>
    </div>
  )
}

/** 호버 스타일 버튼 */
export function SmartBtn({ label, onClick, variant = 'default' }) {
  const [hov, setHov] = useState(false)
  const styles = {
    primary: {
      bg: hov ? YELLOW : 'rgba(255,229,0,0.08)',
      border: `1px solid ${YELLOW}`,
      color: hov ? '#000' : YELLOW,
    },
    default: {
      bg: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
      border: '1px solid #2a2a28',
      color: hov ? '#aaa' : '#666',
    },
    muted: { bg: 'transparent', border: '1px solid #1c1c1a', color: hov ? '#666' : '#333' },
  }
  const s = styles[variant]
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: s.bg,
        border: s.border,
        color: s.color,
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: FONT,
        padding: '9px 16px',
        transition: 'all 0.15s',
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </button>
  )
}
