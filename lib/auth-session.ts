import type { AuthUser } from '@/types'

export const AUTH_TOKEN_KEY = 'yesnas-auth-token'
export const AUTH_USER_KEY = 'yesnas-auth-user'
export const AUTH_EXPIRES_KEY = 'yesnas-auth-expires-at'
export const AUTH_TOKEN_COOKIE = 'yesnas-auth-token'
export const AUTH_USER_COOKIE = 'yesnas-auth-user'
export const TIME_ZONE_COOKIE = 'yesnas-time-zone'
export const AUTH_UNAUTHORIZED_EVENT = 'yesnas:unauthorized'

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

export function getClientAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearClientAuth() {
  if (typeof window === 'undefined') return

  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(AUTH_TOKEN_KEY)
    storage.removeItem(AUTH_USER_KEY)
    storage.removeItem(AUTH_EXPIRES_KEY)
  }
  clearCookie(AUTH_TOKEN_COOKIE)
  clearCookie(AUTH_USER_COOKIE)
}

export function serializeAuthUser(user: AuthUser): string {
  const avatar = user.avatar && !user.avatar.startsWith('data:') && user.avatar.length <= 1_000 ? user.avatar : ''

  return JSON.stringify({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar,
  } satisfies AuthUser)
}

export function parseAuthUser(value?: string | null): AuthUser | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<AuthUser>
    if (!parsed.id || !parsed.username) return null

    return {
      id: parsed.id,
      username: parsed.username,
      displayName: parsed.displayName ?? '',
      avatar: parsed.avatar ?? '',
    }
  } catch {
    return null
  }
}

export function isValidTimeZone(value?: string | null): value is string {
  if (!value) return false

  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}
