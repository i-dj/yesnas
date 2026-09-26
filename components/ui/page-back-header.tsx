'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageBackHeaderProps {
  title: ReactNode
  description?: ReactNode
  backAriaLabel?: string
  onBack: () => void
  className?: string
}

export function PageBackHeader({ title, description, backAriaLabel = '返回', onBack, className }: PageBackHeaderProps) {
  return (
    <header className={cn('space-y-3', className)}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="border-app-border text-app-text-muted hover:bg-app-hover hover:text-app-text inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
            aria-label={backAriaLabel}
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="app-page-title text-app-text">{title}</h1>
        </div>
        {description ? <p className="text-app-text-muted text-sm leading-6">{description}</p> : null}
      </div>
    </header>
  )
}
