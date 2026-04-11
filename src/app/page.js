'use client'
// src/app/page.js — 대시보드 v6 (컴포넌트 분리 + 캐싱 + 접근성)
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FONT, YELLOW, BG, BORDER, MOOD_IMAGE } from './constants'
import useDashboard from './hooks/useDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import EmbeddingPanel from './components/dashboard/EmbeddingPanel'
import QuestionPanel from './components/dashboard/QuestionPanel'
import QuestionCards from './components/dashboard/QuestionCards'
import RelationPanel from './components/dashboard/RelationPanel'
import GrowthPanel from './components/dashboard/GrowthPanel'
import ServicePanel from './components/dashboard/ServicePanel'
import DiaryPanel from './components/dashboard/DiaryPanel'
import KnowledgePanel from './components/dashboard/KnowledgePanel'
import WebLearningPanel from './components/dashboard/WebLearningPanel'
import MobileModal from './components/dashboard/MobileModal'

export default function DashboardPage() {
  const router = useRouter()
  const { data, loading, submitAnswer, runReflection } = useDashboard()

  const [submitting, setSubmitting] = useState({})
  const [qStats, setQStats] = useState({ answered: 0, skipped: 0 })
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [serviceRunning, setServiceRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showService, setShowService] = useState(false)

  // 반응형 감지
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 960)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 파생 데이터 메모이제이션
  const mood = data?.mood || 'default'
  const pending = useMemo(() => data?.pendingRequests || [], [data?.pendingRequests])
  const topics = useMemo(() => data?.topics || [], [data?.topics])
  const experiences = useMemo(() => data?.recentExperiences || [], [data?.recentExperiences])
  const memory = useMemo(() => data?.memory || {}, [data?.memory])
  const svcStats = useMemo(() => data?.serviceStats || {}, [data?.serviceStats])
  const diary = useMemo(() => data?.diary || [], [data?.diary])
  const knowledgeDetails = useMemo(() => data?.knowledgeDetails || [], [data?.knowledgeDetails])
  const webLearning = useMemo(() => data?.webLearning || {}, [data?.webLearning])

  // 질문 답변 핸들러
  const handleAnswer = useCallback(
    async (id, answer, skip = false) => {
      setSubmitting((p) => ({ ...p, [id]: true }))
      try {
        await submitAnswer(id, answer, skip)
        setQStats((p) =>
          skip ? { ...p, skipped: p.skipped + 1 } : { ...p, answered: p.answered + 1 }
        )
      } finally {
        setSubmitting((p) => ({ ...p, [id]: false }))
      }
    },
    [submitAnswer]
  )

  // 리플렉션 실행 핸들러
  const handleReflection = useCallback(async () => {
    setServiceRunning(true)
    try {
      await runReflection()
    } finally {
      setServiceRunning(false)
    }
  }, [runReflection])

  // 토픽 클릭 핸들러
  const handleTopicClick = useCallback(
    (t) => setSelectedTopic((prev) => (prev?.word === t.word ? null : t)),
    []
  )

  // 헤더 요약 텍스트 메모이제이션
  const headerSummary = useMemo(
    () =>
      loading ? '—' : `경험 ${data?.experienceCount || 0} · knowledge ${data?.knowledgeCount || 0}`,
    [loading, data?.experienceCount, data?.knowledgeCount]
  )

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea{outline:none;}
        button{font-family:'DM Mono',monospace;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:#222;}
      `}</style>

      {/* 헤더 */}
      <header
        role="banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8,8,6,0.96)',
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: isMobile ? '10px 14px' : '12px 32px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            flexShrink: 0,
          }}
        >
          <Image
            src={MOOD_IMAGE[mood]}
            alt={`KIN 현재 상태`}
            fill
            style={{ objectFit: 'contain', transition: 'all 0.4s' }}
            priority
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: YELLOW, marginBottom: 2 }}>
            KIN
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#3a3a38',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {headerSummary}
          </div>
        </div>

        {/* 모바일 전용 버튼들 */}
        {isMobile && (
          <>
            <button
              onClick={() => setShowQuestions(true)}
              aria-label={`질문 ${pending.length}개 보기`}
              style={{
                background: pending.length > 0 ? YELLOW : 'transparent',
                border: pending.length > 0 ? 'none' : '1px solid #2a2a28',
                color: pending.length > 0 ? '#000' : '#444',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: FONT,
                padding: '7px 10px',
                letterSpacing: '0.06em',
                flexShrink: 0,
                borderRadius: 6,
                fontWeight: pending.length > 0 ? 700 : 400,
              }}
            >
              {pending.length > 0 ? `질문 ${pending.length}` : '질문'}
            </button>
            <button
              onClick={() => setShowService(true)}
              aria-label="서비스 현황 보기"
              style={{
                background: 'transparent',
                border: '1px solid #2a2a28',
                color: '#555',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: FONT,
                padding: '7px 10px',
                letterSpacing: '0.06em',
                flexShrink: 0,
                borderRadius: 6,
              }}
            >
              서비스
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/chat')}
          aria-label="KIN과 대화하기"
          style={{
            background: 'transparent',
            border: `1px solid ${YELLOW}`,
            color: YELLOW,
            cursor: 'pointer',
            fontSize: isMobile ? 10 : 11,
            fontFamily: FONT,
            padding: isMobile ? '7px 10px' : '8px 20px',
            letterSpacing: '0.08em',
            transition: 'all 0.2s',
            flexShrink: 0,
            borderRadius: isMobile ? 6 : 0,
          }}
        >
          말 걸기 →
        </button>
      </header>

      {/* PC 레이아웃 */}
      {!isMobile ? (
        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px 48px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '58% 42%',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                padding: '36px 32px 36px 0',
                borderRight: `1px solid ${BORDER}`,
                minHeight: 520,
              }}
            >
              <ErrorBoundary name="EmbeddingPanel" fallbackMessage="임베딩 영역에 문제가 생겼어.">
                <EmbeddingPanel
                  topics={topics}
                  experiences={experiences}
                  loading={loading}
                  selectedTopic={selectedTopic}
                  onTopicClick={handleTopicClick}
                />
              </ErrorBoundary>
            </div>
            <div style={{ padding: '36px 0 36px 32px', minHeight: 520 }}>
              <ErrorBoundary name="QuestionPanel" fallbackMessage="질문 영역에 문제가 생겼어.">
                <QuestionPanel
                  pending={pending}
                  qStats={qStats}
                  onAnswer={handleAnswer}
                  submitting={submitting}
                />
              </ErrorBoundary>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style={{ padding: '32px 28px 40px 0', borderRight: `1px solid ${BORDER}` }}>
              <ErrorBoundary name="RelationPanel" fallbackMessage="관계 영역에 문제가 생겼어.">
                <RelationPanel
                  memory={memory}
                  lastReflection={data?.lastReflection}
                  isMobile={false}
                />
              </ErrorBoundary>
            </div>
            <div style={{ padding: '32px 28px 40px', borderRight: `1px solid ${BORDER}` }}>
              <ErrorBoundary name="GrowthPanel" fallbackMessage="성장 영역에 문제가 생겼어.">
                <GrowthPanel data={data} memory={memory} isMobile={false} />
              </ErrorBoundary>
            </div>
            <div style={{ padding: '32px 0 40px 28px' }}>
              <ErrorBoundary name="ServicePanel" fallbackMessage="서비스 영역에 문제가 생겼어.">
                <ServicePanel
                  svcStats={svcStats}
                  serviceRunning={serviceRunning}
                  onRunReflection={handleReflection}
                  isMobile={false}
                />
              </ErrorBoundary>
            </div>
          </div>
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
            }}
          >
            <div style={{ padding: '32px 28px 48px 0', borderRight: `1px solid ${BORDER}` }}>
              <ErrorBoundary name="KnowledgePanel" fallbackMessage="지식 영역에 문제가 생겼어.">
                <KnowledgePanel
                  knowledgeDetails={knowledgeDetails}
                  archivedCount={data?.archivedCount || 0}
                  isMobile={false}
                />
              </ErrorBoundary>
            </div>
            <div style={{ padding: '32px 28px 48px', borderRight: `1px solid ${BORDER}` }}>
              <ErrorBoundary name="DiaryPanel" fallbackMessage="일기 영역에 문제가 생겼어.">
                <DiaryPanel
                  diary={diary}
                  crystallizedCount={data?.crystallizedMemoryCount || 0}
                  isMobile={false}
                />
              </ErrorBoundary>
            </div>
            <div style={{ padding: '32px 0 48px 28px' }}>
              <ErrorBoundary
                name="WebLearningPanel"
                fallbackMessage="Web Learning 영역에 문제가 생겼어."
              >
                <WebLearningPanel webLearning={webLearning} isMobile={false} />
              </ErrorBoundary>
            </div>
          </div>
        </main>
      ) : (
        /* 모바일 레이아웃 */
        <main style={{ padding: '20px 16px 40px' }}>
          <div style={{ marginBottom: 36 }}>
            <ErrorBoundary name="EmbeddingPanel" fallbackMessage="임베딩 영역에 문제가 생겼어.">
              <EmbeddingPanel
                topics={topics}
                experiences={experiences}
                loading={loading}
                selectedTopic={selectedTopic}
                onTopicClick={handleTopicClick}
              />
            </ErrorBoundary>
          </div>
          <div style={{ marginBottom: 36 }}>
            <ErrorBoundary name="RelationPanel" fallbackMessage="관계 영역에 문제가 생겼어.">
              <RelationPanel
                memory={memory}
                lastReflection={data?.lastReflection}
                isMobile={true}
              />
            </ErrorBoundary>
          </div>
          <div style={{ marginBottom: 36 }}>
            <ErrorBoundary name="GrowthPanel" fallbackMessage="성장 영역에 문제가 생겼어.">
              <GrowthPanel data={data} memory={memory} isMobile={true} />
            </ErrorBoundary>
          </div>
          <div style={{ marginBottom: 36 }}>
            <ErrorBoundary name="KnowledgePanel" fallbackMessage="지식 영역에 문제가 생겼어.">
              <KnowledgePanel
                knowledgeDetails={knowledgeDetails}
                archivedCount={data?.archivedCount || 0}
                isMobile={true}
              />
            </ErrorBoundary>
          </div>
          <div style={{ marginBottom: 36 }}>
            <ErrorBoundary name="DiaryPanel" fallbackMessage="일기 영역에 문제가 생겼어.">
              <DiaryPanel
                diary={diary}
                crystallizedCount={data?.crystallizedMemoryCount || 0}
                isMobile={true}
              />
            </ErrorBoundary>
          </div>
          <div>
            <ErrorBoundary
              name="WebLearningPanel"
              fallbackMessage="Web Learning 영역에 문제가 생겼어."
            >
              <WebLearningPanel webLearning={webLearning} isMobile={true} />
            </ErrorBoundary>
          </div>
        </main>
      )}

      {/* 모바일 질문 모달 */}
      <MobileModal open={showQuestions} onClose={() => setShowQuestions(false)}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 18, color: YELLOW, fontFamily: FONT, letterSpacing: '0.04em' }}>
            KIN이 묻는 것들
          </span>
        </div>
        <div style={{ height: 1, background: BORDER, margin: '16px 0 24px' }} />
        <QuestionCards
          pending={pending}
          qStats={qStats}
          setQStats={setQStats}
          onAnswer={handleAnswer}
          submitting={submitting}
        />
      </MobileModal>

      {/* 모바일 서비스 모달 */}
      <MobileModal open={showService} onClose={() => setShowService(false)}>
        <ServicePanel
          svcStats={svcStats}
          serviceRunning={serviceRunning}
          onRunReflection={handleReflection}
          isMobile={true}
        />
      </MobileModal>
    </div>
  )
}
