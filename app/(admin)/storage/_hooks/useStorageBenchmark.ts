'use client'

import { getStoragePoolBenchmarkStreamUrl } from '@/lib/file-api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  BenchmarkViewState,
  BenchmarkStage,
} from '../_components/StoragePoolBenchmark'

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
  const [benchmarkByPoolId, setBenchmarkByPoolId] = useState<
    Record<string, BenchmarkViewState>
  >({})
  const streams = useMemo(() => new Map<string, EventSource>(), [])

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
    (
      poolId: string,
      updater: (current: BenchmarkViewState) => Partial<BenchmarkViewState>,
    ) => {
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

      const streamUrl = getStoragePoolBenchmarkStreamUrl(
        poolId,
        current.sizeGiB,
      )
      const source = new EventSource(streamUrl)
      streams.set(poolId, source)
      let finalized = false

      source.addEventListener('ready', (event) => {
        const data = JSON.parse((event as MessageEvent).data) as {
          sizeGiB?: number
        }
        setBenchmarkState(poolId, (state) => ({
          running: true,
          stage: 'ready',
          sizeGiB: (data.sizeGiB as BenchmarkSizeGiB) || state.sizeGiB,
        }))
      })

      source.addEventListener('progress', (event) => {
        const data = JSON.parse((event as MessageEvent).data) as {
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
      })

      source.addEventListener('completed', (event) => {
        finalized = true
        const data = JSON.parse((event as MessageEvent).data) as {
          writeSpeedBytesPerSec?: number
          readSpeedBytesPerSec?: number
          writeSpeedHuman?: string
          readSpeedHuman?: string
        }
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
      })

      source.addEventListener('error', (event) => {
        finalized = true
        const messageEvent = event as MessageEvent
        let parsed: { message?: string; error?: string; code?: string } | null =
          null
        let raw = ''
        try {
          if (typeof messageEvent.data === 'string') raw = messageEvent.data
          parsed = raw
            ? (JSON.parse(raw) as {
                message?: string
                error?: string
                code?: string
              })
            : null
        } catch {
          parsed = null
        }
        const reason =
          parsed?.message ||
          parsed?.error ||
          parsed?.code ||
          raw ||
          'Benchmark failed'
        setBenchmarkState(poolId, () => ({
          running: false,
          stage: 'failed',
          error: reason,
        }))
        closeStream(poolId)
      })

      source.onerror = () => {
        if (finalized) return
        setBenchmarkState(poolId, () => ({
          running: true,
          error: 'Benchmark stream reconnecting...',
        }))
      }
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
