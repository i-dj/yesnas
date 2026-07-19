'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { eventsUrl, openAuthenticatedSse, type ServerEvent } from '@/lib/api/sse'

export type SseStatus = 'idle' | 'connecting' | 'ready' | 'error'

type UseSseOptions<T> = {
  enabled?: boolean
  interval?: number
  storageId?: string
  reducer?: (current: T | null, next: T) => T
  onMessage?: (data: T) => void
}

type UseSseResult<T> = {
  data: T | null
  status: SseStatus
  error: Event | Error | null
  reconnect: () => void
}

export function useSse<T>(
  topics: string | string[] | null,
  {
    enabled = true,
    interval = 2,
    storageId,
    reducer,
    onMessage,
  }: UseSseOptions<T> = {},
): UseSseResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<SseStatus>('idle')
  const [error, setError] = useState<Event | Error | null>(null)
  const [version, setVersion] = useState(0)
  const callbacksRef = useRef({ reducer, onMessage })
  const topicsKey = Array.isArray(topics) ? topics.join('\u0000') : topics

  useEffect(() => {
    callbacksRef.current = { reducer, onMessage }
  }, [reducer, onMessage])

  const reconnect = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!topicsKey || !enabled) {
      setStatus('idle')
      setError(null)
      return
    }

    const subscribedTopics = topicsKey.split('\u0000')
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let closed = false
    setStatus('connecting')
    setError(null)

    const handleReady = () => {
      setStatus('ready')
    }

    const handleMessage = (raw: string) => {
      try {
        const event = JSON.parse(raw) as ServerEvent<T>
        if (!subscribedTopics.includes(event.type)) return
        const next = event.data
        setData((current) => callbacksRef.current.reducer?.(current, next) ?? next)
        setStatus('ready')
        setError(null)
        callbacksRef.current.onMessage?.(next)
      } catch (nextError) {
        setStatus('error')
        setError(nextError instanceof Error ? nextError : new Error('Failed to parse SSE message'))
      }
    }

    const source = openAuthenticatedSse(eventsUrl(subscribedTopics, { interval, storageId }), {
      onOpen: handleReady,
      onEvent: (_eventName, raw) => {
        const event = JSON.parse(raw) as ServerEvent
        if (event.type === 'ready') handleReady()
        else if (event.type === 'error') throw new Error('SSE event error')
        else if (event.type !== 'heartbeat') handleMessage(raw)
      },
      onError: (nextError) => {
        setStatus('error')
        setError(nextError)
        if (!closed && nextError.message !== 'Unauthorized') reconnectTimer = setTimeout(reconnect, 2000)
      },
      onClose: () => {
        if (!closed) reconnectTimer = setTimeout(reconnect, 2000)
      },
    })

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      source.close()
    }
  }, [enabled, interval, reconnect, storageId, topicsKey, version])

  return { data, status, error, reconnect }
}
