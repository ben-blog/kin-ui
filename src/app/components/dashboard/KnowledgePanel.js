'use client'
// Knowledge Lifecycle 패널 — time decay 시각화 + 아카이브 상태
import { useState, useMemo } from 'react'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Label } from '../ui'

// decay 상태에 따른 색상
function decayColor(effective, original) {
  if (original === 0) return '#333'
  const ratio = effective / original
  if (ratio >= 0.8) return YELLOW // 건강
  if (ratio >= 0.5) return '#b8860b' // 감쇠 중
  if (ratio >= 0.3) return '#8b4513' // 위험
  return '#555' // 거의 소멸
}

function decayLabel(daysSinceUsed) {
  if (daysSinceUsed <= 7) return '최근'
  if (daysSinceUsed <= 30) return `${daysSinceUsed}일 전`
  if (daysSinceUsed <= 90) return `${Math.floor(daysSinceUsed / 30)}개월 전`
  return `${Math.floor(daysSinceUsed / 30)}개월 전`
}

function KnowledgeItem({ item }) {
  const color = decayColor(item.effectiveConfidence, item.confidence)
  const pctOriginal = Math.round(item.confidence * 100)
  const pctEffective = Math.round(item.effectiveConfidence * 100)
  const decayed = pctOriginal !== pctEffective

  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {/* 카테고리 + 사용일 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#3a3a38',
            fontFamily: FONT,
          }}
        >
          {item.category}
        </span>
        <span style={{ fontSize: 9, color: '#2a2a28', fontFamily: FONT }}>
          {decayLabel(item.daysSinceUsed)}
        </span>
      </div>

      {/* 내용 */}
      <p
        style={{
          fontSize: 11,
          color: '#888',
          lineHeight: 1.6,
          fontFamily: FONT,
          margin: '0 0 10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.content}
      </p>

      {/* Decay 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 2,
            background: '#181816',
            position: 'relative',
            borderRadius: 1,
          }}
        >
          {/* 원래 confidence (어두운 바) */}
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: `${pctOriginal}%`,
              background: '#2a2a28',
              borderRadius: 1,
            }}
          />
          {/* effective confidence (밝은 바) */}
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: `${pctEffective}%`,
              background: color,
              borderRadius: 1,
              transition: 'width 1s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 9, color, fontFamily: FONT, minWidth: 40, textAlign: 'right' }}>
          {pctEffective}%{decayed ? ` ← ${pctOriginal}` : ''}
        </span>
      </div>
    </div>
  )
}

export default function KnowledgePanel({
  knowledgeDetails = [],
  archivedCount = 0,
  isMobile: _isMobile,
}) {
  const [expanded, setExpanded] = useState(false)
  const [filterCat, setFilterCat] = useState(null)

  // 카테고리별 집계
  const categories = useMemo(() => {
    const cats = {}
    for (const k of knowledgeDetails) {
      cats[k.category] = (cats[k.category] || 0) + 1
    }
    return cats
  }, [knowledgeDetails])

  // decay 위험 항목 수
  const atRisk = useMemo(
    () => knowledgeDetails.filter((k) => k.effectiveConfidence <= 0.3).length,
    [knowledgeDetails]
  )

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let items = filterCat
      ? knowledgeDetails.filter((k) => k.category === filterCat)
      : knowledgeDetails
    return items.sort((a, b) => b.effectiveConfidence - a.effectiveConfidence)
  }, [knowledgeDetails, filterCat])

  const visible = expanded ? filtered : filtered.slice(0, 5)

  return (
    <section aria-label="Knowledge Lifecycle">
      <SectionTitle
        num={7}
        title="Knowledge"
        action={
          archivedCount > 0 ? (
            <Label color="#555" style={{ fontSize: 8 }}>
              {archivedCount}개 아카이브됨
            </Label>
          ) : null
        }
      />

      {/* 요약 수치 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: YELLOW, fontFamily: FONT }}>
            {knowledgeDetails.length}
          </span>
          <Label>활성</Label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: archivedCount > 0 ? '#555' : '#2a2a28',
              fontFamily: FONT,
            }}
          >
            {archivedCount}
          </span>
          <Label>아카이브</Label>
        </div>
        {atRisk > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#8b4513', fontFamily: FONT }}>
              {atRisk}
            </span>
            <Label color="#8b4513">감쇠 위험</Label>
          </div>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCat(null)}
          style={{
            background: !filterCat ? 'rgba(255,229,0,0.08)' : 'transparent',
            border: `1px solid ${!filterCat ? YELLOW : '#1c1c1a'}`,
            color: !filterCat ? YELLOW : '#444',
            fontSize: 9,
            fontFamily: FONT,
            padding: '5px 10px',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          ALL {knowledgeDetails.length}
        </button>
        {Object.entries(categories).map(([cat, cnt]) => (
          <button
            key={cat}
            onClick={() => setFilterCat(filterCat === cat ? null : cat)}
            style={{
              background: filterCat === cat ? 'rgba(255,229,0,0.08)' : 'transparent',
              border: `1px solid ${filterCat === cat ? YELLOW : '#1c1c1a'}`,
              color: filterCat === cat ? YELLOW : '#444',
              fontSize: 9,
              fontFamily: FONT,
              padding: '5px 10px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {cat} {cnt}
          </button>
        ))}
      </div>

      {/* 지식 목록 */}
      {knowledgeDetails.length === 0 ? (
        <p style={{ fontSize: 13, color: '#333', fontFamily: FONT, lineHeight: 1.8 }}>
          아직 지식이 없어. KIN과 대화하면 여기에 학습 결과가 쌓여.
        </p>
      ) : (
        <>
          {visible.map((item) => (
            <KnowledgeItem key={item.id} item={item} />
          ))}

          {filtered.length > 5 && (
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
              {expanded ? '접기' : `${filtered.length - 5}개 더 보기`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
