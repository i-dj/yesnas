import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type StatusPillColor = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusPillProps {
  color: StatusPillColor
  content: ReactNode
  className?: string
}

const colorClassMap: Record<StatusPillColor, string> = {
  success: 'bg-emerald-500/5 text-emerald-400   dark:text-emerald-300',
  warning: 'bg-amber-500/5 text-amber-400  dark:text-amber-300',
  danger: 'bg-red-500/12 text-red-400  dark:text-red-300',
  neutral: 'bg-app-hover text-app-text-muted  ',
}

export function StatusPill({ color, content, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        colorClassMap[color],
        className,
      )}
    >
      {content}
    </span>
  )
}
