'use client'
// 채팅 입력 영역 — 텍스트 입력 + 이미지 첨부 + 전송
import { useRef, useCallback } from 'react'
import { FONT, IMAGE_MAX_SIZE_MB, IMAGE_MAX_PX, IMAGE_QUALITY } from '../../constants'

export default function ChatInput({
  input,
  setInput,
  pendingImage,
  setPendingImage,
  onSend,
  loading,
}) {
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const canSend = !!(input.trim() || pendingImage) && !loading

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  /** 이미지 선택 핸들러 — 유효성 검증 + 클라이언트 리사이즈 */
  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    // 파일 크기 검증
    if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      alert(`이미지 크기가 ${IMAGE_MAX_SIZE_MB}MB를 초과해. 더 작은 이미지를 선택해줘.`)
      e.target.value = ''
      return
    }

    // 이미지 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 첨부할 수 있어.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      alert('이미지를 읽는 중 오류가 발생했어.')
    }
    reader.onload = (ev) => {
      const img = new window.Image()
      img.onerror = () => {
        alert('이미지 파일이 손상되었거나 지원하지 않는 형식이야.')
      }
      img.onload = () => {
        // canvas로 리사이즈 + 압축
        let w = img.width,
          h = img.height
        if (w > IMAGE_MAX_PX || h > IMAGE_MAX_PX) {
          if (w > h) {
            h = Math.round((h * IMAGE_MAX_PX) / w)
            w = IMAGE_MAX_PX
          } else {
            w = Math.round((w * IMAGE_MAX_PX) / h)
            h = IMAGE_MAX_PX
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
        setPendingImage({
          dataUrl,
          mediaType: 'image/jpeg',
          name: file.name,
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleKey(e) {
    if (e.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div
      role="form"
      aria-label="메시지 입력"
      style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid #141412',
        background: 'rgba(8,8,6,0.99)',
        padding: '10px 14px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
        aria-hidden="true"
      />

      {/* 이미지 첨부 버튼 */}
      <button
        className="attach-btn"
        onClick={() => fileInputRef.current?.click()}
        aria-label="이미지 첨부"
        style={{
          background: 'transparent',
          border: 'none',
          color: pendingImage ? '#FFE500' : '#3a3a38',
          cursor: 'pointer',
          fontSize: '18px',
          minWidth: 40,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
      >
        ⊕
      </button>

      {/* 텍스트 입력 */}
      <textarea
        ref={(el) => {
          inputRef.current = el
          textareaRef.current = el
        }}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          autoResize()
        }}
        onKeyDown={handleKey}
        placeholder="말해."
        rows={1}
        aria-label="메시지 입력"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #202020',
          color: '#d8d8d0',
          fontSize: '15px',
          padding: '8px 0',
          outline: 'none',
          resize: 'none',
          fontFamily: FONT,
          lineHeight: '1.7',
          minHeight: 36,
          maxHeight: 120,
          caretColor: '#FFE500',
        }}
      />

      {/* 전송 버튼 */}
      <button
        className="send-btn"
        onClick={onSend}
        disabled={!canSend}
        aria-label="메시지 전송"
        style={{
          background: 'transparent',
          border: 'none',
          color: canSend ? '#888' : '#2a2a28',
          cursor: canSend ? 'pointer' : 'default',
          fontSize: '20px',
          minWidth: 40,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
      >
        →
      </button>
    </div>
  )
}
