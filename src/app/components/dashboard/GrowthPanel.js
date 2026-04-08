'use client'
// 성장 패널 — 경험/지식 수치 + 소스별 바 차트
import { useMemo } from 'react'
import { YELLOW } from '../../constants'
import { SectionTitle, Num, Bar, Label } from '../ui'

export default function GrowthPanel({ data, memory, isMobile }) {
  const expBySrc = data?.expBySource || {}
  const knowledge = data?.knowledgeByCategory || {}

  const totalKnow = useMemo(() => Object.values(knowledge).reduce((a, b) => a + b, 0), [knowledge])
  const maxExpSrc = useMemo(() => Math.max(1, ...Object.values(expBySrc)), [expBySrc])
  const memoryLayerCount = useMemo(
    () => Object.values(memory || {}).filter(Boolean).length,
    [memory]
  )

  return (
    <section aria-label="KIN 성장 지표">
      <SectionTitle num={4} title="KIN의 성장" />
      <div style={{ display: 'flex', gap: 28, marginBottom: 28, flexWrap: 'wrap' }}>
        <Num
          label="총 경험"
          value={data?.experienceCount || 0}
          color={YELLOW}
          size={isMobile ? 32 : 36}
        />
        <Num
          label="확실한 기억"
          value={data?.crystallizedMemoryCount || 0}
          color={YELLOW}
          size={isMobile ? 32 : 36}
        />
        <Num
          label="Knowledge"
          value={data?.knowledgeCount || 0}
          color="#fff"
          size={isMobile ? 32 : 36}
        />
        <Num
          label="메모리 레이어"
          value={memoryLayerCount}
          color="#555"
          size={isMobile ? 32 : 36}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <Label>Experience 소스</Label>
      </div>
      <div style={{ marginBottom: 20 }}>
        {Object.entries(expBySrc).map(([src, cnt]) => (
          <Bar
            key={src}
            label={src.replace('service:', '')}
            value={cnt}
            max={maxExpSrc}
            color={YELLOW}
          />
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <Label>Knowledge 카테고리</Label>
      </div>
      <div>
        {Object.entries(knowledge).map(([cat, cnt]) => (
          <Bar key={cat} label={cat} value={cnt} max={Math.max(1, totalKnow)} color="#444" />
        ))}
      </div>
    </section>
  )
}
