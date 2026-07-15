import 'server-only'

import { AUTH_USER_COOKIE, TIME_ZONE_COOKIE, isValidTimeZone, parseAuthUser } from '@/lib/auth-session'
import type { AuthUser } from '@/types'
import { cookies } from 'next/headers'

export async function getRequestAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  return parseAuthUser(cookieStore.get(AUTH_USER_COOKIE)?.value)
}

export async function getRequestTimeZone(): Promise<string> {
  const cookieStore = await cookies()
  const value = cookieStore.get(TIME_ZONE_COOKIE)?.value
  return isValidTimeZone(value) ? value : 'UTC'
}
