'use client'
// src/app/page.js — 대시보드 v5
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

const FONT = "'DM Mono', monospace"
const YELLOW = '#FFE500'
const BG = '#080806'
const BORDER = '#1c1c1a'

function detectQuestionType(text) {
  if (!text) return 'free'
  if (/해도 되는지|알려도 되는지|좋을지|여부|괜찮|맞는지/.test(text)) return 'yesno'
  if (/검토|연결|고려|추가|진행|필요/.test(text)) return 'review'
  return 'free'
}

function Label({ children, color='#3a3a38', style={} }) {
  return <span style={{ fontSize:9, letterSpacing:'0.28em', textTransform:'uppercase', color, fontFamily:FONT, ...style }}>{children}</span>
}

function SectionTitle({ num, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, paddingBottom:12, borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <span style={{ fontSize:9, color:'#2e2e2c', fontFamily:FONT, letterSpacing:'0.15em' }}>{String(num).padStart(2,'0')}</span>
        <span style={{ fontSize:15, color:YELLOW, fontFamily:FONT, letterSpacing:'0.05em' }}>{title}</span>
      </div>
      {action}
    </div>
  )
}

function Num({ value, label, color=YELLOW, size=36 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <span style={{ fontSize:size, fontWeight:700, color, fontFamily:FONT, lineHeight:1 }}>{value}</span>
      <Label color="#3a3a38">{label}</Label>
    </div>
  )
}

function Bar({ label, value, max, color=YELLOW }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <span style={{ width:88, fontSize:11, color:'#555', fontFamily:FONT, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'#181816' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, transition:'width 1s ease' }}/>
      </div>
      <span style={{ width:20, fontSize:10, color:'#444', fontFamily:FONT, textAlign:'right' }}>{value}</span>
    </div>
  )
}

function SmartBtn({ label, onClick, variant='default' }) {
  const [hov, setHov] = useState(false)
  const styles = {
    primary: { bg: hov?YELLOW:'rgba(255,229,0,0.08)', border:`1px solid ${YELLOW}`, color: hov?'#000':YELLOW },
    default: { bg: hov?'rgba(255,255,255,0.05)':'transparent', border:'1px solid #2a2a28', color: hov?'#aaa':'#666' },
    muted:   { bg: 'transparent', border:'1px solid #1c1c1a', color: hov?'#666':'#333' },
  }
  const s = styles[variant]
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:s.bg, border:s.border, color:s.color, cursor:'pointer', fontSize:11,
        fontFamily:FONT, padding:'9px 16px', transition:'all 0.15s', letterSpacing:'0.08em' }}>
      {label}
    </button>
  )
}

