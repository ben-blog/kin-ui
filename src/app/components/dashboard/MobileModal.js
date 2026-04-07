'use client'
// 모바일 전체화면 바텀시트 모달
import { useState, useEffect, useRef } from 'react'
import { FONT } from '../../constants'

export default function MobileModal({ open, onClose, children }) {
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
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        aria-label="모달 닫기"
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        style={{
          position: 'absolute',
          inset: 0,
          background: open ? 'rgba(0,0,0,0.7)' : 'transparent',
          transition: 'background 0.3s ease',
        }}
      />
      {/* 패널 */}
      <div
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#0b0b09',
          borderTop: '1px solid #252523',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92vh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
          display: 'flex',
          flexDirection: 'column',
          overscrollBehavior: 'contain',
        }}
      >
        {/* 드래그 핸들 */}
        <div
          style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}
        >
          <div style={{ width: 36, height: 3, background: '#2a2a28', borderRadius: 2 }} />
        </div>
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#444',
            cursor: 'pointer',
            fontSize: 20,
            fontFamily: FONT,
            lineHeight: 1,
            padding: '4px 8px',
          }}
        >
          ×
        </button>
        {/* 콘텐츠 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 20px max(32px, env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
