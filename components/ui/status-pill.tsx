import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type StatusPillColor = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface StatusPillProps {
  color: StatusPillColor
  content: ReactNode
  className?: string
  icon?: LucideIcon
}

const colorClassMap: Record<StatusPillColor, string> = {
  success: 'bg-[#063D2A] text-emerald-300',
  warning: 'bg-[#46320A] text-amber-300',
  danger: 'bg-[#45161B] text-red-300',
  info: 'bg-[#08365F] text-sky-300',
  neutral: 'bg-[#2A2C30] text-app-text-muted',
}

export function StatusPill({ color, content, className, icon: Icon }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        colorClassMap[color],
        className,
      )}
    >
      {Icon && <Icon size={14} strokeWidth={2} />} {content}
    </span>
  )
}
