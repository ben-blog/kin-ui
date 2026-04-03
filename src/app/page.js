'use client'
// src/app/page.js  (대시보드 v2)
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const WordCloud = dynamic(() => import('./components/WordCloud'), { ssr: false })

const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

const MOOD_IMAGE = {
  default:    '/kin_default.webp', happy: '/kin_happy.webp', excited: '/kin_excited.webp',
  thinking:   '/kin_thinking1.webp', serious: '/kin_serious.webp', sad: '/kin_sad.webp',
  laughing:   '/kin_laughing2.webp', shocked: '/kin_shocked1.webp', energetic: '/kin_energetic1.webp',
  interested: '/kin_interested1.webp', calm: '/kin_calm.webp',
}

// 섹션 헤더
function SectionHeader({ num, title }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ height: 1, background: '#1f1f1d', marginBottom: 14 }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>
          {String(num).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 18, color: '#FFE500', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>
          {title}
        </span>
      </div>
    </div>
  )
}

// 숫자 스탯
function StatBox({ label, value, accent, size = 32 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: size, fontWeight: 700, color: accent || '#fff', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
    </div>
  )
}

// 바 차트 행
function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <span style={{ width: 100, fontSize: 12, color: '#888', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: '#1a1a18' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || '#FFE500', transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ width: 24, fontSize: 12, color: '#666', fontFamily: "'DM Mono', monospace", textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [serviceRunning, setServiceRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      })
      loadDashboard()
    } finally {
      setServiceRunning(false)
    }
  }

  const mood      = data?.mood || 'default'
  const pending   = data?.pendingRequests || []
  const topics    = data?.topics || []
  const knowledge = data?.knowledgeByCategory || {}
  const memory    = data?.memory || {}
  const svcStats  = data?.serviceStats || {}
  const expBySource = data?.expBySource || {}
  const totalKnowledge = Object.values(knowledge).reduce((a, b) => a + b, 0)

  const topicExps = selectedTopic
    ? (data?.recentExperiences || []).filter(e =>
        e.content?.toLowerCase().includes(selectedTopic.word.toLowerCase()))
    : []

  // ── 섹션들 ──────────────────────────────────────────

  const sectionRequests = (
    <div>
      <SectionHeader num={1} title="KIN이 묻는 것들" />
      {pending.length === 0 ? (
        <p style={{ fontSize: 14, color: '#444', lineHeight: 2 }}>미답변 요청 없어.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {pending.map(req => (
            <div key={req.id} style={{
              borderLeft: '3px solid #FFE500', paddingLeft: 16,
              paddingBottom: 20, borderBottom: '1px solid #141412',
            }}>
              <p style={{ fontSize: 15, color: '#e0e0d8', lineHeight: 1.8, margin: '0 0 14px' }}>
                {req.request_to_ben}
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={answers[req.id] || ''}
                  onChange={e => setAnswers(p => ({ ...p, [req.id]: e.target.value }))}
                  placeholder="답해줘."
                  rows={2}
                  style={{
                    flex: 1, background: '#0a0a08', border: '1px solid #2a2a28',
                    color: '#e0e0d8', fontSize: 14, padding: '10px 12px',
                    resize: 'none', fontFamily: "'DM Mono', monospace", lineHeight: 1.6,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => submitAnswer(req.id)}
                  disabled={submitting[req.id] || !answers[req.id]?.trim()}
                  style={{
                    background: answers[req.id]?.trim() ? '#FFE500' : 'transparent',
                    border: '1px solid #FFE500', color: answers[req.id]?.trim() ? '#000' : '#FFE500',
                    cursor: 'pointer', fontSize: 12, fontFamily: "'DM Mono', monospace",
                    padding: '10px 18px', transition: 'all 0.2s',
                    opacity: submitting[req.id] ? 0.5 : 1,
                  }}
                >{submitting[req.id] ? '...' : '전달'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const sectionRelation = (
    <div>
      <SectionHeader num={2} title="우리의 관계" />
      {memory.user_profile ? (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#FFE500', marginBottom: 10, textTransform: 'uppercase' }}>
            KIN이 보는 BEN
          </p>
          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.9, margin: 0 }}>
            {memory.user_profile.slice(0, 240)}{memory.user_profile.length > 240 ? '...' : ''}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: '#444', marginBottom: 24 }}>아직 없어.</p>
      )}
      {data?.lastReflection && (
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#555', marginBottom: 12, textTransform: 'uppercase' }}>
            마지막 Reflection
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8, margin: 0 }}>
              ✓ {data.lastReflection.what_worked}
            </p>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: 0 }}>
              △ {data.lastReflection.what_to_improve}
            </p>
          </div>
          <p style={{ fontSize: 10, color: '#333', marginTop: 10 }}>
            {new Date(data.lastReflection.created_at).toLocaleString('ko-KR')}
          </p>
        </div>
      )}
    </div>
  )

  const sectionEmbedding = (
    <div>
      <SectionHeader num={3} title="Embedding Space" />
      {loading ? (
        <div style={{ height: isMobile ? 200 : 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12 }}>
          loading...
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0 16px' }}>
          {topics.slice(0, 25).map(t => (
            <span key={t.word} onClick={() => setSelectedTopic(selectedTopic?.word === t.word ? null : t)}
              style={{
                fontSize: Math.max(12, Math.min(24, 10 + t.count * 1.8)),
                color: t.salience >= 0.7 ? '#FFE500' : '#ccc',
                opacity: selectedTopic && selectedTopic.word !== t.word ? 0.25 : 1,
                cursor: 'pointer', padding: '2px 4px',
                background: selectedTopic?.word === t.word ? 'rgba(255,229,0,0.08)' : 'transparent',
                transition: 'all 0.2s', fontFamily: "'DM Mono', monospace",
              }}>{t.word}</span>
          ))}
        </div>
      ) : (
        <WordCloud topics={topics} onTopicClick={t => setSelectedTopic(selectedTopic?.word === t.word ? null : t)} />
      )}
      {selectedTopic && (
        <div style={{ marginTop: 16, borderTop: '1px solid #1a1a18', paddingTop: 16 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#FFE500', marginBottom: 12, textTransform: 'uppercase' }}>
            "{selectedTopic.word}" 관련 경험 {topicExps.length}개
          </p>
          {topicExps.length === 0 ? (
            <p style={{ fontSize: 13, color: '#444' }}>최근 경험에서 찾을 수 없어.</p>
          ) : topicExps.slice(0, 3).map((e, i) => (
            <div key={i} style={{ marginBottom: 12, padding: '10px 14px', background: '#0a0a08', borderLeft: '2px solid #2a2a28' }}>
              <p style={{ fontSize: 11, color: '#555', margin: '0 0 6px' }}>
                {new Date(e.created_at).toLocaleDateString('ko-KR')} · {e.source}
              </p>
              <p style={{ fontSize: 13, color: '#bbb', margin: 0, lineHeight: 1.7 }}>
                {e.content.slice(0, 140)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const sectionGrowth = (
    <div>
      <SectionHeader num={4} title="KIN의 성장" />
      <div style={{ display: 'flex', gap: isMobile ? 28 : 40, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatBox label="총 경험" value={data?.experienceCount || 0} accent="#FFE500" size={isMobile ? 28 : 40} />
        <StatBox label="Knowledge" value={data?.knowledgeCount || 0} size={isMobile ? 28 : 40} />
        <StatBox label="메모리 레이어" value={Object.values(memory).filter(Boolean).length} size={isMobile ? 28 : 40} />
      </div>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#444', marginBottom: 14, textTransform: 'uppercase' }}>
        Experience 소스
      </p>
      {Object.entries(expBySource).map(([src, cnt]) => (
        <BarRow key={src} label={src.replace('service:', '')} value={cnt}
          max={Math.max(...Object.values(expBySource))} color="#FFE500" />
      ))}
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#444', marginTop: 20, marginBottom: 14, textTransform: 'uppercase' }}>
        Knowledge 카테고리
      </p>
      {Object.entries(knowledge).map(([cat, cnt]) => (
        <BarRow key={cat} label={cat} value={cnt} max={totalKnowledge} color="#555" />
      ))}
    </div>
  )

  const sectionService = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ height: 1, background: '#1f1f1d', marginBottom: 14 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono', monospace" }}>05</span>
            <span style={{ fontSize: 18, color: '#FFE500', fontFamily: "'DM Mono', monospace" }}>서비스 현황</span>
          </div>
        </div>
        <button
          onClick={runServiceReflection}
          disabled={serviceRunning}
          style={{
            background: 'transparent', border: '1px solid #333',
            color: serviceRunning ? '#333' : '#666', cursor: serviceRunning ? 'default' : 'pointer',
            fontSize: 11, fontFamily: "'DM Mono', monospace", padding: '8px 18px',
            letterSpacing: '0.08em', transition: 'all 0.2s',
          }}
        >{serviceRunning ? '처리 중...' : 'Service Reflection 실행'}</button>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
        {Object.entries(svcStats).map(([svc, stat]) => (
          <div key={svc} style={{ padding: '20px', background: '#0a0a08', border: '1px solid #141412' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#FFE500', marginBottom: 16, textTransform: 'uppercase' }}>
              {svc}
            </p>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <StatBox label="총" value={stat.total} size={24} />
              <StatBox label="처리됨" value={stat.processed} accent="#6a6" size={24} />
              <StatBox label="미처리" value={stat.unprocessed} accent={stat.unprocessed > 0 ? '#a44' : '#444'} size={24} />
            </div>
            {Object.entries(stat.byType).slice(0, 4).map(([type, cnt]) => (
              <BarRow key={type} label={type.replace('scenario_', '').replace('image_', '')}
                value={cnt} max={stat.total} color="#333" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ background: '#080806', minHeight: '100vh', color: '#fff', fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { outline: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a28; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,6,0.97)', borderBottom: '1px solid #141412',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 16,
        padding: isMobile ? '12px 16px' : '14px 32px',
      }}>
        <div style={{ position: 'relative', width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, flexShrink: 0 }}>
          <Image src={MOOD_IMAGE[mood]} alt="KIN" fill style={{ objectFit: 'contain', transition: 'all 0.3s' }} priority />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.3em', color: '#FFE500', marginBottom: 3 }}>KIN</p>
          <p style={{ fontSize: 11, color: '#555' }}>
            {loading ? '...' : `경험 ${data?.experienceCount || 0} · knowledge ${data?.knowledgeCount || 0}`}
          </p>
        </div>
        {pending.length > 0 && (
          <div style={{ background: '#FFE500', color: '#000', fontSize: 10, fontWeight: 700, padding: '5px 12px', letterSpacing: '0.1em', flexShrink: 0 }}>
            {pending.length}개 요청
          </div>
        )}
        <button
          onClick={() => router.push('/chat')}
          style={{
            background: 'transparent', border: '1px solid #FFE500', color: '#FFE500',
            cursor: 'pointer', fontSize: 12, fontFamily: "'DM Mono', monospace",
            padding: isMobile ? '8px 14px' : '9px 22px', letterSpacing: '0.08em',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >말 걸기 →</button>
      </div>

      {/* ── PC 레이아웃 ── */}
      {!isMobile ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px 48px' }}>

          {/* 상단: Embedding(좌 60%) + 요청/관계(우 40%) */}
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 0, minHeight: 560 }}>
            {/* 왼쪽: Embedding */}
            <div style={{ padding: '40px 40px 40px 0', borderRight: '1px solid #141412' }}>
              {sectionEmbedding}
            </div>
            {/* 오른쪽: 요청 + 관계 */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '40px 0 32px 40px', borderBottom: '1px solid #141412', flex: pending.length > 0 ? '0 0 auto' : '1' }}>
                {sectionRequests}
              </div>
              <div style={{ padding: '32px 0 40px 40px', flex: 1, overflowY: 'auto' }}>
                {sectionRelation}
              </div>
            </div>
          </div>

          {/* 하단: 성장(30%) + 서비스(70%) */}
          <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: 0, borderTop: '1px solid #141412' }}>
            <div style={{ padding: '40px 40px 40px 0', borderRight: '1px solid #141412' }}>
              {sectionGrowth}
            </div>
            <div style={{ padding: '40px 0 40px 40px' }}>
              {sectionService}
            </div>
          </div>
        </div>
      ) : (
        /* ── 모바일 레이아웃 ── */
        <div style={{ padding: '24px 16px 48px' }}>
          <div style={{ marginBottom: 40 }}>{sectionRequests}</div>
          <div style={{ marginBottom: 40 }}>{sectionEmbedding}</div>
          <div style={{ marginBottom: 40 }}>{sectionGrowth}</div>
          <div style={{ marginBottom: 40 }}>{sectionRelation}</div>
          <div>{sectionService}</div>
        </div>
      )}
    </div>
  )
}
