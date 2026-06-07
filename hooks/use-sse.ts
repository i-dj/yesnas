'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

    const source = new EventSource(url)
    const dataEvents = eventsKey ? eventsKey.split('\u0000') : []
    const connectionEvents = readyEventsKey ? readyEventsKey.split('\u0000') : []
    setStatus('connecting')
    setError(null)

    const handleReady = () => {
      setStatus('ready')
    }

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const next = callbacksRef.current.parser(event.data)
        setData((current) => callbacksRef.current.reducer?.(current, next) ?? next)
        setStatus('ready')
        setError(null)
        callbacksRef.current.onMessage?.(next)
      } catch (nextError) {
        setStatus('error')
        setError(nextError instanceof Error ? nextError : new Error('Failed to parse SSE message'))
      }
    }

    source.onopen = handleReady
    source.onerror = (nextError) => {
      setStatus('error')
      setError(nextError)
    }

    connectionEvents.forEach((eventName) => source.addEventListener(eventName, handleReady))
    dataEvents.forEach((eventName) => source.addEventListener(eventName, handleMessage as EventListener))
    if (listenToMessage || dataEvents.length === 0) source.onmessage = handleMessage

    return () => {
      connectionEvents.forEach((eventName) => source.removeEventListener(eventName, handleReady))
      dataEvents.forEach((eventName) => source.removeEventListener(eventName, handleMessage as EventListener))
      source.close()
    }
  }, [enabled, eventsKey, listenToMessage, readyEventsKey, url, version])

  return { data, status, error, reconnect }
}
