'use client'
// 데스크탑 질문 패널 — Q&A 인터페이스
import { useState } from 'react'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, SmartBtn } from '../ui'

function detectQuestionType(text) {
  if (!text) return 'free'
  if (/해도 되는지|알려도 되는지|좋을지|여부|괜찮|맞는지/.test(text)) return 'yesno'
  if (/검토|연결|고려|추가|진행|필요/.test(text)) return 'review'
  return 'free'
}

export default function QuestionPanel({ pending, qStats, onAnswer, submitting }) {
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const currentQ = pending[qIndex]
  const qType = detectQuestionType(currentQ?.request_to_ben)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionTitle num={2} title="KIN이 묻는 것들" />
      {pending.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: '#333', fontFamily: FONT }}>미답변 요청 없음</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 통계 */}
          <div
            style={{ display: 'flex', gap: 20, marginBottom: 20 }}
            role="status"
            aria-label={`남음 ${pending.length}, 답변 ${qStats.answered}, 스킵 ${qStats.skipped}`}
          >
            <span style={{ fontSize: 11, fontFamily: FONT, color: '#555' }}>
              남음&nbsp;<span style={{ color: YELLOW }}>{pending.length}</span>
            </span>
            <span style={{ fontSize: 11, fontFamily: FONT, color: '#444' }}>
              답변&nbsp;<span style={{ color: '#5a8' }}>{qStats.answered}</span>
            </span>
            <span style={{ fontSize: 11, fontFamily: FONT, color: '#333' }}>
              스킵&nbsp;<span style={{ color: '#555' }}>{qStats.skipped}</span>
            </span>
          </div>

          {currentQ && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* 질문 텍스트 */}
              <div
                style={{
                  flex: 1,
                  borderLeft: `2px solid ${YELLOW}`,
                  paddingLeft: 16,
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: '#d8d8d0',
                    lineHeight: 1.9,
                    margin: 0,
                    fontFamily: FONT,
                  }}
                >
                  {currentQ.request_to_ben}
                </p>
              </div>

              {/* 답변 영역 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {/* 숏컷 버튼 */}
                {(qType === 'yesno' || qType === 'review') && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {qType === 'yesno' && (
                      <>
                        <SmartBtn
                          label="예"
                          onClick={() => onAnswer(currentQ.id, '예')}
                          variant="primary"
                        />
                        <SmartBtn label="아니오" onClick={() => onAnswer(currentQ.id, '아니오')} />
                      </>
                    )}
                    {qType === 'review' && (
                      <>
                        <SmartBtn
                          label="진행하자"
                          onClick={() => onAnswer(currentQ.id, '진행하자')}
                          variant="primary"
                        />
                        <SmartBtn label="나중에" onClick={() => onAnswer(currentQ.id, '나중에')} />
                      </>
                    )}
                  </div>
                )}

                {/* 자유 입력 */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <textarea
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))}
                    placeholder={qType === 'free' ? '답해줘.' : '또는 직접 써줘.'}
                    rows={2}
                    aria-label="답변 입력"
                    style={{
                      flex: 1,
                      background: '#080806',
                      border: '1px solid #252523',
                      color: '#d8d8d0',
                      fontSize: 13,
                      padding: '10px 12px',
                      resize: 'none',
                      fontFamily: FONT,
                      lineHeight: 1.6,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => onAnswer(currentQ.id, answers[currentQ.id])}
                    disabled={submitting[currentQ.id] || !answers[currentQ.id]?.trim()}
                    style={{
                      background: answers[currentQ.id]?.trim() ? YELLOW : 'transparent',
                      border: `1px solid ${answers[currentQ.id]?.trim() ? YELLOW : '#333'}`,
                      color: answers[currentQ.id]?.trim() ? '#000' : '#444',
                      cursor: answers[currentQ.id]?.trim() ? 'pointer' : 'default',
                      fontSize: 11,
                      fontFamily: FONT,
                      padding: '0 14px',
                      transition: 'all 0.15s',
                      opacity: submitting[currentQ.id] ? 0.4 : 1,
                    }}
                  >
                    {submitting[currentQ.id] ? '...' : '전달'}
                  </button>
                </div>

                {/* 스킵 버튼 */}
                <button
                  onClick={() => onAnswer(currentQ.id, null, true)}
                  aria-label="이 질문 건너뛰기"
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#777',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: FONT,
                    padding: '8px 16px',
                    letterSpacing: '0.1em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#888'
                    e.target.style.color = '#aaa'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#444'
                    e.target.style.color = '#777'
                  }}
                >
                  Skip
                </button>
              </div>

              {/* 질문 탐색 */}
              {pending.length > 1 && (
                <nav
                  aria-label="질문 탐색"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderTop: `1px solid ${BORDER}`,
                    paddingTop: 12,
                  }}
                >
                  <button
                    onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                    disabled={qIndex === 0}
                    aria-label="이전 질문"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${qIndex === 0 ? '#1a1a18' : '#2a2a28'}`,
                      color: qIndex === 0 ? '#222' : '#666',
                      cursor: qIndex === 0 ? 'default' : 'pointer',
                      padding: '6px 14px',
                      fontFamily: FONT,
                      fontSize: 13,
                    }}
                  >
                    ←
                  </button>
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 10,
                      color: '#444',
                      fontFamily: FONT,
                      letterSpacing: '0.15em',
                    }}
                  >
                    {qIndex + 1} / {pending.length}
                  </span>
                  <button
                    onClick={() => setQIndex((i) => Math.min(pending.length - 1, i + 1))}
                    disabled={qIndex === pending.length - 1}
                    aria-label="다음 질문"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${qIndex === pending.length - 1 ? '#1a1a18' : '#2a2a28'}`,
                      color: qIndex === pending.length - 1 ? '#222' : '#666',
                      cursor: qIndex === pending.length - 1 ? 'default' : 'pointer',
                      padding: '6px 14px',
                      fontFamily: FONT,
                      fontSize: 13,
                    }}
                  >
                    →
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
