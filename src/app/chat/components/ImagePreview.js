'use client'
// 이미지 첨부 미리보기 바

export default function ImagePreview({ pendingImage, onRemove }) {
  if (!pendingImage) return null

  return (
    <div
      role="status"
      aria-label={`첨부된 이미지: ${pendingImage.name}`}
      style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid #1a1a18',
        background: '#0a0a08',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <img
        src={pendingImage.dataUrl}
        alt="첨부 미리보기"
        style={{
          width: 48,
          height: 48,
          objectFit: 'cover',
          border: '1px solid #252523',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '10px',
          color: '#444',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {pendingImage.name}
      </span>
      <button
        onClick={onRemove}
        aria-label="첨부 이미지 제거"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#444',
          cursor: 'pointer',
          fontSize: '18px',
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  )
}
