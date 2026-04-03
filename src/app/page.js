'use client'
// src/app/page.js — 대시보드 v3
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const WordCloud = dynamic(() => import('./components/WordCloud'), { ssr: false })
const KIN_API = process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

const MOOD_IMAGE = {
  default:'/kin_default.webp', happy:'/kin_happy.webp', excited:'/kin_excited.webp',
  thinking:'/kin_thinking1.webp', serious:'/kin_serious.webp', sad:'/kin_sad.webp',
  laughing:'/kin_laughing2.webp', shocked:'/kin_shocked1.webp', energetic:'/kin_energetic1.webp',
  interested:'/kin_interested1.webp', calm:'/kin_calm.webp',
}

// 질문 유형 감지
function detectQuestionType(text) {
  if (!text) return 'free'
  if (/해도 되는지|알려도 되는지|좋을지|여부|괜찮|맞는지/.test(text)) return 'yesno'
  if (/검토|연결|고려|추가|진행|필요/.test(text)) return 'review'
  return 'free'
}

function SectionHeader({ num, title }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ height: 1, background: '#1f1f1d', marginBottom: 12 }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#444', fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em' }}>{String(num).padStart(2,'0')}</span>
        <span style={{ fontSize: 17, color: '#FFE500', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em' }}>{title}</span>
      </div>
    </div>
  )
}

