import { toast } from '@/store/use-toast-store'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const BASE_URL = 'http://yesnas:8080/api/v1'

export interface ApiOptions {
  method?: HttpMethod
  body?: any
  headers?: Record<string, string>
  cache?: RequestCache
  silentNetworkLoading?: boolean
  throwOnError?: boolean
  toastError?: boolean
  errorMessage?: string
  unwrapList?: boolean
}

export interface YesNasRequestInit extends RequestInit {
  yesnasSilentNetworkLoading?: boolean
}
function unwrapList<T>(json: any): T[] {
  if (Array.isArray(json)) return json
  if (Array.isArray(json?.items)) return json.items
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.users)) return json.users
  return []
}
/**
 * 统一错误解析
 */
function parseErrorMessage(raw: string, fallback: string) {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed.message || parsed.error || parsed.code || raw
  } catch {
    return raw
  }
}

/**
 * 通用 request
 */
export async function request<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const init: YesNasRequestInit = {
    method: options.method || 'GET',
    cache: options.cache || 'no-store',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    yesnasSilentNetworkLoading: options.silentNetworkLoading,
  }
  const res = await fetch(BASE_URL + url, init)

  if (!res.ok) {
    const text = await res.text()
    const message = parseErrorMessage(text, `${options.method || 'GET'} ${url} failed`)
    throw new Error(message)
  }

  const json = await res.json()

  if (options.unwrapList) {
    return unwrapList<T>(json) as T
  }

  return json as T
}
