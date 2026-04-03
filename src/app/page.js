'use client'
// src/app/page.js  (대시보드)
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const WordCloud = dynamic(() => import('./components/WordCloud'), { ssr: false })

const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

const MOOD_IMAGE = {
  default:    '/kin_default.webp',
  happy:      '/kin_happy.webp',
  excited:    '/kin_excited.webp',
  thinking:   '/kin_thinking1.webp',
  serious:    '/kin_serious.webp',
  sad:        '/kin_sad.webp',
  laughing:   '/kin_laughing2.webp',
  shocked:    '/kin_shocked1.webp',
  energetic:  '/kin_energetic1.webp',
  interested: '/kin_interested1.webp',
  calm:       '/kin_calm.webp',
}

const SECTION_LABEL = {
  fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
  color: '#444', marginBottom: 20, fontFamily: "'DM Mono', monospace",
}

const CARD = {
  background: '#0d0d0b',
  border: '1px solid #1a1a18',
  padding: '24px',
  marginBottom: 2,
}

function StatBox({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 28, fontWeight: 700, color: accent || '#fff', fontFamily: "'DM Mono', monospace" }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 90, fontSize: 11, color: '#666', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 3, background: '#1a1a18', position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || '#FFE500', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ width: 28, fontSize: 11, color: '#555', fontFamily: "'DM Mono', monospace", textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const router  = useRouter()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})   // { [reflectionId]: text }
  const [submitting, setSubmitting] = useState({})
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [serviceRunning, setServiceRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const loadDashboard = useCallback(() => {
    setLoading(true)
    fetch(`${KIN_API}/api/kin/dashboard`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  async function submitAnswer(id) {
    const answer = answers[id]?.trim()
    if (!answer) return
    setSubmitting(p => ({ ...p, [id]: true }))
    try {
      await fetch(`${KIN_API}/api/kin/answer-request/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      setAnswers(p => { const n = { ...p }; delete n[id]; return n })
      loadDashboard()
    } finally {
      setSubmitting(p => ({ ...p, [id]: false }))
    }
  }

  async function runServiceReflection() {
    setServiceRunning(true)
    try {
      await fetch(`${KIN_API}/api/kin/service-reflection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      })
      loadDashboard()
    } finally {
      setServiceRunning(false)
    }
  }

  const mood       = data?.mood || 'default'
  const pending    = data?.pendingRequests || []
  const topics     = data?.topics || []
  const knowledge  = data?.knowledgeByCategory || {}
  const memory     = data?.memory || {}
  const svcStats   = data?.serviceStats || {}
  const expBySource = data?.expBySource || {}

  // 토픽 클릭 시 관련 경험 필터
  const topicExps = selectedTopic
    ? (data?.recentExperiences || []).filter(e =>
        e.content?.toLowerCase().includes(selectedTopic.word.toLowerCase()))
    : []

  const totalKnowledge = Object.values(knowledge).reduce((a, b) => a + b, 0)

  return (
    <div style={{
      background: '#080806', minHeight: '100vh',
      color: '#fff', fontFamily: "'DM Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a28; }
        .answer-btn:hover { background: #FFE500 !important; color: #000 !important; }
        .svc-btn:hover { border-color: #FFE500 !important; color: #FFE500 !important; }
        .chat-btn:hover { background: rgba(255,229,0,0.12) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        borderBottom: '1px solid #141412',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: 20,
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,6,0.96)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <Image
            src={MOOD_IMAGE[mood]} alt="KIN" fill
            style={{ objectFit: 'contain' }} priority
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#FFE500', marginBottom: 2 }}>KIN</div>
          <div style={{ fontSize: 12, color: '#444' }}>
            {loading ? '...' : `경험 ${data?.experienceCount || 0}개 · knowledge ${data?.knowledgeCount || 0}개`}
          </div>
        </div>
        {pending.length > 0 && (
          <div style={{
            background: '#FFE500', color: '#000',
            fontSize: 10, fontWeight: 700, padding: '4px 10px',
            letterSpacing: '0.15em',
          }}>
            {pending.length}개 요청
          </div>
        )}
        <button
          className="chat-btn"
          onClick={() => router.push('/chat')}
          style={{
            background: 'transparent', border: '1px solid #FFE500',
            color: '#FFE500', cursor: 'pointer', fontSize: 12,
            fontFamily: "'DM Mono', monospace", padding: '8px 20px',
            letterSpacing: '0.08em', transition: 'all 0.2s',
          }}
        >말 걸기 →</button>
      </div>

      {/* ── BODY ── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '24px 16px' : '40px 32px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 2,
      }}>

        {/* ── 1. KIN이 묻는 것들 ── */}
        {pending.length > 0 && (
          <div style={{ ...CARD, gridColumn: isMobile ? '1' : '1 / -1', borderLeft: '3px solid #FFE500' }}>
            <p style={SECTION_LABEL}>KIN이 묻는 것들</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pending.map(req => (
                <div key={req.id} style={{ borderBottom: '1px solid #1a1a18', paddingBottom: 16 }}>
                  <p style={{ fontSize: 14, color: '#e0e0d8', lineHeight: 1.8, margin: '0 0 12px' }}>
                    "{req.request_to_ben}"
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      value={answers[req.id] || ''}
                      onChange={e => setAnswers(p => ({ ...p, [req.id]: e.target.value }))}
                      placeholder="답해줘."
                      rows={2}
                      style={{
                        flex: 1, background: '#0a0a08', border: '1px solid #252523',
                        color: '#e0e0d8', fontSize: 13, padding: '8px 12px',
                        resize: 'none', fontFamily: "'DM Mono', monospace",
                        lineHeight: 1.6,
                      }}
                    />
                    <button
                      className="answer-btn"
                      onClick={() => submitAnswer(req.id)}
                      disabled={submitting[req.id] || !answers[req.id]?.trim()}
                      style={{
                        background: 'transparent', border: '1px solid #FFE500',
                        color: '#FFE500', cursor: 'pointer', fontSize: 12,
                        fontFamily: "'DM Mono', monospace", padding: '8px 16px',
                        transition: 'all 0.2s', opacity: submitting[req.id] ? 0.5 : 1,
                      }}
                    >{submitting[req.id] ? '...' : '전달'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. Embedding Space (토픽 클라우드) ── */}
        <div style={{ ...CARD, gridColumn: isMobile ? '1' : '1 / -1' }}>
          <p style={SECTION_LABEL}>KIN의 Embedding Space</p>
          {loading ? (
            <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              loading...
            </div>
          ) : isMobile ? (
            // 모바일: 정적 태그 클라우드
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
              {topics.slice(0, 25).map(t => (
                <span
                  key={t.word}
                  onClick={() => setSelectedTopic(selectedTopic?.word === t.word ? null : t)}
                  style={{
                    fontSize: Math.max(11, Math.min(22, 10 + t.count * 1.5)),
                    color: t.salience >= 0.7 ? '#FFE500' : '#fff',
                    opacity: selectedTopic && selectedTopic.word !== t.word ? 0.3 : (0.4 + t.salience * 0.6),
                    cursor: 'pointer', padding: '2px 6px',
                    background: selectedTopic?.word === t.word ? 'rgba(255,229,0,0.1)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >{t.word}</span>
              ))}
            </div>
          ) : (
            <WordCloud topics={topics} onTopicClick={t => setSelectedTopic(selectedTopic?.word === t.word ? null : t)} />
          )}

          {/* 선택된 토픽 관련 경험 */}
          {selectedTopic && (
            <div style={{ marginTop: 16, borderTop: '1px solid #1a1a18', paddingTop: 16 }}>
              <p style={{ ...SECTION_LABEL, marginBottom: 12 }}>
                "{selectedTopic.word}" 관련 경험 {topicExps.length}개
              </p>
              {topicExps.length === 0 ? (
                <p style={{ fontSize: 12, color: '#444' }}>최근 경험에서 찾을 수 없어.</p>
              ) : topicExps.slice(0, 3).map((e, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '8px 12px', background: '#0a0a08', borderLeft: '2px solid #252523' }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>
                    {new Date(e.created_at).toLocaleDateString('ko-KR')} · {e.source}
                  </p>
                  <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.7 }}>
                    {e.content.slice(0, 120)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. KIN의 성장 ── */}
        <div style={CARD}>
          <p style={SECTION_LABEL}>KIN의 성장</p>
          <div style={{ display: 'flex', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
            <StatBox label="총 경험" value={data?.experienceCount || 0} accent="#FFE500" />
            <StatBox label="Knowledge" value={data?.knowledgeCount || 0} />
            <StatBox label="메모리 레이어" value={Object.values(memory).filter(Boolean).length} />
          </div>

          <p style={{ ...SECTION_LABEL, marginBottom: 12 }}>Experience 소스</p>
          {Object.entries(expBySource).map(([src, cnt]) => (
            <BarRow key={src} label={src.replace('service:', '')} value={cnt}
              max={Math.max(...Object.values(expBySource))} color="#FFE500" />
          ))}

          <p style={{ ...SECTION_LABEL, marginTop: 20, marginBottom: 12 }}>Knowledge 카테고리</p>
          {Object.entries(knowledge).map(([cat, cnt]) => (
            <BarRow key={cat} label={cat} value={cnt} max={totalKnowledge} color="#888" />
          ))}
        </div>

        {/* ── 4. 우리의 관계 ── */}
        <div style={CARD}>
          <p style={SECTION_LABEL}>우리의 관계</p>

          {memory.user_profile ? (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: '#0a0a08', borderLeft: '2px solid #252523' }}>
              <p style={{ fontSize: 11, color: '#444', margin: '0 0 6px', letterSpacing: '0.15em' }}>KIN이 보는 BEN</p>
              <p style={{ fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.8 }}>
                {memory.user_profile.slice(0, 200)}{memory.user_profile.length > 200 ? '...' : ''}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#444', marginBottom: 20 }}>아직 없어. 말 걸어봐.</p>
          )}

          {data?.lastReflection && (
            <>
              <p style={{ ...SECTION_LABEL, marginBottom: 12 }}>마지막 Reflection</p>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.8, marginBottom: 8 }}>
                ✓ {data.lastReflection.what_worked}
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                △ {data.lastReflection.what_to_improve}
              </div>
              <p style={{ fontSize: 10, color: '#333', marginTop: 8 }}>
                {new Date(data.lastReflection.created_at).toLocaleString('ko-KR')}
              </p>
            </>
          )}
        </div>

        {/* ── 5. 서비스 현황 ── */}
        <div style={{ ...CARD, gridColumn: isMobile ? '1' : '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ ...SECTION_LABEL, margin: 0 }}>서비스 현황</p>
            <button
              className="svc-btn"
              onClick={runServiceReflection}
              disabled={serviceRunning}
              style={{
                background: 'transparent', border: '1px solid #333',
                color: '#555', cursor: 'pointer', fontSize: 11,
                fontFamily: "'DM Mono', monospace", padding: '6px 16px',
                letterSpacing: '0.08em', transition: 'all 0.2s',
                opacity: serviceRunning ? 0.5 : 1,
              }}
            >{serviceRunning ? '처리 중...' : 'Service Reflection 실행'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {Object.entries(svcStats).map(([svc, stat]) => (
              <div key={svc} style={{ padding: '16px', background: '#0a0a08', border: '1px solid #141412' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.25em', color: '#FFE500', marginBottom: 12, textTransform: 'uppercase' }}>
                  {svc}
                </p>
                <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                  <StatBox label="총" value={stat.total} />
                  <StatBox label="처리됨" value={stat.processed} accent="#4a4" />
                  <StatBox label="미처리" value={stat.unprocessed} accent={stat.unprocessed > 0 ? '#a44' : '#555'} />
                </div>
                {Object.entries(stat.byType).slice(0, 4).map(([type, cnt]) => (
                  <BarRow key={type} label={type.replace('scenario_', '')}
                    value={cnt} max={stat.total} color="#333" />
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
