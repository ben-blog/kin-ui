'use client'
// src/app/components/WordCloud.js
// 3D 인터랙티브 토픽 클라우드 — Canvas 기반, 추가 패키지 없음
import { useEffect, useRef, useCallback } from 'react'

const FONT = 'DM Mono, monospace'
const YELLOW = [255, 229, 0]
const WHITE = [200, 200, 190]

// Fibonacci 구면 분포 — 단어들을 고르게 배치
function fibonacciSphere(n, radius) {
  const phi = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    return { x: Math.cos(theta) * r * radius, y: y * radius, z: Math.sin(theta) * r * radius }
  })
}

// 단어 공동출현 계산 (experiences content 기반)
function computeCooccurrence(topics, experiences) {
  const cooc = {}
  for (const exp of experiences) {
    const text = (exp.content || '').toLowerCase()
    const present = topics.filter((t) => text.includes(t.word.toLowerCase()))
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const key = [present[i].word, present[j].word].sort().join('§')
        cooc[key] = (cooc[key] || 0) + 1
      }
    }
  }
  return cooc
}

// 3D → 2D 투영
function project3D(x, y, z, rotX, rotY, W, H, zoom = 1, fov = 420) {
  // Y축 회전
  const rx = x * Math.cos(rotY) + z * Math.sin(rotY)
  const rz = -x * Math.sin(rotY) + z * Math.cos(rotY)
  // X축 회전
  const ry = y * Math.cos(rotX) - rz * Math.sin(rotX)
  const fz = y * Math.sin(rotX) + rz * Math.cos(rotX)
  const scale = (fov / (fov + fz + 150)) * zoom
  return { px: W / 2 + rx * scale, py: H / 2 + ry * scale, scale, fz }
}

