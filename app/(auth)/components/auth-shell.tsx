'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { LanguageMenu } from '@/components/layout/language-menu'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  const locale = useLocale()
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#1C1D21] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-[#1C212A] lg:flex">
          <img src="/auth/nas-ai-login-dark.png" alt="" className="w-[82%] max-w-180 opacity-80" />
        </section>

        <section className="flex min-h-screen flex-col px-8 py-10 sm:px-16 lg:px-24">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-lg font-bold tracking-tight">
              <Image
                src="/logo-yesnas-v3.png"
                alt="YesNAS"
                width={98}
                height={28}
                className="h-7 w-auto object-contain"
                priority
              />
              <span>YesNAS</span>
            </div>
            <LanguageMenu currentLocale={locale} variant="auth" onChange={() => router.refresh()} />
          </div>

          <div className="flex flex-1 items-center justify-center py-12">{children}</div>

          <div className="text-sm text-white/40">&copy; YesNAS 2026</div>
        </section>
      </div>
    </main>
  )
}
