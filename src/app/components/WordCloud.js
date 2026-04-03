'use client'
// src/app/components/WordCloud.js
// D3 force simulation 기반 인터랙티브 토픽 클라우드
// ssr: false 로만 import 해야 함

import { useEffect, useRef, useState } from 'react'

export default function WordCloud({ topics = [], onTopicClick }) {
  const svgRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    if (!topics.length || !svgRef.current) return

    let d3
    import('d3').then(mod => {
      d3 = mod

      const el = svgRef.current
      const W  = el.clientWidth  || 600
      const H  = el.clientHeight || 340

      d3.select(el).selectAll('*').remove()

      const maxCount = Math.max(...topics.map(t => t.count))
      const fontSize = d3.scaleLinear().domain([1, maxCount]).range([11, 36])
      const opacity  = d3.scaleLinear().domain([0, 1]).range([0.4, 1])

      const nodes = topics.map((t, i) => ({
        ...t,
        id: i,
        fs: fontSize(t.count),
        x: W / 2 + (Math.random() - 0.5) * 200,
        y: H / 2 + (Math.random() - 0.5) * 100,
      }))

      const svg = d3.select(el)

      const sim = d3.forceSimulation(nodes)
        .force('center', d3.forceCenter(W / 2, H / 2).strength(0.08))
        .force('charge', d3.forceManyBody().strength(-20))
        .force('collision', d3.forceCollide(d => d.fs * 0.9 + 6))
        .alphaDecay(0.03)

      const texts = svg.selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text(d => d.word)
        .attr('font-size', d => d.fs)
        .attr('font-family', "'DM Mono', monospace")
        .attr('fill', d => d.salience >= 0.7 ? '#FFE500' : '#fff')
        .attr('opacity', d => opacity(d.salience))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('cursor', 'pointer')
        .style('user-select', 'none')
        .style('transition', 'opacity 0.2s')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('fill', '#FFE500').attr('opacity', 1)
          setHovered(d)
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .attr('fill', d.salience >= 0.7 ? '#FFE500' : '#fff')
            .attr('opacity', opacity(d.salience))
          setHovered(null)
        })
        .on('click', (event, d) => onTopicClick && onTopicClick(d))
        .call(d3.drag()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
        )

      sim.on('tick', () => {
        texts
          .attr('x', d => Math.max(d.fs, Math.min(W - d.fs, d.x)))
          .attr('y', d => Math.max(d.fs, Math.min(H - d.fs, d.y)))
      })

      return () => sim.stop()
    })
  }, [topics])

  return (
    <div style={{ position: 'relative', width: '100%', height: 340 }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 8, left: 12,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: '#FFE500', opacity: 0.8,
          pointerEvents: 'none',
        }}>
          {hovered.word} · 등장 {hovered.count}회 · salience {hovered.salience.toFixed(2)}
        </div>
      )}
    </div>
  )
}
