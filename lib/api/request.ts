import { AUTH_TOKEN_COOKIE, getClientAuthToken } from '@/lib/auth-session'
import { handleUnauthorized } from './unauthorized'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const BASE_URL = 'http://yesnas:8080/api/v1'

export interface ApiOptions {
  method?: HttpMethod
  body?: unknown
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
function unwrapList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json
  if (!json || typeof json !== 'object') return []

  const record = json as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as T[]
  if (Array.isArray(record.data)) return record.data as T[]
  if (Array.isArray(record.users)) return record.users as T[]
  return []
}
/**
 * 统一错误解析
 */
function parseErrorMessage(raw: string, fallback: string) {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as {
      message?: string
      error?: string | { message?: string; code?: string }
      code?: string
    }
    if (typeof parsed.error === 'object' && parsed.error) {
      return parsed.error.message || parsed.error.code || fallback
    }
    return parsed.message || parsed.error || parsed.code || raw
  } catch {
    return raw
  }
}

async function getAuthToken() {
  if (typeof window !== 'undefined') {
    return getClientAuthToken()
  }

  try {
    const { cookies } = await import('next/headers')
    return (await cookies()).get(AUTH_TOKEN_COOKIE)?.value ?? null
  } catch {
    return null
  }
}

/**
 * 通用 request
 */
export async function request<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken()
  const init: YesNasRequestInit = {
    method: options.method || 'GET',
    cache: options.cache || 'no-store',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    yesnasSilentNetworkLoading: options.silentNetworkLoading,
  }
  const res = await fetch(BASE_URL + url, init)

  if (!res.ok) {
    if (res.status === 401 && url !== '/auth/login' && url !== '/auth/logout') {
      handleUnauthorized()
    }
    const text = await res.text()
    const message = parseErrorMessage(text, `${options.method || 'GET'} ${url} failed`)
    throw new Error(message)
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (options.unwrapList) {
    return unwrapList<T>(json) as T
  }

  return json as T
}
