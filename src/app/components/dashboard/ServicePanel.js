'use client'
// 서비스 현황 패널 — 서비스별 이벤트 통계 + Reflection 트리거
import { useMemo } from 'react'
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Num, Bar, Label } from '../ui'

export default function ServicePanel({ svcStats, serviceRunning, onRunReflection, isMobile }) {
  const unprocessed = useMemo(
    () => Object.values(svcStats || {}).reduce((a, s) => a + (s.unprocessed || 0), 0),
    [svcStats]
  )

  return (
    <section aria-label="서비스 현황">
      <SectionTitle
        num={5}
        title="서비스 현황"
        action={
          <button
            onClick={onRunReflection}
            disabled={serviceRunning || unprocessed === 0}
            aria-label={
              serviceRunning
                ? '리플렉션 처리 중'
                : unprocessed === 0
                  ? '처리할 이벤트 없음'
                  : `${unprocessed}개 미처리 이벤트 리플렉션 실행`
            }
            style={{
              background: 'transparent',
              border: `1px solid ${serviceRunning || unprocessed === 0 ? '#1c1c1a' : '#333'}`,
              color: serviceRunning || unprocessed === 0 ? '#2a2a28' : '#666',
              cursor: serviceRunning || unprocessed === 0 ? 'default' : 'pointer',
              fontSize: 9,
              fontFamily: FONT,
              padding: '6px 12px',
              letterSpacing: '0.08em',
              transition: 'all 0.2s',
            }}
          >
            {serviceRunning
              ? '처리 중...'
              : unprocessed === 0
                ? '미처리 없음'
                : `Reflection (${unprocessed})`}
          </button>
        }
      />
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        {Object.entries(svcStats || {}).map(([svc, stat]) => (
          <div
            key={svc}
            style={{
              flex: 1,
              padding: '20px',
              background: '#070705',
              border: `1px solid ${BORDER}`,
              borderRadius: isMobile ? 8 : 0,
            }}
          >
            <Label color={YELLOW}>{svc}</Label>
            <div style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
              <Num label="총" value={stat.total} color="#fff" size={22} />
              <Num label="처리됨" value={stat.processed} color="#5a8" size={22} />
              <Num
                label="미처리"
                value={stat.unprocessed}
                color={stat.unprocessed > 0 ? '#a55' : '#2a2a28'}
                size={22}
              />
            </div>
            {Object.entries(stat.byType)
              .slice(0, 4)
              .map(([t, c]) => (
                <Bar
                  key={t}
                  label={t.replace('scenario_', '').replace('image_', '')}
                  value={c}
                  max={stat.total}
                  color="#3a3a36"
                />
              ))}
          </div>
        ))}
      </div>
    </section>
  )
}
