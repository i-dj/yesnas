'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface AuthCardProps {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function AuthCard({ eyebrow, title, description, children, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        'w-full max-w-112.5',
        className,
      )}
    >
      <div>
        <h1 className="text-3xl leading-tight font-bold tracking-[-0.04em] text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{description || eyebrow}</p>
      </div>

      <div className="mt-7">{children}</div>
    </section>
  )
}
