'use client'

import { eventsUrl, openAuthenticatedSse, type ServerEvent, type SseConnection } from '@/lib/api/sse'
import { toast } from '@/store/use-toast-store'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BenchmarkStage, BenchmarkViewState } from '../components/storage-pool-benchmark'

export type BenchmarkSizeGiB = 1 | 5 | 10 | 20 | 50

const createInitialBenchmarkState = (): BenchmarkViewState => ({
  running: false,
  stage: 'idle',
  sizeGiB: 5,
  percent: 0,
  totalBytes: 0,
  completedBytes: 0,
  remainingBytes: 0,
  elapsedSeconds: 0,
  currentSpeedBytesPerSec: 0,
  writeSpeedBytesPerSec: 0,
  readSpeedBytesPerSec: 0,
  error: null,
})

interface BenchmarkCompletedPayload {
  writeSpeedBytesPerSec?: number
  readSpeedBytesPerSec?: number
  writeSpeedHuman?: string
  readSpeedHuman?: string
}

interface UseStorageBenchmarkOptions {
  onCompleted?: (poolId: string, payload: BenchmarkCompletedPayload) => void
}

export function useStorageBenchmark(options?: UseStorageBenchmarkOptions) {
  const [benchmarkByPoolId, setBenchmarkByPoolId] = useState<Record<string, BenchmarkViewState>>({})
  const streams = useMemo(() => new Map<string, SseConnection>(), [])

  const ensurePoolState = useCallback((poolId: string) => {
    setBenchmarkByPoolId((prev) => ({
      ...prev,
      [poolId]: prev[poolId] ?? createInitialBenchmarkState(),
    }))
  }, [])

  const closeStream = useCallback(
    (poolId: string) => {
      const stream = streams.get(poolId)
      if (!stream) return
      stream.close()
      streams.delete(poolId)
    },
    [streams],
  )

  const setBenchmarkState = useCallback(
    (poolId: string, updater: (current: BenchmarkViewState) => Partial<BenchmarkViewState>) => {
      setBenchmarkByPoolId((prev) => {
        const current = prev[poolId] ?? createInitialBenchmarkState()
        return {
          ...prev,
          [poolId]: {
            ...current,
            ...updater(current),
          },
        }
      })
    },
    [],
  )

  const setSize = useCallback(
    (poolId: string, sizeGiB: BenchmarkSizeGiB) => {
      setBenchmarkState(poolId, () => ({ sizeGiB }))
    },
    [setBenchmarkState],
  )

  const stop = useCallback(
    (poolId: string, error: string | null = 'Benchmark stopped') => {
      closeStream(poolId)
      setBenchmarkState(poolId, () => ({
        running: false,
        error,
      }))
    },
    [closeStream, setBenchmarkState],
  )

  const start = useCallback(
    (poolId: string) => {
      const current = benchmarkByPoolId[poolId] ?? createInitialBenchmarkState()
      closeStream(poolId)
      setBenchmarkState(poolId, () => ({
        running: true,
        stage: 'ready',
        percent: 0,
        totalBytes: 0,
        completedBytes: 0,
        remainingBytes: 0,
        currentSpeedBytesPerSec: 0,
        elapsedSeconds: 0,
        readSpeedBytesPerSec: 0,
        writeSpeedBytesPerSec: 0,
        error: null,
      }))

      const streamUrl = eventsUrl('storage.benchmark', { poolId, sizeGiB: current.sizeGiB })
      let finalized = false
      const source = openAuthenticatedSse(streamUrl, {
        onEvent: (_eventName, raw) => {
          const event = JSON.parse(raw) as ServerEvent

          if (event.type === 'storage.benchmark.progress') {
            const data = event.data as {
              stage?: BenchmarkStage
              totalBytes?: number
              completedBytes?: number
              remainingBytes?: number
              percent?: number
              currentSpeedBytesPerSec?: number
              elapsedSeconds?: number
            }
            setBenchmarkState(poolId, () => ({
              running: true,
              stage: data.stage || 'ready',
              totalBytes: data.totalBytes ?? 0,
              completedBytes: data.completedBytes ?? 0,
              remainingBytes: data.remainingBytes ?? 0,
              percent: data.percent ?? 0,
              currentSpeedBytesPerSec: data.currentSpeedBytesPerSec ?? 0,
              elapsedSeconds: data.elapsedSeconds ?? 0,
            }))
          } else if (event.type === 'storage.benchmark.completed') {
            finalized = true
            const data = event.data as BenchmarkCompletedPayload
            setBenchmarkState(poolId, () => ({
              running: false,
              stage: 'completed',
              percent: 100,
              readSpeedBytesPerSec: data.readSpeedBytesPerSec ?? 0,
              writeSpeedBytesPerSec: data.writeSpeedBytesPerSec ?? 0,
              error: null,
            }))
            closeStream(poolId)
            options?.onCompleted?.(poolId, data)
          } else if (event.type === 'error') {
            finalized = true
            closeStream(poolId)
            const data = event.data as { code?: string; message?: string }
            const reason = data.message || data.code || 'Benchmark request failed'
            toast.error(data.code && data.message ? `${data.message}: ${data.code}` : reason, 5000)
            setBenchmarkState(poolId, () => ({ running: false, stage: 'failed', error: reason }))
          }
        },
        onError: (error) => {
          if (finalized || error.message === 'Unauthorized') return
          setBenchmarkState(poolId, () => ({ running: true, error: 'Benchmark stream reconnecting...' }))
        },
      })
      streams.set(poolId, source)
    },
    [benchmarkByPoolId, closeStream, options, setBenchmarkState, streams],
  )

  useEffect(() => {
    return () => {
      streams.forEach((stream) => stream.close())
      streams.clear()
    }
  }, [streams])

  return {
    benchmarkByPoolId,
    ensurePoolState,
    createInitialBenchmarkState,
    setSize,
    start,
    stop,
    closeStream,
  }
}
