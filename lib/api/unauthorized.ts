import { AUTH_UNAUTHORIZED_EVENT, clearClientAuth, getClientAuthToken } from '@/lib/auth-session'

export function handleUnauthorized() {
  if (typeof window === 'undefined' || !getClientAuthToken()) return

  clearClientAuth()
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))

  // AuthProvider normally handles navigation and the localized notification.
  // Keep a fallback for requests made before the provider has mounted.
  window.setTimeout(() => {
    if (window.location.pathname !== '/login') window.location.replace('/login')
  }, 100)
}