export default function WordCloud3D({ topics = [], experiences = [], onTopicClick }) {
  const canvasRef = useRef(null)
  const state = useRef({
    rotX: 0.25,
    rotY: 0.4,
    dragging: false,
    lastX: 0,
    lastY: 0,
    dragDist: 0,
    zoom: 1.0,
    pinchDist: 0,
    nodes: [],
    edges: [],
    animFrame: null,
    W: 600,
    H: 340,
    dpr: 1,
  })

  // 노드 & 엣지 계산
  useEffect(() => {
    if (!topics.length) return
    const s = state.current
    const radius = Math.min(s.W, s.H) * 0.38
    const pos = fibonacciSphere(topics.length, radius)

    s.nodes = topics.map((t, i) => ({
      ...t,
      ...pos[i],
      fs: Math.max(10, Math.min(30, 8 + t.count * 1.8)),
    }))

    const cooc = computeCooccurrence(topics, experiences)
    const maxStrength = Math.max(1, ...Object.values(cooc))
    s.edges = Object.entries(cooc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([key, strength]) => {
        const [wa, wb] = key.split('§')
        const ai = s.nodes.findIndex((n) => n.word === wa)
        const bi = s.nodes.findIndex((n) => n.word === wb)
        if (ai < 0 || bi < 0) return null
        return { ai, bi, strength, ratio: strength / maxStrength }
      })
      .filter(Boolean)
  }, [topics, experiences])

  // 캔버스 크기 설정
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = state.current
    s.dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      s.W = rect.width
      s.H = rect.height || 360
      canvas.width = s.W * s.dpr
      canvas.height = s.H * s.dpr
      canvas.style.width = s.W + 'px'
      canvas.style.height = s.H + 'px'
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  // 렌더 루프
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = state.current
    const ctx = canvas.getContext('2d')
    const { W, H, dpr, nodes, edges } = s

    // 천천히 자동 회전 (드래그 중이 아닐 때)
    if (!s.dragging) s.rotY += 0.0015

    ctx.clearRect(0, 0, W * dpr, H * dpr)

    if (!nodes.length) return

    // 투영
    const proj = nodes.map((n) => ({
      ...n,
      ...project3D(n.x, n.y, n.z, s.rotX, s.rotY, W, H, s.zoom),
    }))

    // ── 연결선 그리기 ───────────────────────────────────────
    for (const e of edges) {
      const a = proj[e.ai],
        b = proj[e.bi]
      if (!a || !b) continue

      const avgFz = (a.fz + b.fz) / 2
      const depthFade = Math.max(0, 0.7 - avgFz / 600)
      const alpha = depthFade * e.ratio * 0.8
      if (alpha < 0.02) continue

      // 색상: salience 높은 연결은 노란색, 낮은 건 회색-파랑
      const avgSal = (a.salience + b.salience) / 2
      const lineColor =
        avgSal >= 0.65 ? `rgba(255,229,0,${alpha})` : `rgba(100,140,180,${alpha * 0.8})`

      ctx.beginPath()
      ctx.moveTo(a.px * dpr, a.py * dpr)
      ctx.lineTo(b.px * dpr, b.py * dpr)
      ctx.strokeStyle = lineColor
      ctx.lineWidth = (0.4 + e.ratio * 2.2) * dpr
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // ── 단어 그리기 (depth order — 뒤에서 앞으로) ──────────
    const sorted = [...proj].sort((a, b) => a.fz - b.fz)

    for (const n of sorted) {
      const depthFade = Math.max(0.12, 1 - n.fz / 500)
      const fs = n.fs * n.scale

      ctx.font = `400 ${fs * dpr}px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const [r, g, b] = n.salience >= 0.65 ? YELLOW : WHITE
      ctx.fillStyle = `rgba(${r},${g},${b},${depthFade})`
      ctx.fillText(n.word, n.px * dpr, n.py * dpr)
    }

    s.animFrame = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    state.current.animFrame = requestAnimationFrame(draw)
    return () => {
      if (state.current.animFrame) cancelAnimationFrame(state.current.animFrame)
    }
  }, [draw])

  // ── 휠/트랙패드 핀치 — passive:false로 직접 등록 ─────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const s = state.current
        const delta = e.deltaY > 0 ? 0.95 : 1.05
        s.zoom = Math.max(0.3, Math.min(3.0, s.zoom * delta))
      }
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [])

  // ── 마우스 이벤트 ───────────────────────────────────────────
  const onMouseDown = (e) => {
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.dragDist = 0
  }
  const onMouseMove = (e) => {
    const s = state.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX,
      dy = e.clientY - s.lastY
    s.rotY += dx * 0.007
    s.rotX += dy * 0.007
    s.rotX = Math.max(-1.3, Math.min(1.3, s.rotX))
    s.dragDist += Math.hypot(dx, dy)
    s.lastX = e.clientX
    s.lastY = e.clientY
  }
  const onMouseUp = () => {
    state.current.dragging = false
  }

  // ── 터치 이벤트 ─────────────────────────────────────────────
  const onTouchStart = (e) => {
    const s = state.current
    if (e.touches.length === 2) {
      // 2-finger pinch 시작
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      s.pinchDist = Math.hypot(dx, dy)
      s.dragging = false
    } else {
      const t = e.touches[0]
      s.dragging = true
      s.lastX = t.clientX
      s.lastY = t.clientY
      s.dragDist = 0
    }
  }
  const onTouchMove = (e) => {
    e.preventDefault()
    const s = state.current
    if (e.touches.length === 2) {
      // 2-finger pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      if (s.pinchDist > 0) {
        const ratio = dist / s.pinchDist
        s.zoom = Math.max(0.3, Math.min(3.0, s.zoom * ratio))
      }
      s.pinchDist = dist
    } else if (s.dragging) {
      const t = e.touches[0]
      const dx = t.clientX - s.lastX,
        dy = t.clientY - s.lastY
      s.rotY += dx * 0.007
      s.rotX += dy * 0.007
      s.rotX = Math.max(-1.3, Math.min(1.3, s.rotX))
      s.dragDist += Math.hypot(dx, dy)
      s.lastX = t.clientX
      s.lastY = t.clientY
    }
  }
  const onTouchEnd = () => {
    const s = state.current
    s.dragging = false
    s.pinchDist = 0
  }

  // ── 클릭 히트테스트 ─────────────────────────────────────────
  const onClick = (e) => {
    const s = state.current
    const canvas = canvasRef.current
    if (!canvas || !onTopicClick) return
    if (s.dragDist > 5) {
      s.dragDist = 0
      return
    } // 드래그 후 클릭 무시
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { W, H, nodes } = s

    let best = null,
      bestDist = 36
    for (const n of nodes) {
      const { px, py } = project3D(n.x, n.y, n.z, s.rotX, s.rotY, W, H, s.zoom)
      const d = Math.hypot(px - mx, py - my)
      if (d < bestDist) {
        bestDist = d
        best = n
      }
    }
    if (best) onTopicClick(best)
  }

  return (
    <div style={{ width: '100%', height: 360, position: 'relative', cursor: 'grab' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 12,
          fontSize: 9,
          color: '#2a2a28',
          fontFamily: "'DM Mono',monospace",
          letterSpacing: '0.15em',
          pointerEvents: 'none',
        }}
      >
        drag to rotate
      </div>
    </div>
  )
}
