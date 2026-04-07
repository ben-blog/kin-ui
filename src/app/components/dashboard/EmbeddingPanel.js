'use client'
// Embedding Space 패널 — WordCloud + 토픽 관련 경험 목록
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Label } from '../ui'

const WordCloud = dynamic(() => import('../WordCloud'), { ssr: false })

export default function EmbeddingPanel({
  topics,
  experiences,
  loading,
  selectedTopic,
  onTopicClick,
}) {
  // 선택된 토픽과 관련된 경험 필터링 — 메모이제이션
  const topicExps = useMemo(() => {
    if (!selectedTopic) return []
    return (experiences || []).filter((e) =>
      e.content?.toLowerCase().includes(selectedTopic.word.toLowerCase())
    )
  }, [selectedTopic, experiences])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionTitle num={1} title="Embedding Space" />
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            role="status"
            style={{ fontSize: 11, color: '#2a2a28', fontFamily: FONT, letterSpacing: '0.2em' }}
          >
            loading
          </span>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <WordCloud topics={topics} experiences={experiences} onTopicClick={onTopicClick} />
        </div>
      )}
      {selectedTopic && (
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, marginTop: 8 }}>
          <Label color={YELLOW}>
            &quot;{selectedTopic.word}&quot; 관련 {topicExps.length}개
          </Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topicExps.length === 0 ? (
              <p style={{ fontSize: 12, color: '#333', fontFamily: FONT }}>최근 경험 없음</p>
            ) : (
              topicExps.slice(0, 2).map((e, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: '#070705',
                    borderLeft: '1px solid #252523',
                  }}
                >
                  <p style={{ fontSize: 10, color: '#444', margin: '0 0 5px', fontFamily: FONT }}>
                    {e.source} · {new Date(e.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#888',
                      margin: 0,
                      lineHeight: 1.7,
                      fontFamily: FONT,
                    }}
                  >
                    {e.content.slice(0, 120)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
