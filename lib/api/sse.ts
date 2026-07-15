import { getClientAuthToken } from '@/lib/auth-session'
import { handleUnauthorized } from './unauthorized'
import type { YesNasRequestInit } from './request'

export interface SseConnection {
  close: () => void
}

interface SseHandlers {
  onOpen?: () => void
  onEvent: (event: string, data: string) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export function openAuthenticatedSse(url: string, handlers: SseHandlers): SseConnection {
  const controller = new AbortController()

  void (async () => {
    try {
      const token = getClientAuthToken()
      const init: YesNasRequestInit = {
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
        signal: controller.signal,
        yesnasSilentNetworkLoading: true,
      }
      const response = await fetch(url, init)

      if (response.status === 401) {
        handleUnauthorized()
        throw new Error('Unauthorized')
      }
      if (!response.ok) throw new Error(`SSE request failed (${response.status})`)
      if (!response.body) throw new Error('SSE response has no body')

      handlers.onOpen?.()
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventName = 'message'
      let dataLines: string[] = []

      const dispatch = () => {
        if (dataLines.length > 0) handlers.onEvent(eventName, dataLines.join('\n'))
        eventName = 'message'
        dataLines = []
      }

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line === '') dispatch()
          else if (line.startsWith('event:')) eventName = line.slice(6).trimStart()
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
        }
        if (done) {
          if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).trimStart())
          dispatch()
          break
        }
      }
      if (!controller.signal.aborted) handlers.onClose?.()
    } catch (error) {
      if (!controller.signal.aborted) {
        handlers.onError?.(error instanceof Error ? error : new Error('SSE connection failed'))
      }
    }
  })()

  return { close: () => controller.abort() }
}
