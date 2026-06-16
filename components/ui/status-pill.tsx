import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type StatusPillColor = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusPillProps {
  color: StatusPillColor
  content: ReactNode
  className?: string
  icon?: LucideIcon
}

const colorClassMap: Record<StatusPillColor, string> = {
  success: '  text-emerald-400   dark:text-emerald-300',
  warning: '  text-amber-400  dark:text-amber-300',
  danger: '  text-red-400  dark:text-red-300',
  neutral: '  text-app-text-muted  ',
}

export function StatusPill({ color, content, className, icon: Icon }: StatusPillProps) {
  return (
    <span
      className={cn(
        'bg-app-hover/50 inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium',
        colorClassMap[color],
        className,
      )}
    >
      {Icon && <Icon size={14} strokeWidth={2} />} {content}
    </span>
  )
}
