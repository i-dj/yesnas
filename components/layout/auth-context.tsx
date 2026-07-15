'use client'

import { authApi } from '@/lib/api/auth.api'
import {
  AUTH_EXPIRES_KEY,
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_KEY,
  AUTH_USER_COOKIE,
  AUTH_USER_KEY,
  serializeAuthUser,
} from '@/lib/auth-session'
import type { AuthUser, LoginPayload } from '@/types'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface AuthState {
  token: string | null
  user: AuthUser | null
  loading: boolean
  login: (payload: LoginPayload, remember?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthState | null>(null)

function setCookie(name: string, value: string, remember: boolean, expiresAt?: string) {
  const expires = remember && expiresAt ? `; expires=${new Date(expiresAt).toUTCString()}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${expires}; samesite=lax`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY) ?? sessionStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_EXPIRES_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(AUTH_EXPIRES_KEY)
}

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: AuthUser | null }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = readStoredUser()
    setToken(storedToken)
    setUser(storedToken ? storedUser : null)

    if (storedToken) {
      const remember = Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
      const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY) ?? sessionStorage.getItem(AUTH_EXPIRES_KEY) ?? undefined
      setCookie(AUTH_TOKEN_COOKIE, storedToken, remember, expiresAt)
      if (storedUser) {
        setCookie(AUTH_USER_COOKIE, serializeAuthUser(storedUser), remember, expiresAt)
      } else {
        clearCookie(AUTH_USER_COOKIE)
      }
    } else {
      clearCookie(AUTH_TOKEN_COOKIE)
      clearCookie(AUTH_USER_COOKIE)
    }
    setLoading(false)
  }, [])

  const updateUser = (nextUser: AuthUser) => {
    setUser(nextUser)
    const remember = Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
    const storage = remember ? localStorage : sessionStorage
    const expiresAt = storage.getItem(AUTH_EXPIRES_KEY) ?? undefined
    storage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser))
    setCookie(AUTH_USER_COOKIE, serializeAuthUser(nextUser), remember, expiresAt)
  }

  const login = async (payload: LoginPayload, remember = false) => {
    const response = await authApi.login(payload)
    clearStoredAuth()
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(AUTH_TOKEN_KEY, response.token)
    storage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))
    storage.setItem(AUTH_EXPIRES_KEY, response.expiresAt)
    setCookie(AUTH_TOKEN_COOKIE, response.token, remember, response.expiresAt)
    setCookie(AUTH_USER_COOKIE, serializeAuthUser(response.user), remember, response.expiresAt)
    setToken(response.token)
    setUser(response.user)
    return response.user
  }

  const logout = async () => {
    try {
      if (localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)) {
        await authApi.logout()
      }
    } finally {
      clearStoredAuth()
      clearCookie(AUTH_TOKEN_COOKIE)
      clearCookie(AUTH_USER_COOKIE)
      setToken(null)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      updateUser,
    }),
    [loading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
}
