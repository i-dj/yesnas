'use client'

import { Theme } from '@radix-ui/themes'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { AuthUser } from '@/types'
import { TIME_ZONE_COOKIE } from '@/lib/auth-session'

import { ThemeProvider } from './next-themes-provider'
import { GlobalNetworkLoading } from './global-network-loading'
import { GlobalConfirmModal, ToastStack } from '@/components/ui'
import { AuthProvider } from './auth-context'
import { useToastStore } from '@/store/use-toast-store'

export function Providers({
  children,
  initialUser,
  initialTimeZone,
}: {
  children: React.ReactNode
  initialUser: AuthUser | null
  initialTimeZone: string
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider initialUser={initialUser}>
        <ClientPreferenceSync initialTimeZone={initialTimeZone} />
        <RadixThemeBridge>{children}</RadixThemeBridge>
      </AuthProvider>
    </ThemeProvider>
  )
}

function ClientPreferenceSync({ initialTimeZone }: { initialTimeZone: string }) {
  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!browserTimeZone || browserTimeZone === initialTimeZone) return

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; path=/; max-age=31536000; samesite=lax`
  }, [initialTimeZone])

  return null
}

function RadixThemeBridge({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.remove)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Theme
      appearance={mounted && resolvedTheme === 'dark' ? 'dark' : 'light'}
      accentColor="blue"
      panelBackground="translucent"
    >
      <GlobalNetworkLoading />
      <GlobalConfirmModal />
      <ToastStack toasts={toasts} onClose={removeToast} />
      {children}
    </Theme>
  )
}
