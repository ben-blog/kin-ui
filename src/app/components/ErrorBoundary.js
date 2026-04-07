'use client'
// 에러 바운더리 — 하위 컴포넌트 런타임 에러 격리
import { Component } from 'react'
import { FONT, YELLOW } from '../constants'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '24px 20px',
            background: '#0a0a08',
            border: '1px solid #2a1a1a',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: '#a55', fontFamily: FONT, marginBottom: 12 }}>
            {this.props.fallbackMessage || '이 영역에서 오류가 발생했어.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'transparent',
              border: `1px solid ${YELLOW}`,
              color: YELLOW,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: FONT,
              padding: '8px 20px',
              letterSpacing: '0.08em',
            }}
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
