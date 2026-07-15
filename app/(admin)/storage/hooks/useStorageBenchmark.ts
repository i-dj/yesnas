'use client'

import { storageApi } from '@/lib/api/storage.api'
import { openAuthenticatedSse, type SseConnection } from '@/lib/api/sse'
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

const parseBenchmarkError = (raw: string) => {
  if (!raw) return { message: '', code: '' }
  try {
    const parsed = JSON.parse(raw) as {
      code?: string
      message?: string
      error?: string
    }
    return {
      message: parsed.message || parsed.error || '',
      code: parsed.code || '',
    }
  } catch {
    return { message: raw, code: '' }
  }
}

const resolveBenchmarkError = async (poolId: string, sizeGiB: BenchmarkSizeGiB, raw: string) => {
  const parsed = parseBenchmarkError(raw)
  if (parsed.message || parsed.code) return parsed

  try {
    await storageApi.probeBenchmark(poolId, sizeGiB)
    return { message: '', code: '' }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Benchmark request failed',
      code: '',
    }
  }
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

      const streamUrl = storageApi.benchmarkStreamUrl(poolId, current.sizeGiB)
      const source = openAuthenticatedSse(streamUrl, {
        onEvent: (eventName, raw) => {
          if (eventName === 'ready') {
            const data = JSON.parse(raw) as { sizeGiB?: number }
            setBenchmarkState(poolId, (state) => ({
              running: true,
              stage: 'ready',
              sizeGiB: (data.sizeGiB as BenchmarkSizeGiB) || state.sizeGiB,
            }))
          } else if (eventName === 'progress') {
            const data = JSON.parse(raw) as {
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
          } else if (eventName === 'completed') {
            finalized = true
            const data = JSON.parse(raw) as BenchmarkCompletedPayload
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
          } else if (eventName === 'error') {
            finalized = true
            closeStream(poolId)
            void resolveBenchmarkError(poolId, current.sizeGiB, raw).then(({ message, code }) => {
              const reason = message || code || 'Benchmark request failed'
              toast.error(code ? `${reason}: ${code}` : reason, 5000)
              setBenchmarkState(poolId, () => ({ running: false, stage: 'failed', error: message || null }))
            })
          }
        },
        onError: (error) => {
          if (finalized || error.message === 'Unauthorized') return
          setBenchmarkState(poolId, () => ({ running: true, error: 'Benchmark stream reconnecting...' }))
        },
      })
      streams.set(poolId, source)
      let finalized = false
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
