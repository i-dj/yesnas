'use client'

import { useEffect, useRef, useState } from 'react'

type UseSseStatus = 'idle' | 'connecting' | 'open' | 'error'

interface UseSseOptions<T> {
  event?: string
  enabled?: boolean
  parser?: (raw: string) => T
  onMessage?: (data: T) => void
}

interface UseSseResult<T> {
  data: T | null
  status: UseSseStatus
  error: Event | null
}

const defaultParser = <T>(raw: string) => raw as T

export function useSse<T = string>(url: string | null, options: UseSseOptions<T> = {}): UseSseResult<T> {
  const { event = 'message', enabled = true, parser = defaultParser, onMessage } = options

  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<UseSseStatus>('idle')
  const [error, setError] = useState<Event | null>(null)
  const parserRef = useRef(parser)
  const onMessageRef = useRef(onMessage)
  const lastRawRef = useRef<string | null>(null)

  useEffect(() => {
    parserRef.current = parser
  }, [parser])

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!url || !enabled) {
      setStatus('idle')
      return
    }

    const eventSource = new EventSource(url)
    setStatus('connecting')
    setError(null)

    const handleMessage = (messageEvent: MessageEvent<string>) => {
      if (messageEvent.data === lastRawRef.current) return
      lastRawRef.current = messageEvent.data
      try {
        const nextData = parserRef.current(messageEvent.data)
        setData(nextData)
        setStatus('open')
        onMessageRef.current?.(nextData)
      } catch (parseError) {
        console.error('Failed to parse SSE message', parseError)
      }
    }

    eventSource.onopen = () => {
      setStatus('open')
    }

    if (event === 'message') {
      eventSource.onmessage = handleMessage
    } else {
      eventSource.addEventListener(event, handleMessage as EventListener)
    }

    eventSource.onerror = (nextError) => {
      setError(nextError)
      setStatus('error')
    }

    return () => {
      if (event === 'message') {
        eventSource.onmessage = null
      } else {
        eventSource.removeEventListener(event, handleMessage as EventListener)
      }

      eventSource.close()
    }
  }, [url, event, enabled])

  return { data, status, error }
}
