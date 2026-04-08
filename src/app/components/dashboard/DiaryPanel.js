'use client'
// KIN의 일기 패널 — Reflection diary_entry를 사람이 읽는 형태로 표시
import { useState } from 'react'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Label } from '../ui'

function DiaryEntry({ entry, isLatest }) {
  const date = new Date(entry.created_at)
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article
      style={{
        padding: '16px 0',
        borderBottom: `1px solid ${BORDER}`,
        opacity: isLatest ? 1 : 0.7,
        transition: 'opacity 0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 10, color: '#3a3a38', fontFamily: FONT, letterSpacing: '0.1em' }}>
          {dateStr}
        </span>
        <span style={{ fontSize: 9, color: '#2a2a28', fontFamily: FONT }}>{timeStr}</span>
      </div>
      <p
        style={{
          fontSize: 13,
          color: isLatest ? '#ccc' : '#777',
          lineHeight: 1.9,
          fontFamily: FONT,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {entry.diary_entry}
      </p>
    </article>
  )
}

export default function DiaryPanel({ diary = [], crystallizedCount = 0, isMobile: _isMobile }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? diary : diary.slice(0, 3)

  return (
    <section aria-label="KIN의 일기">
      <SectionTitle
        num={6}
        title="KIN의 일기"
        action={
          crystallizedCount > 0 ? (
            <Label color={YELLOW} style={{ fontSize: 8 }}>
              {crystallizedCount}개의 확실한 기억
            </Label>
          ) : null
        }
      />

      {diary.length === 0 ? (
        <p style={{ fontSize: 13, color: '#333', fontFamily: FONT, lineHeight: 1.8 }}>
          아직 일기가 없어. KIN과 대화하면 여기에 기록이 쌓여.
        </p>
      ) : (
        <>
          {visible.map((entry, i) => (
            <DiaryEntry key={entry.created_at} entry={entry} isLatest={i === 0} />
          ))}

          {diary.length > 3 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#444',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: FONT,
                padding: '12px 0',
                letterSpacing: '0.1em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = YELLOW)}
              onMouseLeave={(e) => (e.target.style.color = '#444')}
            >
              {expanded ? '접기' : `${diary.length - 3}개 더 보기`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
