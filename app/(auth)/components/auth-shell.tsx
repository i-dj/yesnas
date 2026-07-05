'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-white text-[#161922]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-[#f5f6fb] lg:flex">
          <img src="/auth/nas-ai-login.png" alt="" className="w-[86%] max-w-190" />
        </section>

        <section className="flex min-h-screen flex-col px-8 py-10 sm:px-16 lg:px-24">
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

          <div className="flex flex-1 items-center justify-center py-12">{children}</div>

          <div className="text-sm text-[#8c909b]">&copy; YesNAS 2026</div>
        </section>
      </div>
    </main>
  )
}
