'use client'
// 대시보드 데이터 fetch + 캐싱 훅
import { useState, useCallback, useEffect, useRef } from 'react'
import { KIN_API } from '../constants'

/** 대시보드 데이터를 가져오고, 답변 후에는 캐시된 데이터와 머지하는 훅 */
export default function useDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const cacheRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${KIN_API}/api/kin/dashboard`)
      const d = await res.json()
      cacheRef.current = d
      setData(d)
    } catch (err) {
      console.error('[Dashboard] 데이터 로딩 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 답변 후 경량 리프레시: 전체 데이터를 가져오되 로딩 스피너 없이 */
  const softRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${KIN_API}/api/kin/dashboard`)
      const d = await res.json()
      cacheRef.current = d
      setData(d)
    } catch (err) {
      console.error('[Dashboard] 소프트 리프레시 실패:', err)
    }
  }, [])

  /** 질문에 답변/스킵 */
  const submitAnswer = useCallback(
    async (id, answer, skip = false) => {
      await fetch(`${KIN_API}/api/kin/answer-request/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skip ? { skip: true } : { answer }),
      })
      // 캐시에서 해당 질문을 즉시 제거 (옵티미스틱 업데이트)
      if (cacheRef.current) {
        const updated = {
          ...cacheRef.current,
          pendingRequests: (cacheRef.current.pendingRequests || []).filter((r) => r.id !== id),
        }
        cacheRef.current = updated
        setData(updated)
      }
      // 백그라운드에서 전체 데이터 동기화
      softRefresh()
    },
    [softRefresh]
  )

  /** 서비스 리플렉션 실행 */
  const runReflection = useCallback(async () => {
    await fetch(`${KIN_API}/api/kin/service-reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 50 }),
    })
    await softRefresh()
  }, [softRefresh])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, load, submitAnswer, runReflection }
}
