'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { openAuthenticatedSse } from '@/lib/api/sse'

export type SseStatus = 'idle' | 'connecting' | 'ready' | 'error'

type UseSseOptions<T> = {
  enabled?: boolean
  event?: string
  events?: string[]
  readyEvents?: string[]
  listenToMessage?: boolean
  parser?: (raw: string) => T
  reducer?: (current: T | null, next: T) => T
  onMessage?: (data: T) => void
}

type UseSseResult<T> = {
  data: T | null
  status: SseStatus
  error: Event | Error | null
  reconnect: () => void
}

const parseJson = <T>(raw: string) => JSON.parse(raw) as T

export function useSse<T>(
  url: string | null,
  {
    enabled = true,
    event,
    events = [],
    readyEvents = ['ready'],
    listenToMessage = false,
    parser = parseJson,
    reducer,
    onMessage,
  }: UseSseOptions<T> = {},
): UseSseResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<SseStatus>('idle')
  const [error, setError] = useState<Event | Error | null>(null)
  const [version, setVersion] = useState(0)
  const callbacksRef = useRef({ parser, reducer, onMessage })
  const eventsKey = (event ? [event, ...events] : events).join('\u0000')
  const readyEventsKey = readyEvents.join('\u0000')

  useEffect(() => {
    callbacksRef.current = { parser, reducer, onMessage }
  }, [parser, reducer, onMessage])

  const reconnect = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!url || !enabled) {
      setStatus('idle')
      setError(null)
      return
    }

    const dataEvents = eventsKey ? eventsKey.split('\u0000') : []
    const connectionEvents = readyEventsKey ? readyEventsKey.split('\u0000') : []
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let closed = false
    setStatus('connecting')
    setError(null)

    const handleReady = () => {
      setStatus('ready')
    }

    const handleMessage = (raw: string) => {
      try {
        const next = callbacksRef.current.parser(raw)
        setData((current) => callbacksRef.current.reducer?.(current, next) ?? next)
        setStatus('ready')
        setError(null)
        callbacksRef.current.onMessage?.(next)
      } catch (nextError) {
        setStatus('error')
        setError(nextError instanceof Error ? nextError : new Error('Failed to parse SSE message'))
      }
    }

    const source = openAuthenticatedSse(url, {
      onOpen: handleReady,
      onEvent: (eventName, raw) => {
        if (connectionEvents.includes(eventName)) handleReady()
        if (dataEvents.includes(eventName) || (eventName === 'message' && (listenToMessage || dataEvents.length === 0))) {
          handleMessage(raw)
        }
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
  }, [enabled, eventsKey, listenToMessage, readyEventsKey, reconnect, url, version])

  return { data, status, error, reconnect }
}
