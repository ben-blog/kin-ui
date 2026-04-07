'use client'
// 모바일 질문 카드 (스와이프 지원)
import { useState, useEffect, useRef } from 'react'
import { FONT, YELLOW } from '../../constants'
import { Label } from '../ui'

function detectQuestionType(text) {
  if (!text) return 'free'
  if (/해도 되는지|알려도 되는지|좋을지|여부|괜찮|맞는지/.test(text)) return 'yesno'
  if (/검토|연결|고려|추가|진행|필요/.test(text)) return 'review'
  return 'free'
}

export default function QuestionCards({ pending, qStats, setQStats, onAnswer, submitting }) {
  const [idx, setIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [answers, setAnswers] = useState({})
  const startX = useRef(0)
  const dragging = useRef(false)

  // pending 변경 시 idx 범위 보정
  useEffect(() => {
    if (idx >= pending.length && pending.length > 0) {
      setIdx(Math.max(0, pending.length - 1))
    }
  }, [pending.length, idx])

  const currentQ = pending[idx]
  const qType = detectQuestionType(currentQ?.request_to_ben)
  const total = pending.length

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    dragging.current = true
  }
  const handleTouchMove = (e) => {
    if (dragging.current) setDragX(e.touches[0].clientX - startX.current)
  }
  const handleTouchEnd = () => {
    dragging.current = false
    if (dragX < -60 && idx < total - 1) setIdx((i) => i + 1)
    if (dragX > 60 && idx > 0) setIdx((i) => i - 1)
    setDragX(0)
  }

  async function doAnswer(answer, skip = false) {
    await onAnswer(currentQ.id, answer, skip)
    setQStats((p) => (skip ? { ...p, skipped: p.skipped + 1 } : { ...p, answered: p.answered + 1 }))
    if (idx < total - 1) setIdx((i) => i + 1)
    else setIdx(Math.max(0, idx - 1))
  }

  if (!currentQ)
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#444', fontFamily: FONT }}>미답변 요청 없어.</p>
      </div>
    )

  return (
    <div>
      {/* 카운터 */}
      <div
        style={{ display: 'flex', gap: 20, marginBottom: 24, justifyContent: 'center' }}
        role="status"
        aria-label={`질문 ${idx + 1}/${total}, 답변 ${qStats.answered}, 스킵 ${qStats.skipped}`}
      >
        <span style={{ fontSize: 12, fontFamily: FONT, color: '#666' }}>
          남음&nbsp;<span style={{ color: YELLOW }}>{total}</span>
        </span>
        <span style={{ fontSize: 12, fontFamily: FONT, color: '#555' }}>
          답변&nbsp;<span style={{ color: '#5a8' }}>{qStats.answered}</span>
        </span>
        <span style={{ fontSize: 12, fontFamily: FONT, color: '#444' }}>
          스킵&nbsp;<span style={{ color: '#555' }}>{qStats.skipped}</span>
        </span>
      </div>

      {/* 카드 */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
        {/* 뒤 카드 힌트 */}
        {idx < total - 1 && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              height: '100%',
              background: '#0f0f0d',
              borderRadius: 12,
              border: '1px solid #1a1a18',
            }}
          />
        )}
        {/* 현재 카드 */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="article"
          aria-label={`질문 ${idx + 1}: ${currentQ.request_to_ben}`}
          style={{
            position: 'relative',
            zIndex: 1,
            background: '#111110',
            borderRadius: 12,
            border: '1px solid #252523',
            padding: '28px 24px',
            transform: dragging.current
              ? `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`
              : 'translateX(0)',
            transition: dragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Label color={YELLOW}>
              질문 {idx + 1}/{total}
            </Label>
            <div style={{ display: 'flex', gap: 6 }} role="tablist" aria-label="질문 탐색">
              {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
                <div
                  key={i}
                  role="tab"
                  tabIndex={0}
                  aria-selected={i === idx}
                  aria-label={`질문 ${i + 1}로 이동`}
                  onClick={() => setIdx(i)}
                  onKeyDown={(e) => e.key === 'Enter' && setIdx(i)}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i === idx ? YELLOW : '#2a2a28',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>
          <p
            style={{
              fontSize: 16,
              color: '#d8d8d0',
              lineHeight: 1.85,
              margin: '0 0 28px',
              fontFamily: FONT,
            }}
          >
            {currentQ.request_to_ben}
          </p>

          {/* 숏컷 버튼 */}
          {(qType === 'yesno' || qType === 'review') && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {qType === 'yesno' && (
                <>
                  <button
                    onClick={() => doAnswer('예')}
                    style={{
                      flex: 1,
                      background: YELLOW,
                      border: 'none',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: FONT,
                      padding: '13px',
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    예
                  </button>
                  <button
                    onClick={() => doAnswer('아니오')}
                    style={{
                      flex: 1,
                      background: '#1a1a18',
                      border: '1px solid #2a2a28',
                      color: '#aaa',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: FONT,
                      padding: '13px',
                      borderRadius: 8,
                    }}
                  >
                    아니오
                  </button>
                </>
              )}
              {qType === 'review' && (
                <>
                  <button
                    onClick={() => doAnswer('진행하자')}
                    style={{
                      flex: 1,
                      background: YELLOW,
                      border: 'none',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: FONT,
                      padding: '13px',
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    진행하자
                  </button>
                  <button
                    onClick={() => doAnswer('나중에')}
                    style={{
                      flex: 1,
                      background: '#1a1a18',
                      border: '1px solid #2a2a28',
                      color: '#aaa',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: FONT,
                      padding: '13px',
                      borderRadius: 8,
                    }}
                  >
                    나중에
                  </button>
                </>
              )}
            </div>
          )}

          {/* 자유 입력 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => setAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))}
              placeholder={qType === 'free' ? '답해줘.' : '또는 직접 써줘.'}
              rows={3}
              aria-label="답변 입력"
              style={{
                background: '#080806',
                border: '1px solid #2a2a28',
                borderRadius: 8,
                color: '#d8d8d0',
                fontSize: 15,
                padding: '14px',
                resize: 'none',
                fontFamily: FONT,
                lineHeight: 1.6,
                outline: 'none',
                width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => doAnswer(answers[currentQ.id])}
                disabled={!answers[currentQ.id]?.trim() || submitting[currentQ.id]}
                style={{
                  flex: 1,
                  background: answers[currentQ.id]?.trim() ? YELLOW : '#1a1a18',
                  border: 'none',
                  color: answers[currentQ.id]?.trim() ? '#000' : '#444',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: FONT,
                  padding: '14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  opacity: submitting[currentQ.id] ? 0.5 : 1,
                }}
              >
                {submitting[currentQ.id] ? '...' : '전달'}
              </button>
              <button
                onClick={() => doAnswer(null, true)}
                aria-label="이 질문 건너뛰기"
                style={{
                  width: 80,
                  background: 'transparent',
                  border: '1px solid #444',
                  color: '#777',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: FONT,
                  padding: '14px 0',
                  borderRadius: 8,
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 스와이프 힌트 */}
      {total > 1 && (
        <p
          aria-hidden="true"
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: '#2a2a28',
            fontFamily: FONT,
            letterSpacing: '0.15em',
          }}
        >
          ← 스와이프로 이동 →
        </p>
      )}
    </div>
  )
}