// 모바일 전체화면 모달
function MobileModal({ open, onClose, children }) {
  const [visible, setVisible] = useState(open)
  const timerRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      clearTimeout(timerRef.current)
      setVisible(true)
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 420)
    }
    return () => {
      clearTimeout(timerRef.current)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!visible && !open) return null

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      pointerEvents: open ? 'auto' : 'none',
    }}>
      {/* 배경 */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0,
        background: open ? 'rgba(0,0,0,0.7)' : 'transparent',
        transition:'background 0.3s ease',
      }}/>
      {/* 패널 */}
      <div
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
        style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'#0b0b09',
        borderTop:`1px solid #252523`,
        borderRadius:'20px 20px 0 0',
        maxHeight:'92vh',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition:'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
        display:'flex', flexDirection:'column',
        overscrollBehavior:'contain',
      }}>
        {/* 핸들 */}
        <div style={{ padding:'14px 0 0', display:'flex', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:36, height:3, background:'#2a2a28', borderRadius:2 }}/>
        </div>
        {/* 닫기 */}
        <button onClick={onClose} style={{
          position:'absolute', top:12, right:16,
          background:'transparent', border:'none', color:'#444',
          cursor:'pointer', fontSize:20, fontFamily:FONT, lineHeight:1,
          padding:'4px 8px',
        }}>×</button>
        {/* 콘텐츠 */}
        <div style={{ flex:1, overflowY:'auto', padding:`20px 20px max(32px, env(safe-area-inset-bottom))` }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// 모바일 질문 카드 (스와이프)
function QuestionCards({ pending, qStats, setQStats, onAnswer, submitting }) {
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
  }, [pending.length])

  const currentQ = pending[idx]
  const qType = detectQuestionType(currentQ?.request_to_ben)
  const total = pending.length

  const handleTouchStart = e => { startX.current = e.touches[0].clientX; dragging.current = true }
  const handleTouchMove  = e => { if (dragging.current) setDragX(e.touches[0].clientX - startX.current) }
  const handleTouchEnd   = () => {
    dragging.current = false
    if (dragX < -60 && idx < total - 1) setIdx(i => i + 1)
    if (dragX >  60 && idx > 0)         setIdx(i => i - 1)
    setDragX(0)
  }

  async function doAnswer(answer, skip=false) {
    await onAnswer(currentQ.id, answer, skip)
    setQStats(p => skip ? {...p, skipped:p.skipped+1} : {...p, answered:p.answered+1})
    if (idx < total - 1) setIdx(i => i + 1)
    else setIdx(Math.max(0, idx - 1))
  }

  if (!currentQ) return (
    <div style={{ padding:'60px 0', textAlign:'center' }}>
      <p style={{ fontSize:14, color:'#444', fontFamily:FONT }}>미답변 요청 없어.</p>
    </div>
  )

  return (
    <div>
      {/* 카운터 */}
      <div style={{ display:'flex', gap:20, marginBottom:24, justifyContent:'center' }}>
        <span style={{ fontSize:12, fontFamily:FONT, color:'#666' }}>남음&nbsp;<span style={{ color:YELLOW }}>{total}</span></span>
        <span style={{ fontSize:12, fontFamily:FONT, color:'#555' }}>답변&nbsp;<span style={{ color:'#5a8' }}>{qStats.answered}</span></span>
        <span style={{ fontSize:12, fontFamily:FONT, color:'#444' }}>스킵&nbsp;<span style={{ color:'#555' }}>{qStats.skipped}</span></span>
      </div>

      {/* 카드 */}
      <div style={{ position:'relative', overflow:'hidden', marginBottom:24 }}>
        {/* 뒤 카드 힌트 */}
        {idx < total - 1 && (
          <div style={{
            position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', height:'100%',
            background:'#0f0f0d', borderRadius:12, border:`1px solid #1a1a18`,
          }}/>
        )}
        {/* 현재 카드 */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position:'relative', zIndex:1,
            background:'#111110', borderRadius:12, border:`1px solid #252523`,
            padding:'28px 24px',
            transform: dragging.current ? `translateX(${dragX}px) rotate(${dragX*0.02}deg)` : 'translateX(0)',
            transition: dragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
            userSelect:'none',
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <Label color={YELLOW}>질문 {idx+1}/{total}</Label>
            <div style={{ display:'flex', gap:6 }}>
              {Array.from({length:Math.min(total,5)}).map((_,i)=>(
                <div key={i} onClick={()=>setIdx(i)} style={{
                  width:6, height:6, borderRadius:'50%',
                  background: i===idx ? YELLOW : '#2a2a28',
                  cursor:'pointer', transition:'background 0.2s',
                }}/>
              ))}
            </div>
          </div>
          <p style={{ fontSize:16, color:'#d8d8d0', lineHeight:1.85, margin:'0 0 28px', fontFamily:FONT }}>
            {currentQ.request_to_ben}
          </p>

          {/* 스마트 답변 */}
          {/* 숏컷 버튼 (해당되는 경우만) */}
          {(qType === 'yesno' || qType === 'review') && (
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              {qType === 'yesno' && <>
                <button onClick={()=>doAnswer('예')} style={{ flex:1, background:YELLOW, border:'none', color:'#000', cursor:'pointer', fontSize:13, fontFamily:FONT, padding:'13px', borderRadius:8, fontWeight:700 }}>예</button>
                <button onClick={()=>doAnswer('아니오')} style={{ flex:1, background:'#1a1a18', border:`1px solid #2a2a28`, color:'#aaa', cursor:'pointer', fontSize:13, fontFamily:FONT, padding:'13px', borderRadius:8 }}>아니오</button>
              </>}
              {qType === 'review' && <>
                <button onClick={()=>doAnswer('진행하자')} style={{ flex:1, background:YELLOW, border:'none', color:'#000', cursor:'pointer', fontSize:13, fontFamily:FONT, padding:'13px', borderRadius:8, fontWeight:700 }}>진행하자</button>
                <button onClick={()=>doAnswer('나중에')} style={{ flex:1, background:'#1a1a18', border:`1px solid #2a2a28`, color:'#aaa', cursor:'pointer', fontSize:13, fontFamily:FONT, padding:'13px', borderRadius:8 }}>나중에</button>
              </>}
            </div>
          )}
          {/* 자유 입력 - 항상 표시 */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <textarea value={answers[currentQ.id]||''} onChange={e=>setAnswers(p=>({...p,[currentQ.id]:e.target.value}))}
              placeholder={qType==='free' ? '답해줘.' : '또는 직접 써줘.'}
              rows={3}
              style={{ background:'#080806', border:`1px solid #2a2a28`, borderRadius:8,
                color:'#d8d8d0', fontSize:15, padding:'14px', resize:'none',
                fontFamily:FONT, lineHeight:1.6, outline:'none', width:'100%' }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>doAnswer(answers[currentQ.id])} disabled={!answers[currentQ.id]?.trim()||submitting[currentQ.id]}
                style={{ flex:1, background:answers[currentQ.id]?.trim()?YELLOW:'#1a1a18',
                  border:'none', color:answers[currentQ.id]?.trim()?'#000':'#444',
                  cursor:'pointer', fontSize:13, fontFamily:FONT, padding:'14px', borderRadius:8, fontWeight:700,
                  opacity:submitting[currentQ.id]?0.5:1 }}>
                {submitting[currentQ.id]?'...':'전달'}
              </button>
              <button onClick={()=>doAnswer(null,true)}
                style={{ width:80, background:'transparent', border:`1px solid #444`, color:'#777',
                  cursor:'pointer', fontSize:11, fontFamily:FONT, padding:'14px 0', borderRadius:8 }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 스와이프 힌트 */}
      {total > 1 && (
        <p style={{ textAlign:'center', fontSize:10, color:'#2a2a28', fontFamily:FONT, letterSpacing:'0.15em' }}>
          ← 스와이프로 이동 →
        </p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [qIndex,  setQIndex]  = useState(0)
  const [qStats,  setQStats]  = useState({ answered:0, skipped:0 })
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [serviceRunning, setServiceRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showService,   setShowService]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 960)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetch(`${KIN_API}/api/kin/dashboard`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setQIndex(0) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function doAnswer(id, answer, skip=false) {
    setSubmitting(p=>({...p,[id]:true}))
    try {
      await fetch(`${KIN_API}/api/kin/answer-request/${id}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(skip ? {skip:true} : {answer}),
      })
      setQStats(p => skip ? {...p, skipped:p.skipped+1} : {...p, answered:p.answered+1})
      load()
    } finally { setSubmitting(p=>({...p,[id]:false})) }
  }

  async function runReflection() {
    setServiceRunning(true)
    try {
      await fetch(`${KIN_API}/api/kin/service-reflection`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({limit:50}),
      })
      load()
    } finally { setServiceRunning(false) }
  }

  const mood       = data?.mood || 'default'
  const pending    = data?.pendingRequests || []
  const topics     = data?.topics || []
  const knowledge  = data?.knowledgeByCategory || {}
  const memory     = data?.memory || {}
  const svcStats   = data?.serviceStats || {}
  const expBySrc   = data?.expBySource || {}
  const totalKnow  = Object.values(knowledge).reduce((a,b)=>a+b,0)
  const unprocessed= Object.values(svcStats).reduce((a,s)=>a+(s.unprocessed||0),0)
  const currentQ   = pending[qIndex]
  const qType      = detectQuestionType(currentQ?.request_to_ben)

  const topicExps = selectedTopic
    ? (data?.recentExperiences||[]).filter(e=>e.content?.toLowerCase().includes(selectedTopic.word.toLowerCase()))
    : []

  // ── 공통 패널들 ─────────────────────────────────────────────
  const QPanel = (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <SectionTitle num={2} title="KIN이 묻는 것들" />
      {pending.length === 0 ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <p style={{ fontSize:13, color:'#333', fontFamily:FONT }}>미답변 요청 없음</p>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', gap:20, marginBottom:20 }}>
            <span style={{ fontSize:11, fontFamily:FONT, color:'#555' }}>남음&nbsp;<span style={{ color:YELLOW }}>{pending.length}</span></span>
            <span style={{ fontSize:11, fontFamily:FONT, color:'#444' }}>답변&nbsp;<span style={{ color:'#5a8' }}>{qStats.answered}</span></span>
            <span style={{ fontSize:11, fontFamily:FONT, color:'#333' }}>스킵&nbsp;<span style={{ color:'#555' }}>{qStats.skipped}</span></span>
          </div>
          {currentQ && (
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ flex:1, borderLeft:`2px solid ${YELLOW}`, paddingLeft:16, marginBottom:20 }}>
                <p style={{ fontSize:14, color:'#d8d8d0', lineHeight:1.9, margin:0, fontFamily:FONT }}>{currentQ.request_to_ben}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                {/* 숏컷 버튼 - 해당 유형일 때만 */}
                {(qType === 'yesno' || qType === 'review') && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {qType === 'yesno' && <>
                      <SmartBtn label="예" onClick={()=>doAnswer(currentQ.id,'예')} variant="primary" />
                      <SmartBtn label="아니오" onClick={()=>doAnswer(currentQ.id,'아니오')} />
                    </>}
                    {qType === 'review' && <>
                      <SmartBtn label="진행하자" onClick={()=>doAnswer(currentQ.id,'진행하자')} variant="primary" />
                      <SmartBtn label="나중에" onClick={()=>doAnswer(currentQ.id,'나중에')} />
                    </>}
                  </div>
                )}
                {/* 자유 입력 - 항상 표시 */}
                <div style={{ display:'flex', gap:6 }}>
                  <textarea value={answers[currentQ.id]||''} onChange={e=>setAnswers(p=>({...p,[currentQ.id]:e.target.value}))}
                    placeholder={qType==='free' ? '답해줘.' : '또는 직접 써줘.'}
                    rows={2}
                    style={{ flex:1, background:'#080806', border:`1px solid #252523`, color:'#d8d8d0',
                      fontSize:13, padding:'10px 12px', resize:'none', fontFamily:FONT, lineHeight:1.6, outline:'none' }}/>
                  <button onClick={()=>doAnswer(currentQ.id,answers[currentQ.id])}
                    disabled={submitting[currentQ.id]||!answers[currentQ.id]?.trim()}
                    style={{
                      background: answers[currentQ.id]?.trim() ? YELLOW : 'transparent',
                      border: `1px solid ${answers[currentQ.id]?.trim() ? YELLOW : '#333'}`,
                      color: answers[currentQ.id]?.trim() ? '#000' : '#444',
                      cursor: answers[currentQ.id]?.trim() ? 'pointer' : 'default',
                      fontSize:11, fontFamily:FONT, padding:'0 14px',
                      transition:'all 0.15s', opacity:submitting[currentQ.id]?0.4:1 }}>
                    {submitting[currentQ.id]?'...':'전달'}
                  </button>
                </div>
                <button onClick={()=>doAnswer(currentQ.id,null,true)}
                  style={{ background:'transparent', border:'1px solid #444', color:'#777',
                    cursor:'pointer', fontSize:11, fontFamily:FONT, padding:'8px 16px',
                    letterSpacing:'0.1em', transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.target.style.borderColor='#888';e.target.style.color='#aaa'}}
                  onMouseLeave={e=>{e.target.style.borderColor='#444';e.target.style.color='#777'}}>
                  Skip
                </button>
              </div>
              {pending.length > 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:8, borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>
                  <button onClick={()=>setQIndex(i=>Math.max(0,i-1))} disabled={qIndex===0}
                    style={{ background:'transparent', border:`1px solid ${qIndex===0?'#1a1a18':'#2a2a28'}`, color:qIndex===0?'#222':'#666', cursor:qIndex===0?'default':'pointer', padding:'6px 14px', fontFamily:FONT, fontSize:13 }}>←</button>
                  <span style={{ flex:1, textAlign:'center', fontSize:10, color:'#444', fontFamily:FONT, letterSpacing:'0.15em' }}>{qIndex+1} / {pending.length}</span>
                  <button onClick={()=>setQIndex(i=>Math.min(pending.length-1,i+1))} disabled={qIndex===pending.length-1}
                    style={{ background:'transparent', border:`1px solid ${qIndex===pending.length-1?'#1a1a18':'#2a2a28'}`, color:qIndex===pending.length-1?'#222':'#666', cursor:qIndex===pending.length-1?'default':'pointer', padding:'6px 14px', fontFamily:FONT, fontSize:13 }}>→</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const EmbeddingPanel = (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <SectionTitle num={1} title="Embedding Space" />
      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:11, color:'#2a2a28', fontFamily:FONT, letterSpacing:'0.2em' }}>loading</span>
        </div>
      ) : (
        <div style={{ flex:1 }}>
          <WordCloud topics={topics} experiences={data?.recentExperiences||[]} onTopicClick={t=>setSelectedTopic(selectedTopic?.word===t.word?null:t)} />
        </div>
      )}
      {selectedTopic && (
        <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:14, marginTop:8 }}>
          <Label color={YELLOW}>"{selectedTopic.word}" 관련 {topicExps.length}개</Label>
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
            {topicExps.length===0
              ? <p style={{ fontSize:12, color:'#333', fontFamily:FONT }}>최근 경험 없음</p>
              : topicExps.slice(0,2).map((e,i)=>(
                <div key={i} style={{ padding:'10px 12px', background:'#070705', borderLeft:`1px solid #252523` }}>
                  <p style={{ fontSize:10, color:'#444', margin:'0 0 5px', fontFamily:FONT }}>{e.source} · {new Date(e.created_at).toLocaleDateString('ko-KR')}</p>
                  <p style={{ fontSize:13, color:'#888', margin:0, lineHeight:1.7, fontFamily:FONT }}>{e.content.slice(0,120)}...</p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )

  const RelationPanel = (
    <div>
      <SectionTitle num={3} title="우리의 관계" />
      {memory.user_profile ? (
        <div style={{ marginBottom:20 }}>
          <Label color={YELLOW}>KIN이 보는 BEN</Label>
          <p style={{ fontSize:isMobile?14:13, color:'#bbb', lineHeight:1.9, margin:'10px 0 0', fontFamily:FONT }}>
            {memory.user_profile.slice(0,200)}{memory.user_profile.length>200?'...':''}
          </p>
        </div>
      ) : <p style={{ fontSize:13, color:'#333', fontFamily:FONT, marginBottom:20 }}>아직 없어.</p>}
      {data?.lastReflection && (
        <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:16 }}>
          <Label>마지막 Reflection</Label>
          <p style={{ fontSize:isMobile?13:12, color:'#777', lineHeight:1.8, margin:'10px 0 6px', fontFamily:FONT }}>✓ {data.lastReflection.what_worked}</p>
          <p style={{ fontSize:isMobile?13:12, color:'#444', lineHeight:1.8, margin:0, fontFamily:FONT }}>△ {data.lastReflection.what_to_improve}</p>
          <p style={{ fontSize:9, color:'#2a2a28', marginTop:8, fontFamily:FONT }}>{new Date(data.lastReflection.created_at).toLocaleString('ko-KR')}</p>
        </div>
      )}
    </div>
  )

  const GrowthPanel = (
    <div>
      <SectionTitle num={4} title="KIN의 성장" />
      <div style={{ display:'flex', gap:28, marginBottom:28, flexWrap:'wrap' }}>
        <Num label="총 경험" value={data?.experienceCount||0} color={YELLOW} size={isMobile?32:36} />
        <Num label="Knowledge" value={data?.knowledgeCount||0} color="#fff" size={isMobile?32:36} />
        <Num label="메모리 레이어" value={Object.values(memory).filter(Boolean).length} color="#555" size={isMobile?32:36} />
      </div>
      <div style={{ marginBottom:10 }}><Label>Experience 소스</Label></div>
      <div style={{ marginBottom:20 }}>
        {Object.entries(expBySrc).map(([src,cnt])=>(
          <Bar key={src} label={src.replace('service:','')} value={cnt} max={Math.max(1,...Object.values(expBySrc))} color={YELLOW} />
        ))}
      </div>
      <div style={{ marginBottom:10 }}><Label>Knowledge 카테고리</Label></div>
      <div>
        {Object.entries(knowledge).map(([cat,cnt])=>(
          <Bar key={cat} label={cat} value={cnt} max={Math.max(1,totalKnow)} color="#444" />
        ))}
      </div>
    </div>
  )

  const ServiceContent = (
    <div>
      <SectionTitle num={5} title="서비스 현황"
        action={
          <button onClick={runReflection} disabled={serviceRunning||unprocessed===0}
            style={{ background:'transparent', border:`1px solid ${serviceRunning||unprocessed===0?'#1c1c1a':'#333'}`,
              color:serviceRunning||unprocessed===0?'#2a2a28':'#666', cursor:serviceRunning||unprocessed===0?'default':'pointer',
              fontSize:9, fontFamily:FONT, padding:'6px 12px', letterSpacing:'0.08em', transition:'all 0.2s' }}>
            {serviceRunning?'처리 중...':unprocessed===0?'미처리 없음':`Reflection (${unprocessed})`}
          </button>
        }
      />
      <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:2 }}>
        {Object.entries(svcStats).map(([svc,stat])=>(
          <div key={svc} style={{ flex:1, padding:'20px', background:'#070705', border:`1px solid ${BORDER}`, borderRadius: isMobile ? 8 : 0 }}>
            <Label color={YELLOW}>{svc}</Label>
            <div style={{ display:'flex', gap:20, margin:'14px 0' }}>
              <Num label="총" value={stat.total} color="#fff" size={22} />
              <Num label="처리됨" value={stat.processed} color="#5a8" size={22} />
              <Num label="미처리" value={stat.unprocessed} color={stat.unprocessed>0?'#a55':'#2a2a28'} size={22} />
            </div>
            {Object.entries(stat.byType).slice(0,4).map(([t,c])=>(
              <Bar key={t} label={t.replace('scenario_','').replace('image_','')} value={c} max={stat.total} color="#3a3a36" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ background:BG, minHeight:'100vh', color:'#fff', fontFamily:FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea{outline:none;}
        button{font-family:'DM Mono',monospace;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:#222;}
      `}</style>

      {/* HEADER */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(8,8,6,0.96)', borderBottom:`1px solid ${BORDER}`,
        backdropFilter:'blur(12px)',
        display:'flex', alignItems:'center', gap:10,
        padding: isMobile?'10px 14px':'12px 32px',
      }}>
        <div style={{ position:'relative', width:isMobile?40:48, height:isMobile?40:48, flexShrink:0 }}>
          <Image src={MOOD_IMAGE[mood]} alt="KIN" fill style={{ objectFit:'contain', transition:'all 0.4s' }} priority />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, letterSpacing:'0.3em', color:YELLOW, marginBottom:2 }}>KIN</div>
          <div style={{ fontSize:10, color:'#3a3a38', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {loading?'—':`경험 ${data?.experienceCount||0} · knowledge ${data?.knowledgeCount||0}`}
          </div>
        </div>

        {/* 모바일 전용 버튼들 */}
        {isMobile && (
          <>
            <button onClick={()=>setShowQuestions(true)} style={{
              background: pending.length > 0 ? YELLOW : 'transparent',
              border: pending.length > 0 ? 'none' : `1px solid #2a2a28`,
              color: pending.length > 0 ? '#000' : '#444',
              cursor:'pointer', fontSize:10, fontFamily:FONT,
              padding:'7px 10px', letterSpacing:'0.06em', flexShrink:0,
              borderRadius:6, fontWeight: pending.length > 0 ? 700 : 400,
            }}>
              {pending.length > 0 ? `질문 ${pending.length}` : '질문'}
            </button>
            <button onClick={()=>setShowService(true)} style={{
              background:'transparent', border:`1px solid #2a2a28`,
              color:'#555', cursor:'pointer', fontSize:10, fontFamily:FONT,
              padding:'7px 10px', letterSpacing:'0.06em', flexShrink:0, borderRadius:6,
            }}>서비스</button>
          </>
        )}

        <button onClick={()=>router.push('/chat')} style={{
          background:'transparent', border:`1px solid ${YELLOW}`, color:YELLOW,
          cursor:'pointer', fontSize:isMobile?10:11, fontFamily:FONT,
          padding:isMobile?'7px 10px':'8px 20px', letterSpacing:'0.08em', transition:'all 0.2s',
          flexShrink:0, borderRadius: isMobile ? 6 : 0,
        }}>말 걸기 →</button>
      </header>

      {/* PC */}
      {!isMobile ? (
        <main style={{ maxWidth:1440, margin:'0 auto', padding:'0 32px 48px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'58% 42%', borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ padding:'36px 32px 36px 0', borderRight:`1px solid ${BORDER}`, minHeight:520 }}>{EmbeddingPanel}</div>
            <div style={{ padding:'36px 0 36px 32px', minHeight:520 }}>{QPanel}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
            <div style={{ padding:'32px 28px 40px 0', borderRight:`1px solid ${BORDER}` }}>{RelationPanel}</div>
            <div style={{ padding:'32px 28px 40px', borderRight:`1px solid ${BORDER}` }}>{GrowthPanel}</div>
            <div style={{ padding:'32px 0 40px 28px' }}>{ServiceContent}</div>
          </div>
        </main>
      ) : (
        /* MOBILE */
        <div style={{ padding:'20px 16px 40px' }}>
          <div style={{ marginBottom:36 }}>{EmbeddingPanel}</div>
          <div style={{ marginBottom:36 }}>{RelationPanel}</div>
          <div>{GrowthPanel}</div>
        </div>
      )}

      {/* 모바일 질문 모달 */}
      <MobileModal open={showQuestions} onClose={()=>setShowQuestions(false)}>
        <div style={{ marginBottom:8 }}>
          <span style={{ fontSize:18, color:YELLOW, fontFamily:FONT, letterSpacing:'0.04em' }}>KIN이 묻는 것들</span>
        </div>
        <div style={{ height:1, background:BORDER, margin:'16px 0 24px' }}/>
        <QuestionCards pending={pending} qStats={qStats} setQStats={setQStats} onAnswer={doAnswer} submitting={submitting} />
      </MobileModal>

      {/* 모바일 서비스 모달 */}
      <MobileModal open={showService} onClose={()=>setShowService(false)}>
        {ServiceContent}
      </MobileModal>
    </div>
  )
}
