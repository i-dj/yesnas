'use client'

import { Theme } from '@radix-ui/themes'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { ThemeProvider } from './next-themes-provider'
import { GlobalNetworkLoading } from './global-network-loading'
import { GlobalConfirmModal } from '@/components/ui/global-confirm-modal'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <RadixThemeBridge>{children}</RadixThemeBridge>
    </ThemeProvider>
  )
}

function RadixThemeBridge({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

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
      {children}
    </Theme>
  )
}
