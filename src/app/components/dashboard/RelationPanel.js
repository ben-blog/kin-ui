'use client'
// 관계 패널 — KIN이 보는 BEN + 마지막 Reflection
import { FONT, YELLOW, BORDER } from '../../constants'
import { SectionTitle, Label } from '../ui'

export default function RelationPanel({ memory, lastReflection, isMobile }) {
  return (
    <section aria-label="KIN과의 관계">
      <SectionTitle num={3} title="우리의 관계" />
      {memory?.user_profile ? (
        <div style={{ marginBottom: 20 }}>
          <Label color={YELLOW}>KIN이 보는 BEN</Label>
          <p
            style={{
              fontSize: isMobile ? 14 : 13,
              color: '#bbb',
              lineHeight: 1.9,
              margin: '10px 0 0',
              fontFamily: FONT,
            }}
          >
            {memory.user_profile.slice(0, 200)}
            {memory.user_profile.length > 200 ? '...' : ''}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#333', fontFamily: FONT, marginBottom: 20 }}>
          아직 없어.
        </p>
      )}
      {lastReflection && (
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
          <Label>마지막 Reflection</Label>
          <p
            style={{
              fontSize: isMobile ? 13 : 12,
              color: '#777',
              lineHeight: 1.8,
              margin: '10px 0 6px',
              fontFamily: FONT,
            }}
          >
            ✓ {lastReflection.what_worked}
          </p>
          <p
            style={{
              fontSize: isMobile ? 13 : 12,
              color: '#444',
              lineHeight: 1.8,
              margin: 0,
              fontFamily: FONT,
            }}
          >
            △ {lastReflection.what_to_improve}
          </p>
          <p style={{ fontSize: 9, color: '#2a2a28', marginTop: 8, fontFamily: FONT }}>
            {new Date(lastReflection.created_at).toLocaleString('ko-KR')}
          </p>
        </div>
      )}
    </section>
  )
}