function StatBox({ label, value, accent, size=32 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <span style={{ fontSize:size, fontWeight:700, color:accent||'#fff', fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{value}</span>
      <span style={{ fontSize:10, color:'#555', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace" }}>{label}</span>
    </div>
  )
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <span style={{ width:90, fontSize:11, color:'#777', fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:2, background:'#1a1a18' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color||'#FFE500', transition:'width 0.8s ease' }}/>
      </div>
      <span style={{ width:22, fontSize:11, color:'#555', fontFamily:"'DM Mono',monospace", textAlign:'right' }}>{value}</span>
    </div>
  )
}

// 호버 가능한 섹션 래퍼
function HoverSection({ children, style }) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(false) }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...style,
        transition: 'all 0.25s ease',
        transform: hovered ? 'scale(1.003)' : 'scale(1)',
        background: active ? 'rgba(255,229,0,0.04)' : hovered ? 'rgba(255,255,255,0.015)' : 'transparent',
        borderRadius: 2,
      }}
    >{children}</div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [qIndex, setQIndex] = useState(0)
  const [qStats, setQStats] = useState({ answered: 0, skipped: 0 })
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [serviceRunning, setServiceRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadDashboard = useCallback(() => {
    setLoading(true)
    fetch(`${KIN_API}/api/kin/dashboard`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setQIndex(0) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = bottomSheetOpen ? 'hidden' : ''
    }
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = '' }
  }, [bottomSheetOpen])

  async function doAnswer(id, answer, skip = false) {
    setSubmitting(p => ({ ...p, [id]: true }))
    try {
      await fetch(`${KIN_API}/api/kin/answer-request/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skip ? { skip: true } : { answer }),
      })
      setQStats(p => skip ? { ...p, skipped: p.skipped + 1 } : { ...p, answered: p.answered + 1 })
      // 다음 질문으로 이동
      setQIndex(i => {
        const pending = data?.pendingRequests || []
        return Math.min(i, pending.length - 2)
      })
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
  const totalKnowledge = Object.values(knowledge).reduce((a,b)=>a+b,0)
  const unprocessedTotal = Object.values(svcStats).reduce((a,s)=>a+(s.unprocessed||0),0)

  const topicExps = selectedTopic
    ? (data?.recentExperiences||[]).filter(e=>e.content?.toLowerCase().includes(selectedTopic.word.toLowerCase()))
    : []

  const currentQ = pending[qIndex]
  const qType = detectQuestionType(currentQ?.request_to_ben)

  // ── 질문 카드 ────────────────────────────────────────
  const questionCard = (
    <div>
      <SectionHeader num={2} title="KIN이 묻는 것들" />
      {pending.length === 0 ? (
        <p style={{ fontSize:14, color:'#444', lineHeight:2 }}>미답변 요청 없어.</p>
      ) : (
        <div>
          {/* 누적 카운터 */}
          <div style={{ display:'flex', gap:16, marginBottom:20 }}>
            <span style={{ fontSize:11, color:'#888', fontFamily:"'DM Mono',monospace" }}>남음 <span style={{ color:'#FFE500' }}>{pending.length}</span></span>
            <span style={{ fontSize:11, color:'#555', fontFamily:"'DM Mono',monospace" }}>답변 <span style={{ color:'#6a6' }}>{qStats.answered}</span></span>
            <span style={{ fontSize:11, color:'#555', fontFamily:"'DM Mono',monospace" }}>스킵 <span style={{ color:'#888' }}>{qStats.skipped}</span></span>
          </div>

          {/* 질문 내용 */}
          {currentQ && (
            <div style={{ borderLeft:'3px solid #FFE500', paddingLeft:16, marginBottom:20 }}>
              <p style={{ fontSize:15, color:'#e0e0d8', lineHeight:1.85, margin:'0 0 20px' }}>
                {currentQ.request_to_ben}
              </p>

              {/* 스마트 답변 버튼 */}
              {qType === 'yesno' && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <AnswerBtn label="예" onClick={() => doAnswer(currentQ.id, '예')} accent />
                  <AnswerBtn label="아니오" onClick={() => doAnswer(currentQ.id, '아니오')} />
                  <AnswerBtn label="답 안 하겠음" onClick={() => doAnswer(currentQ.id, null, true)} muted />
                </div>
              )}
              {qType === 'review' && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <AnswerBtn label="진행하자" onClick={() => doAnswer(currentQ.id, '진행하자')} accent />
                  <AnswerBtn label="나중에" onClick={() => doAnswer(currentQ.id, '나중에')} />
                  <AnswerBtn label="답 안 하겠음" onClick={() => doAnswer(currentQ.id, null, true)} muted />
                </div>
              )}
              {qType === 'free' && (
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <textarea
                      value={answers[currentQ.id]||''}
                      onChange={e=>setAnswers(p=>({...p,[currentQ.id]:e.target.value}))}
                      placeholder="답해줘."
                      rows={2}
                      style={{
                        flex:1, background:'#0a0a08', border:'1px solid #2a2a28',
                        color:'#e0e0d8', fontSize:14, padding:'10px 12px',
                        resize:'none', fontFamily:"'DM Mono',monospace", lineHeight:1.6, outline:'none',
                      }}
                    />
                    <button
                      onClick={() => doAnswer(currentQ.id, answers[currentQ.id])}
                      disabled={submitting[currentQ.id]||!answers[currentQ.id]?.trim()}
                      style={{
                        background: answers[currentQ.id]?.trim() ? '#FFE500':'transparent',
                        border:'1px solid #FFE500', color: answers[currentQ.id]?.trim() ? '#000':'#FFE500',
                        cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace",
                        padding:'10px 16px', transition:'all 0.2s',
                        opacity: submitting[currentQ.id]?0.5:1,
                      }}
                    >{submitting[currentQ.id]?'...':'전달'}</button>
                  </div>
                  <button
                    onClick={() => doAnswer(currentQ.id, null, true)}
                    style={{
                      marginTop:8, background:'transparent', border:'none',
                      color:'#444', cursor:'pointer', fontSize:11,
                      fontFamily:"'DM Mono',monospace", padding:0, letterSpacing:'0.1em',
                    }}
                  >답 안 하겠음 →</button>
                </div>
              )}
            </div>
          )}

          {/* 페이지네이션 */}
          {pending.length > 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:16 }}>
              <button
                onClick={() => setQIndex(i=>Math.max(0,i-1))}
                disabled={qIndex===0}
                style={{ background:'transparent', border:'1px solid #2a2a28', color: qIndex===0?'#333':'#888', cursor: qIndex===0?'default':'pointer', padding:'6px 12px', fontFamily:"'DM Mono',monospace", fontSize:14, transition:'all 0.2s' }}
              >←</button>
              <span style={{ fontSize:11, color:'#555', fontFamily:"'DM Mono',monospace", flex:1, textAlign:'center' }}>
                {qIndex+1} / {pending.length}
              </span>
              <button
                onClick={() => setQIndex(i=>Math.min(pending.length-1,i+1))}
                disabled={qIndex===pending.length-1}
                style={{ background:'transparent', border:'1px solid #2a2a28', color: qIndex===pending.length-1?'#333':'#888', cursor: qIndex===pending.length-1?'default':'pointer', padding:'6px 12px', fontFamily:"'DM Mono',monospace", fontSize:14, transition:'all 0.2s' }}
              >→</button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const sectionRelation = (
    <div>
      <SectionHeader num={3} title="우리의 관계" />
      {memory.user_profile ? (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#FFE500', marginBottom:10, textTransform:'uppercase' }}>KIN이 보는 BEN</p>
          <p style={{ fontSize:14, color:'#ccc', lineHeight:1.9, margin:0 }}>
            {memory.user_profile.slice(0,220)}{memory.user_profile.length>220?'...':''}
          </p>
        </div>
      ) : <p style={{ fontSize:14, color:'#444', marginBottom:20 }}>아직 없어.</p>}
      {data?.lastReflection && (
        <div>
          <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#555', marginBottom:12, textTransform:'uppercase' }}>마지막 Reflection</p>
          <p style={{ fontSize:13, color:'#888', lineHeight:1.8, margin:'0 0 8px' }}>✓ {data.lastReflection.what_worked}</p>
          <p style={{ fontSize:13, color:'#555', lineHeight:1.8, margin:0 }}>△ {data.lastReflection.what_to_improve}</p>
          <p style={{ fontSize:10, color:'#333', marginTop:8 }}>{new Date(data.lastReflection.created_at).toLocaleString('ko-KR')}</p>
        </div>
      )}
    </div>
  )

  const sectionEmbedding = (
    <div>
      <SectionHeader num={1} title="Embedding Space" />
      {loading ? (
        <div style={{ height:isMobile?180:340, display:'flex', alignItems:'center', justifyContent:'center', color:'#333', fontSize:12 }}>loading...</div>
      ) : isMobile ? (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'4px 0 16px' }}>
          {topics.slice(0,25).map(t=>(
            <span key={t.word} onClick={()=>setSelectedTopic(selectedTopic?.word===t.word?null:t)}
              style={{ fontSize:Math.max(12,Math.min(24,10+t.count*1.8)), color:t.salience>=0.7?'#FFE500':'#ccc',
                opacity:selectedTopic&&selectedTopic.word!==t.word?0.25:1, cursor:'pointer', padding:'2px 4px',
                background:selectedTopic?.word===t.word?'rgba(255,229,0,0.08)':'transparent',
                transition:'all 0.2s', fontFamily:"'DM Mono',monospace" }}>{t.word}</span>
          ))}
        </div>
      ) : (
        <WordCloud topics={topics} onTopicClick={t=>setSelectedTopic(selectedTopic?.word===t.word?null:t)} />
      )}
      {selectedTopic && (
        <div style={{ marginTop:16, borderTop:'1px solid #1a1a18', paddingTop:16 }}>
          <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#FFE500', marginBottom:12, textTransform:'uppercase' }}>
            "{selectedTopic.word}" 관련 경험 {topicExps.length}개
          </p>
          {topicExps.length===0 ? <p style={{ fontSize:13, color:'#444' }}>최근 경험에서 찾을 수 없어.</p>
          : topicExps.slice(0,3).map((e,i)=>(
            <div key={i} style={{ marginBottom:10, padding:'10px 14px', background:'#0a0a08', borderLeft:'2px solid #2a2a28' }}>
              <p style={{ fontSize:11, color:'#555', margin:'0 0 5px' }}>{new Date(e.created_at).toLocaleDateString('ko-KR')} · {e.source}</p>
              <p style={{ fontSize:13, color:'#bbb', margin:0, lineHeight:1.7 }}>{e.content.slice(0,140)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const sectionGrowth = (
    <div>
      <SectionHeader num={4} title="KIN의 성장" />
      <div style={{ display:'flex', gap:isMobile?24:36, marginBottom:28, flexWrap:'wrap' }}>
        <StatBox label="총 경험" value={data?.experienceCount||0} accent="#FFE500" size={isMobile?28:38} />
        <StatBox label="Knowledge" value={data?.knowledgeCount||0} size={isMobile?28:38} />
        <StatBox label="메모리 레이어" value={Object.values(memory).filter(Boolean).length} size={isMobile?28:38} />
      </div>
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#444', marginBottom:12, textTransform:'uppercase' }}>Experience 소스</p>
      {Object.entries(expBySource).map(([src,cnt])=>(
        <BarRow key={src} label={src.replace('service:','')} value={cnt} max={Math.max(1, ...Object.values(expBySource))} color="#FFE500" />
      ))}
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:'#444', marginTop:18, marginBottom:12, textTransform:'uppercase' }}>Knowledge 카테고리</p>
      {Object.entries(knowledge).map(([cat,cnt])=>(
        <BarRow key={cat} label={cat} value={cnt} max={totalKnowledge} color="#555" />
      ))}
    </div>
  )

  const sectionService = (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:0, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ height:1, background:'#1f1f1d', marginBottom:12 }}/>
          <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
            <span style={{ fontSize:10, color:'#444', fontFamily:"'DM Mono',monospace" }}>05</span>
            <span style={{ fontSize:17, color:'#FFE500', fontFamily:"'DM Mono',monospace" }}>서비스 현황</span>
          </div>
        </div>
        <button
          onClick={runServiceReflection}
          disabled={serviceRunning || unprocessedTotal===0}
          style={{
            background:'transparent',
            border:`1px solid ${serviceRunning||unprocessedTotal===0?'#222':'#444'}`,
            color: serviceRunning||unprocessedTotal===0?'#333':'#888',
            cursor: serviceRunning||unprocessedTotal===0?'default':'pointer',
            fontSize:11, fontFamily:"'DM Mono',monospace", padding:'8px 16px',
            letterSpacing:'0.08em', transition:'all 0.2s',
          }}
        >
          {serviceRunning ? '처리 중...' : unprocessedTotal===0 ? '미처리 없음' : `Service Reflection 실행 (${unprocessedTotal})`}
        </button>
      </div>
      <div style={{ marginTop:20, display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit, minmax(220px,1fr))', gap:2 }}>
        {Object.entries(svcStats).map(([svc,stat])=>(
          <div key={svc} style={{ padding:'18px', background:'#0a0a08', border:'1px solid #141412' }}>
            <p style={{ fontSize:10, letterSpacing:'0.28em', color:'#FFE500', marginBottom:14, textTransform:'uppercase' }}>{svc}</p>
            <div style={{ display:'flex', gap:20, marginBottom:14 }}>
              <StatBox label="총" value={stat.total} size={22} />
              <StatBox label="처리됨" value={stat.processed} accent="#6a6" size={22} />
              <StatBox label="미처리" value={stat.unprocessed} accent={stat.unprocessed>0?'#a44':'#444'} size={22} />
            </div>
            {Object.entries(stat.byType).slice(0,4).map(([type,cnt])=>(
              <BarRow key={type} label={type.replace('scenario_','').replace('image_','')} value={cnt} max={stat.total} color="#333" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  // 바텀 시트 터치 핸들링
  const handleTouchStart = e => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = e => {
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (dy < -50) setBottomSheetOpen(true)
    if (dy > 50)  setBottomSheetOpen(false)
  }

  return (
    <div style={{ background:'#080806', minHeight:'100vh', color:'#fff', fontFamily:"'DM Mono',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea{outline:none;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#2a2a28;}
      `}</style>

      {/* HEADER */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(8,8,6,0.97)', borderBottom:'1px solid #141412',
        backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', gap:16,
        padding: isMobile?'12px 16px':'14px 32px',
      }}>
        <div style={{ position:'relative', width:isMobile?44:52, height:isMobile?44:52, flexShrink:0 }}>
          <Image src={MOOD_IMAGE[mood]} alt="KIN" fill style={{ objectFit:'contain', transition:'all 0.3s' }} priority />
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10, letterSpacing:'0.3em', color:'#FFE500', marginBottom:3 }}>KIN</p>
          <p style={{ fontSize:11, color:'#555' }}>{loading?'...': `경험 ${data?.experienceCount||0} · knowledge ${data?.knowledgeCount||0}`}</p>
        </div>
        {pending.length>0 && (
          <div style={{ background:'#FFE500', color:'#000', fontSize:10, fontWeight:700, padding:'5px 12px', letterSpacing:'0.1em', flexShrink:0 }}>
            {pending.length}개 요청
          </div>
        )}
        <button
          onClick={()=>router.push('/chat')}
          style={{
            background:'transparent', border:'1px solid #FFE500', color:'#FFE500',
            cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace",
            padding: isMobile?'8px 14px':'9px 22px', letterSpacing:'0.08em',
            transition:'all 0.2s', flexShrink:0,
          }}
        >말 걸기 →</button>
      </div>

      {/* PC LAYOUT */}
      {!isMobile ? (
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 32px 48px' }}>
          {/* 상단: Embedding(좌 58%) | 질문/관계(우 42%) */}
          <div style={{ display:'grid', gridTemplateColumns:'58% 42%', borderBottom:'1px solid #141412' }}>
            {/* 왼쪽 */}
            <HoverSection style={{ padding:'36px 36px 36px 0', borderRight:'1px solid #141412' }}>
              {sectionEmbedding}
            </HoverSection>
            {/* 오른쪽: 고정 높이 + 내부 페이지네이션 */}
            <div style={{ display:'flex', flexDirection:'column', height: 560 }}>
              <HoverSection style={{ padding:'36px 0 28px 36px', borderBottom:'1px solid #141412', flex:'0 0 auto', overflow:'hidden' }}>
                {questionCard}
              </HoverSection>
              <HoverSection style={{ padding:'28px 0 36px 36px', flex:1, overflowY:'auto' }}>
                {sectionRelation}
              </HoverSection>
            </div>
          </div>

          {/* 하단: 성장(35%) | 서비스(65%) */}
          <div style={{ display:'grid', gridTemplateColumns:'35% 65%' }}>
            <HoverSection style={{ padding:'36px 36px 36px 0', borderRight:'1px solid #141412' }}>
              {sectionGrowth}
            </HoverSection>
            <HoverSection style={{ padding:'36px 0 36px 36px' }}>
              {sectionService}
            </HoverSection>
          </div>
        </div>
      ) : (
        /* MOBILE LAYOUT */
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* 메인: Embedding + 관계 */}
          <div style={{ padding:'24px 16px' }}>
            <div style={{ marginBottom:36 }}>{sectionEmbedding}</div>
            <div style={{ marginBottom:36 }}>{sectionRelation}</div>
            <div style={{ marginBottom:36 }}>{sectionGrowth}</div>
          </div>

          {/* 바텀 시트 트리거 힌트 */}
          {!bottomSheetOpen && (
            <div
              onClick={()=>setBottomSheetOpen(true)}
              style={{
                position:'fixed', bottom:0, left:0, right:0, zIndex:60,
                background:'linear-gradient(transparent, rgba(8,8,6,0.98))',
                padding:'32px 16px 16px',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                cursor:'pointer',
              }}
            >
              {pending.length > 0 && (
                <div style={{ background:'#FFE500', color:'#000', fontSize:10, fontWeight:700, padding:'5px 14px', marginBottom:4 }}>
                  {pending.length}개 질문 답변하기
                </div>
              )}
              <div style={{ fontSize:10, color:'#444', letterSpacing:'0.2em' }}>▲ 서비스 현황 / 질문</div>
              <div style={{ width:32, height:3, background:'#333', borderRadius:2 }}/>
            </div>
          )}

          {/* 바텀 시트 */}
          {bottomSheetOpen && (
            <div
              style={{
                position:'fixed', inset:0, zIndex:70,
                background:'rgba(0,0,0,0.6)',
              }}
              onClick={()=>setBottomSheetOpen(false)}
            >
              <div
                style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  background:'#0d0d0b', borderTop:'1px solid #2a2a28',
                  borderRadius:'16px 16px 0 0',
                  maxHeight:'85vh', overflowY:'auto',
                  padding:'20px 16px max(48px, env(safe-area-inset-bottom))',
                }}
                onClick={e=>e.stopPropagation()}
              >
                <div style={{ width:36, height:3, background:'#333', borderRadius:2, margin:'0 auto 24px' }}/>
                <div style={{ marginBottom:36 }}>{questionCard}</div>
                <div>{sectionService}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnswerBtn({ label, onClick, accent, muted }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background: accent ? (hov?'#FFE500':'rgba(255,229,0,0.1)') : muted ? 'transparent' : (hov?'rgba(255,255,255,0.08)':'transparent'),
        border: accent ? '1px solid #FFE500' : muted ? '1px solid #333' : '1px solid #444',
        color: accent ? (hov?'#000':'#FFE500') : muted ? '#444' : '#888',
        cursor:'pointer', fontSize:12, fontFamily:"'DM Mono',monospace",
        padding:'9px 18px', transition:'all 0.18s', letterSpacing:'0.06em',
      }}
    >{label}</button>
  )
}
