import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function OverviewCardHeader({
  icon: Icon,
  title,
  description,
  children,
  tone = 'neutral',
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
  tone?: 'neutral' | 'warning'
}) {
  return (
    <div className="border-app-border bg-app-bg/55 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            'grid size-5 shrink-0 place-items-center',
            tone === 'warning' ? 'text-amber-500' : 'text-app-text-muted',
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-app-text text-[15px] font-semibold whitespace-nowrap">{title}</h2>
          {description && <p className="text-app-text-muted mt-0.5 truncate text-xs">{description}</p>}
        </div>
      </div>
      <div className="flex min-w-0 shrink-0 items-center">{children}</div>
    </div>
  )
}
