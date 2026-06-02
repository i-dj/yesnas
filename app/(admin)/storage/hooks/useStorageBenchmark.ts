'use client'

import { getStoragePoolBenchmarkStreamUrl } from '@/lib/file-api'
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

const resolveBenchmarkError = async (streamUrl: string, raw: string) => {
  const parsed = parseBenchmarkError(raw)
  if (parsed.message || parsed.code) return parsed

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(streamUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const text = await res.text()
    const fromBody = parseBenchmarkError(text)
    return {
      message: fromBody.message || fromBody.code || (res.ok ? '' : `Benchmark request failed (${res.status})`),
      code: fromBody.code,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { message: 'Benchmark request timed out', code: '' }
    }
    return {
      message: error instanceof Error ? error.message : 'Benchmark request failed',
      code: '',
    }
  } finally {
    window.clearTimeout(timeout)
  }
}

export function useStorageBenchmark(options?: UseStorageBenchmarkOptions) {
  const [benchmarkByPoolId, setBenchmarkByPoolId] = useState<Record<string, BenchmarkViewState>>({})
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

      const streamUrl = getStoragePoolBenchmarkStreamUrl(poolId, current.sizeGiB)
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
        let raw = ''
        if (typeof messageEvent.data === 'string') raw = messageEvent.data
        closeStream(poolId)

        void resolveBenchmarkError(streamUrl, raw).then(({ message, code }) => {
          const reason = message || code || 'Benchmark request failed'
          toast.error(code ? `${reason}: ${code}` : reason, 5000)
          setBenchmarkState(poolId, () => ({
            running: false,
            stage: 'failed',
            error: message || null,
          }))
        })
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
