'use client'
// KIN의 Web Learning 패널 — 자율 학습 세션 현황 + 토픽 관리
import { useState, useCallback } from 'react'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Label } from '../ui'

const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

// 세션 상태별 색상
const STATUS_COLOR = {
  success: '#4caf50',
  failed: '#f44336',
  running: YELLOW,
  skipped: '#555',
}

const STATUS_KO = {
  success: '완료',
  failed: '실패',
  running: '실행 중',
  skipped: '스킵',
}

function SessionRow({ session }) {
  const ranAt = session.ran_at
    ? new Date(session.ran_at).toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  const topics = Array.isArray(session.topics_used) ? session.topics_used.join(', ') : '—'
  const costStr =
    session.total_cost_usd != null ? `$${Number(session.total_cost_usd).toFixed(4)}` : '—'

  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: `1px solid ${BORDER}`,
        display: 'grid',
        gridTemplateColumns: '60px 1fr 52px',
        gap: 12,
        alignItems: 'start',
      }}
    >
      {/* 상태 + 시간 */}
      <div>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.1em',
            color: STATUS_COLOR[session.status] || '#555',
            fontFamily: FONT,
            textTransform: 'uppercase',
          }}
        >
          {STATUS_KO[session.status] || session.status}
        </span>
        <div style={{ fontSize: 9, color: '#2a2a28', fontFamily: FONT, marginTop: 4 }}>{ranAt}</div>
      </div>

      {/* 토픽 + 수치 */}
      <div>
        <p
          style={{
            fontSize: 11,
            color: '#777',
            fontFamily: FONT,
            margin: '0 0 6px',
            lineHeight: 1.5,
          }}
        >
          {topics}
        </p>
        {session.status === 'success' && (
          <span style={{ fontSize: 9, color: '#3a3a38', fontFamily: FONT }}>
            기사 {session.articles_fetched ?? '—'} 수집 · 인상 {session.impressions_saved ?? '—'}개
            저장
          </span>
        )}
        {session.status === 'failed' && session.error_msg && (
          <span style={{ fontSize: 9, color: '#f44336', fontFamily: FONT }}>
            {session.error_msg.slice(0, 60)}
          </span>
        )}
      </div>

      {/* 비용 */}
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 10, color: '#3a3a38', fontFamily: FONT }}>{costStr}</span>
      </div>
    </div>
  )
}

function TopicRow({ topic, onToggle }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    setLoading(true)
    try {
      await onToggle(topic.id, !topic.enabled)
    } finally {
      setLoading(false)
    }
  }, [topic.id, topic.enabled, onToggle])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: `1px solid ${BORDER}`,
        opacity: topic.enabled ? 1 : 0.45,
        transition: 'opacity 0.2s',
      }}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={`${topic.topic} ${topic.enabled ? '비활성화' : '활성화'}`}
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${topic.enabled ? YELLOW : '#333'}`,
          background: topic.enabled ? YELLOW : 'transparent',
          cursor: loading ? 'wait' : 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 11,
            color: topic.enabled ? '#bbb' : '#555',
            fontFamily: FONT,
            margin: 0,
          }}
        >
          {topic.topic}
        </p>
        {topic.description && (
          <p
            style={{
              fontSize: 9,
              color: '#333',
              fontFamily: FONT,
              margin: '3px 0 0',
              lineHeight: 1.5,
            }}
          >
            {topic.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default function WebLearningPanel({
  webLearning = {},
  isMobile: _isMobile,
  onTopicToggle,
  onRunNow,
}) {
  const sessions = webLearning.sessions || []
  const topics = webLearning.topics || []
  const impressionCount = webLearning.impressionCount || 0

  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)

  const handleRunNow = useCallback(async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch(`${KIN_API}/api/web-learning/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: 'kin', force: true }),
      })
      const d = await res.json()
      setRunResult(d.started ? '시작됨 — 로그 패널에서 진행 상황을 확인하세요.' : '이미 실행 중')
      if (onRunNow) onRunNow()
    } catch {
      setRunResult('실행 요청 실패')
    } finally {
      setRunning(false)
    }
  }, [onRunNow])

  const handleTopicToggle = useCallback(
    async (id, enabled) => {
      try {
        await fetch(`${KIN_API}/api/web-learning/topics/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        })
        if (onTopicToggle) onTopicToggle(id, enabled)
      } catch (err) {
        console.error('[WebLearningPanel] 토픽 업데이트 실패:', err)
      }
    },
    [onTopicToggle]
  )

  const lastSession = sessions[0]
  const lastRanAt = lastSession?.ran_at
    ? new Date(lastSession.ran_at).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <section aria-label="Web Learning">
      <SectionTitle
        num={8}
        title="Web Learning"
        action={
          impressionCount > 0 ? (
            <Label color={YELLOW} style={{ fontSize: 8 }}>
              {impressionCount}개의 인상
            </Label>
          ) : null
        }
      />

      {/* 요약 + 수동 트리거 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: '#555', fontFamily: FONT, margin: 0 }}>
            {lastRanAt ? `마지막 실행 ${lastRanAt}` : '아직 실행된 적 없어'}
          </p>
          {runResult && (
            <p style={{ fontSize: 10, color: YELLOW, fontFamily: FONT, marginTop: 6 }}>
              {runResult}
            </p>
          )}
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          style={{
            background: 'transparent',
            border: `1px solid ${running ? '#333' : '#2a2a28'}`,
            color: running ? '#333' : '#555',
            cursor: running ? 'wait' : 'pointer',
            fontSize: 10,
            fontFamily: FONT,
            padding: '7px 14px',
            letterSpacing: '0.08em',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!running) e.currentTarget.style.color = YELLOW
          }}
          onMouseLeave={(e) => {
            if (!running) e.currentTarget.style.color = '#555'
          }}
        >
          {running ? '실행 중...' : '지금 실행'}
        </button>
      </div>

      {/* 세션 이력 */}
      {sessions.length === 0 ? (
        <p style={{ fontSize: 12, color: '#333', fontFamily: FONT, lineHeight: 1.8 }}>
          아직 실행 이력이 없어. 매일 새벽 3시 자동으로 돌아.
        </p>
      ) : (
        <div style={{ marginBottom: 28 }}>
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}

      {/* 토픽 목록 */}
      {topics.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: '#2a2a28',
              fontFamily: FONT,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            관심 토픽
          </p>
          {topics.map((t) => (
            <TopicRow key={t.id} topic={t} onToggle={handleTopicToggle} />
          ))}
        </div>
      )}
    </section>
  )
}
